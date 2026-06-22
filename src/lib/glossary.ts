// Plain-language explanations keyed by exact item text (mirrors prototype WB.explain).
// An item only shows the (?) affordance if it has an entry here.
export const EXPLAIN: Record<string, string> = {
  // Business Need — outcomes
  "Reduce sign-up abandonment at account creation":
    "Fewer people quit the sign-up form at the step where they create an account.",
  "Faster time-to-activation for new and enterprise users":
    "New and business customers reach their first real use of the product sooner after signing up.",
  "Fewer password-reset support tickets":
    "Less support time spent helping users who forgot or need to reset their password.",
  // Business Need — metrics
  "Account-creation drop-off below 20% (from 38%)":
    "Of everyone who starts creating an account, fewer than 20% abandon it — down from today's 38%.",
  "Password-reset tickets down 40%":
    "The number of support requests about resetting passwords falls by 40%.",
  "Activation rate +10 percentage points (pp) within first session":
    "The share of users who reach a meaningful first action rises by 10 percentage points during their very first visit. (A percentage point is an absolute change — e.g. 30% to 40%.)",
  // Requirement — users
  "New end users signing up on web": "First-time users creating an account through the website.",
  "Enterprise pilot users with work Google accounts":
    "Business customers trialing the product who sign in with their company-issued Google account.",
  "Returning users who forgot their password":
    "Existing users who can't get back in because they don't remember their password.",
  // Requirement — goals
  "Sign in without creating a new password":
    "Let people access the product without having to make and remember another password.",
  "Reuse an existing trusted identity (Google / Apple)":
    "Allow sign-in through an account the user already trusts, like Google or Apple, instead of a brand-new one.",
  "Keep accounts secure against takeover":
    "Make sure adding social login doesn't make it easier for an attacker to hijack someone's account.",
  // Requirement — assumptions
  "Most target users already have a Google or Apple account":
    "We're assuming the people we're targeting already own a Google or Apple account to sign in with.",
  "Provider OAuth (Open Authorization) is acceptable to the security team":
    "We expect security will approve using OAuth — the standard that lets one site grant access through another (e.g. Google) without ever sharing the password.",
  "Existing email/password sign-in stays available":
    "Traditional email-and-password login keeps working alongside the new social options.",
  // Requirement — constraints
  "Must pass an account-takeover security review":
    "Before launch, the security team must formally review and sign off that this feature can't be abused to seize control of someone's account — 'account takeover' is when an attacker gains access to a user's account.",
  "Limited provider data scope (compliance)":
    "For compliance reasons we may only request a minimal set of data from Google/Apple — not everything the provider could share.",
  "Web first; native mobile is a later phase":
    "The first release targets the website only; dedicated phone apps come in a later phase.",
  // Requirement — open questions
  "Which providers ship in version 1 (v1)?":
    "Still undecided: which identity providers (Google, Apple, Microsoft…) are included in the first release.",
  "How do we link a social identity to an existing email account?":
    "Still undecided: what should happen when someone signs in with Google but already has an email/password account here.",
  "What profile data do we request from providers?":
    "Still undecided: exactly which pieces of profile information we ask the provider to share.",
  // Epic — sub-features
  "Google sign-in (web)": "Let users sign in with their Google account on the website.",
  "Apple sign-in (web)": "Let users sign in with their Apple account on the website.",
  "Link social identity to existing email accounts":
    "Connect a Google/Apple login to an account the user already has, so they don't end up with a duplicate.",
  "Fallback to email/password when a provider is down":
    "If Google or Apple is unreachable, users can still get in with email and password.",
  "Consent & data-scope screen":
    "A screen that tells users what data we'll access and asks their permission before continuing.",
  "Account-takeover protection":
    "Safeguards that stop an attacker from using social login to break into an existing account.",
  // Readiness — recommendations
  'Split "account linking" into its own story — it carries its own edge cases.':
    "Account linking is complex enough to be its own story, so its edge cases get proper attention rather than being buried.",
  "Define the consent & data-scope copy with compliance before sprint.":
    "Agree the exact wording of the permission screen with compliance before development starts.",
  "Confirm Apple parity is truly in-scope for version 1 (v1).":
    "Double-check whether Apple sign-in really must match Google feature-for-feature in the first release.",
  // Readiness — dependencies
  "Auth service token handling":
    "Relies on the internal authentication service to issue and manage login tokens.",
  "Onboarding routing":
    "Relies on the onboarding flow correctly directing users to the right place after they sign in.",
  "Google OAuth client approval":
    "Requires Google to approve our OAuth application before it can be used in production.",
  "Apple Developer program config":
    "Requires setup in Apple's Developer program to enable Sign in with Apple.",
  // Readiness — risk reasons
  "External dependency on provider approval timelines":
    "We don't control how long Google/Apple take to approve us, which could delay the release.",
  "Account-takeover security review still pending":
    "The security sign-off needed before launch hasn't happened yet.",
  "Compliance data-scope not finalized":
    "We haven't locked down exactly what provider data we're allowed to request.",
};

export function getExplanation(text: string): string | undefined {
  return EXPLAIN[text];
}
