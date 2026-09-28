export type OnboardingProfile = {
  name: string;
  email: string;
  role: string;
  organization: string;
  segment: string;
  goal: string;
  workspaceType: "symco" | "independent";
};

export type OnboardingState = {
  completed: boolean;
  tutorialSeen: boolean;
  profile: OnboardingProfile;
};

const KEY = "symos-onboarding-v1";
const initial: OnboardingState = {
  completed: false,
  tutorialSeen: false,
  profile: {
    name: "",
    email: "",
    role: "",
    organization: "",
    segment: "",
    goal: "",
    workspaceType: "symco",
  },
};

export function loadOnboarding(): OnboardingState {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || "null");
    if (saved && typeof saved.completed === "boolean") {
      return {
        ...initial,
        ...saved,
        profile: { ...initial.profile, ...saved.profile },
      };
    }
  } catch {
    // A blocked or corrupt store leaves the introduction usable in memory.
  }
  return initial;
}

export function saveOnboarding(state: OnboardingState): boolean {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}
