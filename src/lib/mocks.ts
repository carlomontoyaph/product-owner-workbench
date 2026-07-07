import type {
  StageId,
  BusinessNeedData,
  RequirementData,
  DiscoveryData,
  EpicData,
  UserStoryData,
  AcData,
  ReadinessData,
  StageData,
} from "./types";

// Seeded sample outputs — "Social Login" scenario. Used when liveAI is off.

export const MOCK_BUSINESS_NEED: BusinessNeedData = {
  businessProblem:
    "New users abandon sign-up because creating yet another password adds friction — most acutely for enterprise users who expect to use an existing work account.",
  outcomes: [
    "Reduce sign-up abandonment at account creation",
    "Faster time-to-activation for new and enterprise users",
    "Fewer password-reset support tickets",
    "Account-creation drop-off below 20% (from 38%)",
    "Password-reset tickets down 40%",
    "Activation rate +10 percentage points (pp) within first session",
  ],
  confidence: 88,
  improvementTips: [
    "Consider adding a timeline for when each outcome should be measurable.",
    "Consider quantifying the business impact in revenue or customer lifetime value terms.",
  ],
};

export const MOCK_REQUIREMENT: RequirementData = {
  users: [
    "New end users signing up on web",
    "Enterprise pilot users with work Google accounts",
    "Returning users who forgot their password",
  ],
  goals: [
    "Sign in without creating a new password",
    "Reuse an existing trusted identity (Google / Apple)",
    "Keep accounts secure against takeover",
  ],
  assumptions: [
    "Most target users already have a Google or Apple account",
    "Provider OAuth (Open Authorization) is acceptable to the security team",
    "Existing email/password sign-in stays available",
  ],
  constraints: [
    "Must pass an account-takeover security review",
    "Limited provider data scope (compliance)",
    "Web first; native mobile is a later phase",
  ],
  openQuestions: [
    "Which providers ship in version 1 (v1)?",
    "How do we link a social identity to an existing email account?",
    "What profile data do we request from providers?",
  ],
  confidence: 84,
  improvementTips: [
    "Add explicit user roles or personas beyond generic descriptions.",
    "Clarify which goals are must-haves vs. nice-to-haves.",
  ],
};

export const MOCK_DISCOVERY: DiscoveryData = {
  questions: [
    {
      id: "q1",
      q: "Which identity providers must launch in v1?",
      opts: [],
      why: "The number and type of OAuth providers directly determines integration scope and sprint load — one provider vs. three is a significant effort difference and affects both auth and security review timelines.",
      examples: ["Google only", "Google + Apple", "Google + Apple + Microsoft", "All major providers (Google, Apple, Microsoft, GitHub)"],
      origin: "open",
    },
    {
      id: "q2",
      q: "Should social login link to an existing email/password account, or create a separate account identity?",
      opts: [],
      why: "This design choice affects onboarding UX, account recovery, and data migration strategy. Linking requires reconciliation logic and user consent; separate accounts simplify the immediate build but fragment user identity.",
      examples: ["Link social to existing email accounts automatically", "Create a separate social-only account identity", "Prompt the user to choose", "Link only if email verified, else create new"],
      origin: "open",
    },
    {
      id: "q3",
      q: "What is the minimum user profile data we request from each provider?",
      opts: [],
      why: "Scope determines both technical implementation and privacy/compliance burden. Requesting only email is simpler; requesting name, avatar, and more fields improves onboarding UX but increases data handling requirements.",
      examples: ["Email only", "Email + name", "Email + name + profile photo", "Email + name + birthday + location"],
      origin: "open",
    },
    {
      id: "q4",
      q: "If a provider is temporarily unavailable, what is the user experience?",
      opts: [],
      why: "This edge case affects reliability and fallback behavior. Allowing password fallback improves uptime but requires password infrastructure; blocking sign-in keeps the experience simple but impacts availability.",
      examples: ["Fall back to email/password sign-in", "Show retry UI and wait for provider recovery", "Block sign-in and show an error message", "Allow backup authentication method"],
      origin: "edge",
    },
  ],
  confidence: 91,
  improvementTips: [
    "All questions target critical design decisions that affect sprint scope and UX.",
  ],
};

export const MOCK_EPIC: EpicData = {
  title: "Social Login (OAuth Sign-in)",
  description:
    "Let users sign up and sign in with trusted third-party identity providers to reduce sign-up friction and password-related support load, starting with Google and Apple on web.",
  subFeatures: [
    "Enable sign-up with Google to reduce friction",
    "Enable sign-up with Apple to expand platform reach",
    "Link existing accounts to social identities to migrate users",
    "Fallback gracefully when a provider is unavailable",
    "Request user consent for required scopes transparently",
    "Prevent account takeover through identity verification",
  ],
  confidence: 86,
  improvementTips: [
    "Consider adding a timeline or release phase to the epic description.",
  ],
};

export const MOCK_USER_STORY: UserStoryData = {
  stories: [
    {
      as: "a new user",
      want: "to sign up using my Google account",
      so: "I can start using the product without creating another password",
    },
    {
      as: "an iPhone user",
      want: "to sign in with Apple",
      so: "I can use Face ID instead of a password",
    },
    {
      as: "a returning user",
      want: "my Google sign-in linked to my existing account",
      so: "I don't create a duplicate",
    },
    {
      as: "any user",
      want: "email/password to still work if a provider is down",
      so: "I'm never locked out",
    },
    {
      as: "a user",
      want: "to see consent requests before my data is shared",
      so: "I understand what scope each provider is accessing",
    },
    {
      as: "a security-conscious user",
      want: "to verify my identity before linking social accounts",
      so: "no one can take over my account with a stolen social login",
    },
  ],
  confidence: 89,
  improvementTips: [
    "All user roles are clearly defined and distinct.",
  ],
};

export const MOCK_AC: AcData = {
  rows: [
    {
      story: {
        as: "a new user",
        want: "to sign up using my Google account",
        so: "I can start using the product without creating another password",
      },
      normal: [
        'Given a new visitor on the sign-up page, when they choose "Continue with Google" and authorize the requested scopes, then an account is created and they are signed in.',
        "The name and email returned by Google are saved to the new account and the user is routed to onboarding.",
      ],
      abnormal: [
        "Given the user cancels the Google consent screen, when they return to the app, then no account is created and a clear message is shown.",
        "Given Google is unreachable, when sign-up is attempted, then email/password sign-up is offered as a fallback.",
      ],
    },
    {
      story: {
        as: "an iPhone user",
        want: "to sign in with Apple",
        so: "I can use Face ID instead of a password",
      },
      normal: [
        "Given an iPhone user with an Apple ID, when they tap \"Sign in with Apple\" and pass Face ID, then they are signed in.",
      ],
      abnormal: [
        'Given the user selects "Hide My Email", when they sign in, then a private-relay address is stored and sign-in still succeeds.',
        "Given Face ID fails, when the user retries, then they can fall back to the device passcode.",
      ],
    },
    {
      story: {
        as: "a returning user",
        want: "my Google sign-in linked to my existing account",
        so: "I don't create a duplicate",
      },
      normal: [
        "Given an account already exists for the user's email, when they sign in with Google using that email, then the Google identity is linked to the existing account — no duplicate is created.",
      ],
      abnormal: [
        "Given the Google email matches a different existing account, when linking is attempted, then ownership must be verified before the link is made.",
        "Given linking fails partway, when the error occurs, then no partial link is saved.",
      ],
    },
    {
      story: {
        as: "any user",
        want: "email/password to still work if a provider is down",
        so: "I'm never locked out",
      },
      normal: [
        "Given a provider is unavailable, when the user chooses email/password, then they can sign in normally.",
      ],
      abnormal: [
        "Given a provider times out mid-flow, when the timeout occurs, then an error is shown and email/password is offered without losing entered data.",
      ],
    },
  ],
  confidence: 90,
  improvementTips: [
    "All criteria follow the Given-When-Then format consistently.",
  ],
};

export const MOCK_READINESS: ReadinessData = {
  refinementScore: 82,
  recommendations: [
    'Split "account linking" into its own story — it carries its own edge cases.',
    "Define the consent & data-scope copy with compliance before sprint.",
    "Confirm Apple parity is truly in-scope for version 1 (v1).",
  ],
  dependencies: {
    internal: ["Auth service token handling", "Onboarding routing"],
    external: ["Google OAuth client approval", "Apple Developer program config"],
  },
  risk: {
    level: "Medium",
    reasons: [
      "External dependency on provider approval timelines",
      "Account-takeover security review still pending",
      "Compliance data-scope not finalized",
    ],
  },
  estimate: {
    points: 8,
    rationale:
      "Multiple providers plus account-linking and a security review; spans auth and onboarding teams.",
  },
  confidence: 82,
  improvementTips: [
    "Assign clear owners to each dependency.",
    "Document the security review acceptance criteria upfront.",
  ],
};

export const STAGE_MOCKS: Partial<Record<StageId, StageData>> = {
  "business-need": MOCK_BUSINESS_NEED,
  "requirement-analysis": MOCK_REQUIREMENT,
  discovery: MOCK_DISCOVERY,
  epic: MOCK_EPIC,
  "user-story": MOCK_USER_STORY,
  "acceptance-criteria": MOCK_AC,
  readiness: MOCK_READINESS,
};

export function getMock(stageId: StageId): StageData {
  return STAGE_MOCKS[stageId] ?? null;
}

// Input source samples
export const SOURCES = [
  {
    id: "slack",
    label: "Slack",
    icon: "slack",
    meta: "#product-feedback · 4 messages",
    hint: "Paste the Slack thread — messages, names and timestamps are fine.",
    placeholder: "Paste the raw Slack messages…",
    text: `@here can we PLEASE add Google login? half the support tickets this week are password resets 😩\nSomeone in the enterprise pilot also asked for "sign in with my work account".\n+1 — Apple login on iPhone would be nice too\ndo we know if security is ok with this?`,
  },
  {
    id: "email",
    label: "Email",
    icon: "mail",
    meta: "From: Vice President, Sales · Re: pilot drop-off",
    hint: "Paste the email — sender, subject and body.",
    placeholder: "Paste the email thread…",
    text: `Two enterprise prospects stalled at sign-up this week. Both said they "expected to just use their work Google account."\nThis is now the #1 friction point I'm hearing in demos. Can we prioritize for next quarter?`,
  },
  {
    id: "notes",
    label: "Meeting notes",
    icon: "notes",
    meta: "Onboarding sync · 12 Jun",
    hint: "Paste your raw meeting notes.",
    placeholder: "Paste meeting notes…",
    text: `- Onboarding funnel: 38% drop at account creation\n- Hypothesis: friction from "yet another password"\n- Consider social login / single sign-on (SSO)\n- Security flagged account-takeover concerns\n- Open: which providers, and how do we handle existing accounts?`,
  },
  {
    id: "transcript",
    label: "Transcript",
    icon: "transcript",
    meta: "Discovery call · auto-captured",
    hint: "Paste the call transcript.",
    placeholder: "Paste the call transcript…",
    text: `"...basically people don't want another password. If we let them sign in with Google or Apple, we think activation goes up.\nWe're not sure about Microsoft yet. And compliance asked what data we'd actually pull from these providers..."`,
  },
  {
    id: "free",
    label: "Free text",
    icon: "text",
    meta: "Typed into intake · you",
    hint: "Describe the request in your own words.",
    placeholder: "Type or paste the raw stakeholder request…",
    text: "",
  },
];
