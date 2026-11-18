import type {
  EligibilityEvaluation,
  Opportunity,
  RecommendationItem,
  StudentProfile,
} from '../src/types/campus.ts';

export function runDeterministicEligibility(
  profile: StudentProfile,
  opportunity: Opportunity
): {
  hardViolation: boolean;
  matchingCriteria: string[];
  missingCriteria: string[];
  unclearRequirements: string[];
  baseScore: number;
} {
  const matchingCriteria: string[] = [];
  const missingCriteria: string[] = [];
  const unclearRequirements: string[] = [];
  let hardViolation = false;
  let score = 50;

  // 1. Academic Year check
  if (opportunity.eligibleYears && opportunity.eligibleYears.length > 0) {
    if (opportunity.eligibleYears.includes(profile.academicYear)) {
      matchingCriteria.push(
        `Academic year matches (Year ${profile.academicYear} is within eligible years: ${opportunity.eligibleYears.join(', ')})`
      );
      score += 20;
    } else {
      hardViolation = true;
      missingCriteria.push(
        `Academic year mismatch: requires Year ${opportunity.eligibleYears.join(', ')}, while your profile is Year ${profile.academicYear}`
      );
      score -= 35;
    }
  } else {
    unclearRequirements.push(
      'Specific academic year limits are not strictly enumerated; verify the narrative eligibility text.'
    );
  }

  // 2. Deadline check
  const today = new Date().toISOString().slice(0, 10);
  if (opportunity.registrationDeadline && opportunity.registrationDeadline < today) {
    hardViolation = true;
    missingCriteria.push(
      `Registration deadline passed on ${opportunity.registrationDeadline}`
    );
    score -= 30;
  } else if (opportunity.registrationDeadline) {
    matchingCriteria.push(`Registration is open until ${opportunity.registrationDeadline}`);
    score += 5;
  }

  // 3. Skills overlap
  const studentSkillsLower = new Set(profile.skills.map((s) => s.trim().toLowerCase()));
  const matchedSkills: string[] = [];
  const missingSkills: string[] = [];

  for (const skill of opportunity.requiredSkills) {
    const normalized = skill.trim().toLowerCase();
    if (
      studentSkillsLower.has(normalized) ||
      [...studentSkillsLower].some((s) => s.includes(normalized) || normalized.includes(s))
    ) {
      matchedSkills.push(skill);
    } else {
      missingSkills.push(skill);
    }
  }

  if (opportunity.requiredSkills.length > 0) {
    if (matchedSkills.length > 0) {
      matchingCriteria.push(`Matching skills: ${matchedSkills.join(', ')}`);
      score += Math.round((matchedSkills.length / opportunity.requiredSkills.length) * 25);
    }
    if (missingSkills.length > 0) {
      missingCriteria.push(`Skills listed but not yet in your profile: ${missingSkills.join(', ')}`);
    }
  } else {
    unclearRequirements.push('No specific technical skills listed in structured requirements.');
  }

  // 4. Mode preference
  if (
    profile.preferredMode &&
    profile.preferredMode !== 'Any' &&
    opportunity.mode !== 'Hybrid' &&
    opportunity.mode !== profile.preferredMode
  ) {
    unclearRequirements.push(
      `Event mode is ${opportunity.mode}, whereas your preferred mode is ${profile.preferredMode}.`
    );
  } else {
    matchingCriteria.push(`Event mode (${opportunity.mode}) fits your mode preference.`);
    score += 5;
  }

  // 5. Natural-language caveats (GPA, branch, gender, recommendations)
  const eligLower = `${opportunity.eligibility} ${opportunity.academicRequirements}`.toLowerCase();
  if (eligLower.includes('cgpa') || eligLower.includes('gpa')) {
    unclearRequirements.push(
      'Requires minimum GPA/CGPA verification (GPA is not stored in your profile for privacy).'
    );
  }
  if (eligLower.includes('recommendation') || eligLower.includes('transcript')) {
    unclearRequirements.push('Requires supporting documents (transcript or referee contacts).');
  }
  if (eligLower.includes('women') || eligLower.includes('non-binary')) {
    unclearRequirements.push('Targeted demographic eligibility stated; self-verify before applying.');
  }

  const clampedScore = Math.max(5, Math.min(96, score));
  return {
    hardViolation,
    matchingCriteria,
    missingCriteria,
    unclearRequirements,
    baseScore: clampedScore,
  };
}

export function buildDeterministicEligibilityFallback(
  profile: StudentProfile,
  opportunity: Opportunity
): EligibilityEvaluation {
  const det = runDeterministicEligibility(profile, opportunity);

  let status: EligibilityEvaluation['status'] = 'Potentially eligible';
  if (det.hardViolation) {
    status = 'Not eligible';
  } else if (det.missingCriteria.length === 0 && det.unclearRequirements.length <= 1) {
    status = 'Appears eligible';
  }

  const suggestedActions: string[] = [];
  if (det.missingCriteria.length > 0) {
    suggestedActions.push('Review the unmet criteria carefully before investing time in an application.');
  }
  if (det.unclearRequirements.length > 0) {
    suggestedActions.push('Verify document, GPA, or demographic conditions directly on the organizer notice.');
  }
  if (!det.hardViolation) {
    suggestedActions.push('Save this opportunity to Deadline Radar to monitor the registration cutoff.');
  }

  return {
    opportunityId: opportunity.id,
    status,
    matchPercentage: det.baseScore,
    matchingCriteria: det.matchingCriteria,
    missingCriteria: det.missingCriteria,
    unclearRequirements: det.unclearRequirements,
    explanation: det.hardViolation
      ? 'Rule-based verification detected a mandatory requirement mismatch (such as academic year or expired deadline). Review the missing criteria below.'
      : 'Rule-based comparison indicates alignment on core structured fields, with any narrative conditions listed under unclear requirements for your manual confirmation.',
    suggestedActions,
    evaluationMode: 'deterministic-fallback',
    evaluatedAt: new Date().toISOString(),
  };
}

export function rankOpportunitiesDeterministically(
  profile: StudentProfile,
  opportunities: Opportunity[]
): RecommendationItem[] {
  const today = new Date().toISOString().slice(0, 10);
  const interestTokens = profile.interests.map((i) => i.toLowerCase());
  const skillTokens = profile.skills.map((s) => s.toLowerCase());

  const scored: RecommendationItem[] = [];

  for (const opp of opportunities) {
    if (opp.verificationStatus === 'Archived') continue;
    if (opp.registrationDeadline < today) continue;

    const det = runDeterministicEligibility(profile, opp);
    // Do not recommend an opportunity that clearly violates a mandatory condition
    if (det.hardViolation) continue;

    let relevanceScore = det.baseScore;
    const matchedFactors: string[] = [];

    if (profile.preferredCategories.includes(opp.category)) {
      relevanceScore += 14;
      matchedFactors.push(`Preferred category: ${opp.category}`);
    }

    const haystack = `${opp.title} ${opp.description} ${opp.tags.join(' ')}`.toLowerCase();
    const matchedInterests = interestTokens.filter((tok) => haystack.includes(tok));
    if (matchedInterests.length > 0) {
      relevanceScore += Math.min(16, matchedInterests.length * 6);
      matchedFactors.push(`Interests: ${matchedInterests.join(', ')}`);
    }

    const matchedSkills = opp.requiredSkills.filter((req) =>
      skillTokens.some((sk) => sk.includes(req.toLowerCase()) || req.toLowerCase().includes(sk))
    );
    if (matchedSkills.length > 0) {
      matchedFactors.push(`Skills: ${matchedSkills.join(', ')}`);
    }

    if (opp.eligibleYears.includes(profile.academicYear)) {
      matchedFactors.push(`Open to Year ${profile.academicYear}`);
    }

    const reason =
      matchedFactors.length > 0
        ? `Matches your profile via ${matchedFactors.join(' · ')}. Note: verify organiser details independently.`
        : `Open to your academic standing before the ${opp.registrationDeadline} deadline.`;

    scored.push({
      opportunityId: opp.id,
      score: Math.min(99, relevanceScore),
      reason,
      matchedFactors,
      mode: 'deterministic',
    });
  }

  return scored.sort((a, b) => b.score - a.score).slice(0, 6);
}
