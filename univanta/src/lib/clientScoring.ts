import type { Opportunity, StudentProfile } from '../types/campus.ts';
import { getDaysUntilDeadline } from './dateUtils.ts';

export function computeProfileFitScore(profile: StudentProfile, opp: Opportunity): number {
  let score = 45;

  const days = getDaysUntilDeadline(opp.registrationDeadline);
  if (days !== null && days < 0) {
    return 10;
  }

  if (opp.eligibleYears.length === 0 || opp.eligibleYears.includes(profile.academicYear)) {
    score += 18;
  } else {
    score -= 30;
  }

  if (profile.preferredCategories.includes(opp.category)) {
    score += 15;
  }

  const profileSkills = new Set(profile.skills.map((s) => s.toLowerCase()));
  const matchingSkills = opp.requiredSkills.filter((req) =>
    [...profileSkills].some((ps) => ps.includes(req.toLowerCase()) || req.toLowerCase().includes(ps))
  );
  if (opp.requiredSkills.length > 0) {
    score += Math.round((matchingSkills.length / opp.requiredSkills.length) * 20);
  }

  const haystack = `${opp.title} ${opp.description} ${opp.tags.join(' ')}`.toLowerCase();
  const matchedInterests = profile.interests.filter((i) => haystack.includes(i.toLowerCase()));
  score += Math.min(10, matchedInterests.length * 4);

  if (
    profile.preferredMode === 'Any' ||
    opp.mode === 'Hybrid' ||
    opp.mode === profile.preferredMode
  ) {
    score += 4;
  }

  return Math.max(5, Math.min(99, score));
}
