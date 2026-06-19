// src/lib/onboardingMappings.ts
// Pure UI-label → DB-enum mappers and the signup metadata builder.
// The Supabase trigger handle_new_user reads these keys verbatim, so the
// values here MUST match the live enums (see plan "Confirmed schema facts").

import type { SignupDraft } from './signupDraft';

/** Landing dob is "DD/MM/YYYY"; backend stores only birth_year (int). */
export function dobToBirthYear(dob: string): number | null {
  const parts = dob.split('/');
  if (parts.length !== 3) return null;
  const year = Number(parts[2]);
  if (!Number.isInteger(year) || year < 1900 || year > 2100) return null;
  return year;
}

/** CAREER_STAGES label → practice_enum. */
export function careerStageToPractice(stage: string): string {
  switch (stage) {
    case 'Student':      return 'student';
    case 'Early Career': return 'early_career';
    case 'Freelancer':   return 'freelance';
    case 'Employer':     return 'employer';
    default:             return 'prefer_not_to_say';
  }
}

/** OPPORTUNITY_OPTIONS label → open_to_work_enum. */
export function opportunityToOpenToWork(opt: string): string {
  switch (opt) {
    case 'Yes, actively looking':    return 'yes';
    case 'Depends on the project':   return 'depends_on_project';
    case 'Not right now':            return 'not_right_now';
    default:                         return 'not_sure'; // incl. "I don't know yet"
  }
}

/** SEEKER_PRACTICE_OPTIONS label → seeker_practice_enum. */
export function seekerPracticeToEnum(opt: string): string {
  switch (opt) {
    case 'Recruiter / Talent Scout': return 'recruiter_scout';
    case 'Creative Lead':            return 'creative_lead';
    case 'Producer / Casting':       return 'producer_casting';
    case 'Founder / Entrepreneur':   return 'founder';
    default:                         return 'prefer_not_to_say'; // incl. skip ('')
  }
}

/** TEAM_SIZE_OPTIONS label (en-dash \u2013 variants) → team_size_enum. */
export function teamSizeToEnum(label: string): string | null {
  switch (label) {
    case '1-3 people':   return 'size_1_3';
    case '4\u201310 people':  return 'size_4_10';
    case '11\u201325 people': return 'size_11_25';
    case '26\u201350 people': return 'size_26_50';
    case '50+ people':   return 'size_50_plus';
    default:             return null;
  }
}

/**
 * ProfileVerification onComplete (method,data) → org_verification method_check.
 * Live constraint allows: email_domain | social_instagram | social_linkedin | documentation.
 */
export function orgVerificationMethodToEnum(method: string, data: string): string | null {
  switch (method) {
    case 'email':    return 'email_domain';
    case 'document': return 'documentation';
    case 'social':   return data === 'instagram' ? 'social_instagram' : 'social_linkedin';
    default:         return null;
  }
}

/** Lowercase, trim, collapse whitespace to underscores; strip non handle chars. */
export function slugifyHandle(raw: string): string {
  return raw
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '');
}

export type Role = 'creator' | 'seeker' | 'studio' | 'brand';

export type OnboardingInputs = {
  role: Role;
  // creator
  careerStage?: string;        // raw CAREER_STAGES label
  selectedDisciplines?: string[];
  availabilityStatus?: string; // raw OPPORTUNITY_OPTIONS label
  projectPdfName?: string;
  // seeker
  seekerPractice?: string;     // raw SEEKER_PRACTICE_OPTIONS label
  seekerDisciplines?: string[];
  username?: string;           // creator + seeker handle
  // org (studio/brand)
  studioName?: string;
  studioLink?: string;
  studioDisciplines?: string[];
  teamSize?: string;           // raw TEAM_SIZE_OPTIONS label
  studioVerificationMethod?: string;
  studioVerificationData?: string;
  brandName?: string;
  brandLink?: string;
  brandIndustry?: string;
  brandDisciplines?: string[];
  brandVerificationMethod?: string;
  brandVerificationData?: string;
};

/**
 * Build the metadata object for supabase.auth.signUp options.data.
 * Keys here are consumed verbatim by the handle_new_user trigger.
 */
export function buildSignupMetadata(
  draft: SignupDraft,
  inputs: OnboardingInputs,
): Record<string, unknown> {
  const fullName = `${draft.firstName} ${draft.lastName}`.trim();

  const common: Record<string, unknown> = {
    role: inputs.role,
    first_name: draft.firstName,
    last_name: draft.lastName,
    birth_year: draft.birthYear,
    country: draft.country,
  };

  if (inputs.role === 'creator') {
    return {
      ...common,
      username: slugifyHandle(inputs.username ?? ''),
      display_name: fullName,
      practice: careerStageToPractice(inputs.careerStage ?? ''),
      disciplines: inputs.selectedDisciplines ?? [],
      open_to_work: opportunityToOpenToWork(inputs.availabilityStatus ?? ''),
      verification_file: inputs.projectPdfName
        ? `mock://files/${inputs.projectPdfName}`
        : '',
    };
  }

  if (inputs.role === 'seeker') {
    return {
      ...common,
      username: slugifyHandle(inputs.username ?? ''),
      display_name: fullName,
      scout_practice: seekerPracticeToEnum(inputs.seekerPractice ?? ''),
      disciplines: inputs.seekerDisciplines ?? [],
    };
  }

  // studio | brand
  const isStudio = inputs.role === 'studio';
  const orgName = (isStudio ? inputs.studioName : inputs.brandName) ?? '';
  const orgLink = (isStudio ? inputs.studioLink : inputs.brandLink) ?? '';
  const orgDisciplines = (isStudio ? inputs.studioDisciplines : inputs.brandDisciplines) ?? [];
  const industries = !isStudio && inputs.brandIndustry ? [inputs.brandIndustry] : [];
  const method = isStudio ? inputs.studioVerificationMethod : inputs.brandVerificationMethod;
  const data = isStudio ? inputs.studioVerificationData : inputs.brandVerificationData;

  return {
    ...common,
    username: slugifyHandle(orgName),
    display_name: orgName,
    website_url: orgLink,
    disciplines: orgDisciplines,
    industries,
    team_size: teamSizeToEnum(inputs.teamSize ?? ''),
    verification_method: method ? (orgVerificationMethodToEnum(method, data ?? '') ?? '') : '',
    verification_data: data ? { detail: data } : null,
  };
}
