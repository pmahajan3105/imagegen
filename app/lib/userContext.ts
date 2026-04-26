export type StatedPresentation = "masculine" | "feminine" | "androgynous";
export type MaintenanceTolerance = "low" | "medium" | "high";
export type HairChangeTolerance = "keep-current" | "small-change" | "open-to-change";
export type Climate = "tropical" | "temperate" | "cold" | "variable";

export type UserProfileContext = {
  presentation?: StatedPresentation;
  stylePreferences: string[];
  hardAvoids: string[];
  softPreferences: string[];
  maintenance?: MaintenanceTolerance;
  hairChangeTolerance?: HairChangeTolerance;
  wearsMakeup?: boolean;
  climate?: Climate;
};

// Per-run, not per-portrait. `occasions` lets the user subset which Outfit Style
// Guide columns get rendered for a single run; `freeTextNote` is appended as
// "Occasion context" to opt-in prompts.
export type OccasionId = "work" | "casual" | "event";

export type SessionContext = {
  occasions?: OccasionId[];
  freeTextNote?: string;
};

export const EMPTY_USER_PROFILE_CONTEXT: UserProfileContext = {
  stylePreferences: [],
  hardAvoids: [],
  softPreferences: []
};

export const EMPTY_SESSION_CONTEXT: SessionContext = {};
