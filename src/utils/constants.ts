export const LOCAL_STORAGE_KEY = "wb_state_v8";

export const RUN_STEPS: Record<string, string[]> = {
  "business-need": [
    "Reading stakeholder sources",
    "Isolating the core problem",
    "Extracting outcomes & success metrics",
  ],
  "requirement-analysis": [
    "Identifying users & goals",
    "Surfacing assumptions & constraints",
    "Flagging open questions",
  ],
  discovery: [
    "Checking for missing information",
    "Drafting clarifying questions",
    "Prioritising by ambiguity",
  ],
  epic: ["Grouping related work", "Writing the initiative", "Listing sub-features"],
  "user-story": ["Slicing the epic", "Applying the story template", "Drafting related stories"],
  "acceptance-criteria": [
    "Reading the story",
    "Writing Given / When / Then",
    "Adding edge-case scenarios",
  ],
  readiness: ["Scoring refinement", "Detecting dependencies", "Analysing risk & estimate"],
};
