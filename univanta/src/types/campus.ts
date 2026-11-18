export type OpportunityCategory =
  | 'Hackathon'
  | 'Internship'
  | 'Scholarship'
  | 'Coding Competition'
  | 'Workshop'
  | 'Volunteering'
  | 'Conference'
  | 'Research'
  | 'Other';

export type OpportunityMode = 'Online' | 'Offline' | 'Hybrid';

export type VerificationStatus = 'Verified' | 'Unverified' | 'Pending Review' | 'Archived';

export type ApplicationStatus =
  | 'Saved'
  | 'Interested'
  | 'Applied'
  | 'Shortlisted'
  | 'Completed'
  | 'Archived';

export interface Opportunity {
  id: string;
  title: string;
  organisation: string;
  category: OpportunityCategory;
  description: string;
  objectives: string[];
  eligibility: string;
  academicRequirements: string;
  eligibleYears: number[]; // e.g. [1, 2, 3, 4], empty means open to all
  requiredSkills: string[];
  registrationDeadline: string; // ISO date YYYY-MM-DD
  eventStartDate?: string;
  eventEndDate?: string;
  mode: OpportunityMode;
  location: string;
  registrationFee?: string;
  rewards?: string;
  benefits: string[];
  applicationProcedure: string;
  registrationUrl?: string;
  contactEmail?: string;
  tags: string[];
  source: string; // e.g. 'SAMPLE DATA' | 'Student Scan' | 'Admin Curated'
  isSampleData: boolean;
  verificationStatus: VerificationStatus;
  createdAt: string;
  updatedAt: string;
}

export interface StudentProfile {
  uid: string;
  displayName: string;
  email: string;
  institution: string;
  course: string;
  branch: string;
  academicYear: number;
  graduationYear: number;
  skills: string[];
  interests: string[];
  preferredCategories: OpportunityCategory[];
  preferredMode: OpportunityMode | 'Any';
  locationPreference?: string;
  avatarUrl?: string;
  role: 'student' | 'demo_admin';
  updatedAt: string;
}

export interface UserOpportunityRecord {
  id: string;
  userId: string;
  opportunityId: string;
  status: ApplicationStatus;
  notes: string;
  reminderDate?: string;
  savedAt: string;
  updatedAt: string;
}

export interface ExtractedPosterField {
  value: string;
  confidence: 'extracted' | 'inferred' | 'not_specified';
}

export interface PosterScanResult {
  title: ExtractedPosterField;
  organisation: ExtractedPosterField;
  category: ExtractedPosterField;
  description: ExtractedPosterField;
  eligibility: ExtractedPosterField;
  academicYearRestrictions: ExtractedPosterField;
  skillsRequired: string[];
  skillsConfidence: 'extracted' | 'inferred' | 'not_specified';
  registrationDeadline: ExtractedPosterField;
  eventDates: ExtractedPosterField;
  mode: ExtractedPosterField;
  location: ExtractedPosterField;
  registrationFee: ExtractedPosterField;
  rewardsOrBenefits: ExtractedPosterField;
  registrationInstructions: ExtractedPosterField;
  contactDetails: ExtractedPosterField;
  registrationLink: ExtractedPosterField;
  safetyWarnings: string[];
  verificationChecklist: string[];
}

export interface ScanHistoryItem {
  id: string;
  userId: string;
  fileName: string;
  mimeType: string;
  extractedData: PosterScanResult;
  status: 'Reviewed' | 'Saved to Catalog' | 'Discarded';
  createdAt: string;
}

export type EligibilityStatus = 'Appears eligible' | 'Potentially eligible' | 'Not eligible';

export interface EligibilityEvaluation {
  opportunityId: string;
  status: EligibilityStatus;
  matchPercentage: number;
  matchingCriteria: string[];
  missingCriteria: string[];
  unclearRequirements: string[];
  explanation: string;
  suggestedActions: string[];
  evaluationMode: 'hybrid-ai' | 'deterministic-fallback';
  evaluatedAt: string;
}

export interface RecommendationItem {
  opportunityId: string;
  score: number;
  reason: string;
  matchedFactors: string[];
  mode: 'ai' | 'deterministic';
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'deadline' | 'saved' | 'status' | 'recommendation' | 'system';
  opportunityId?: string;
  read: boolean;
  createdAt: string;
}

export interface NotificationPreferences {
  deadline7Days: boolean;
  deadline3Days: boolean;
  statusUpdates: boolean;
  newRecommendations: boolean;
}
