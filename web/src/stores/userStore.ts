import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { secureStorage } from '../services/secureStorage.js';

export interface UserProfile {
  nickname: string;
  gender: 'male' | 'female' | '';
  birthDate: string; // YYYY-MM-DD
  birthTime: string; // HH:MM or ''
  birthTimeUnknown: boolean;
  birthLocation: { lat: number; lng: number; name: string } | null;
  calendarType: 'solar' | 'lunar';
  isLeapMonth: boolean;
  mbti: string;
  bloodType: string;
  healthContexts: string[];
}

export interface UserSettings {
  activeModules: string[];
  moduleWeights: Record<string, number>;
  privacyMode: boolean;
  preferredLLM: string;
  theme: 'light' | 'dark' | 'night-soothing';
  reducedMotion: boolean;
  crisisRegion: string;
  onboardingDone: boolean;
}

interface UserState {
  profile: UserProfile;
  settings: UserSettings;
  setProfile: (profile: Partial<UserProfile>) => void;
  setSettings: (settings: Partial<UserSettings>) => void;
  toggleModule: (moduleId: string) => void;
  setModuleWeight: (moduleId: string, weight: number) => void;
  completeOnboarding: () => void;
}

const defaultProfile: UserProfile = {
  nickname: '',
  gender: '',
  birthDate: '',
  birthTime: '',
  birthTimeUnknown: false,
  birthLocation: null,
  calendarType: 'solar',
  isLeapMonth: false,
  mbti: '',
  bloodType: '',
  healthContexts: [],
};

const defaultSettings: UserSettings = {
  activeModules: ['saju', 'astro', 'zodiac', 'psych', 'bigfive', 'attachment'],
  moduleWeights: { saju: 40, psych: 25, astro: 10, bigfive: 15, attachment: 10 },
  privacyMode: true,
  preferredLLM: 'ollama',
  theme: 'light',
  reducedMotion: false,
  crisisRegion: 'KR',
  onboardingDone: false,
};

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      profile: defaultProfile,
      settings: defaultSettings,
      setProfile: (p) => set({ profile: { ...get().profile, ...p } }),
      setSettings: (s) => set({ settings: { ...get().settings, ...s } }),
      toggleModule: (moduleId) => {
        const active = get().settings.activeModules;
        const next = active.includes(moduleId)
          ? active.filter(id => id !== moduleId)
          : [...active, moduleId];
        set({ settings: { ...get().settings, activeModules: next } });
      },
      setModuleWeight: (moduleId, weight) => {
        set({
          settings: {
            ...get().settings,
            moduleWeights: { ...get().settings.moduleWeights, [moduleId]: weight },
          },
        });
      },
      completeOnboarding: () => {
        set({ settings: { ...get().settings, onboardingDone: true } });
      },
    }),
    {
      name: 'jinam-user',
      storage: createJSONStorage(() => secureStorage),
      partialize: (state) => ({ profile: state.profile, settings: state.settings } as UserState),
    }
  )
);
