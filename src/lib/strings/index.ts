// All user-facing copy lives here (i18n-ready, NFR-4). Hindi/Gujarati later.

export const strings = {
  appName: 'EDGE',
  tagline: 'Every Node, Connected.',
  tabs: {
    explore: 'Explore',
    tickets: 'Tickets',
    create: 'Create',
    profile: 'Profile',
  },
  signIn: {
    title: 'Sign in to EDGE',
    subtitle:
      'Use your @paruluniversity.ac.in email to be verified instantly. No Parul email yet? Use any email and your student ID.',
    google: 'Continue with Google',
    or: 'or',
    email: 'Email',
    password: 'Password',
    submitSignIn: 'Sign in',
    submitSignUp: 'Create account',
    toggleToSignUp: 'New here? Create an account',
    toggleToSignIn: 'Already have an account? Sign in',
    checkEmail: 'Check your inbox to confirm your email, then sign in.',
    loading: 'Connecting your node…',
  },
  placeholder: {
    comingSoon: 'Coming soon',
  },
  profile: {
    signOut: 'Sign out',
    verified: 'Verified',
    unverified: 'Unverified',
  },
  errors: {
    generic: 'Something went wrong. Please try again.',
    not_authenticated: 'Please sign in again.',
    invalid_student_id: 'Enter your student ID like 25UG030303.',
    invalid_student_id_year: 'The year at the start of your student ID looks wrong.',
    invalid_phone: 'Enter a 10-digit Indian mobile number.',
    invalid_personal_email: 'Enter a valid personal email.',
    personal_email_is_parul: 'Your personal email can’t be a Parul email.',
    institute_other_required: 'Type your institute name.',
    consent_required: 'Please accept the Terms & Privacy Policy to continue.',
    student_id_taken: 'This ID is already registered. Contact support.',
    incomplete_profile: 'Please fill in every field.',
    invalid_credentials: 'Wrong email or password.',
  },
} as const;

export type ErrorCode = keyof typeof strings.errors;

export function errorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error ?? '');
  if (/invalid login credentials/i.test(message)) return strings.errors.invalid_credentials;
  return message in strings.errors
    ? strings.errors[message as ErrorCode]
    : strings.errors.generic;
}
