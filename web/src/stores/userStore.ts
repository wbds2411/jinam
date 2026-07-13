import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { secureStorage } from '../services/secureStorage.js';

export interface UserProfile {
  nickname: string;
  gender: 'male' | 'female' | '';
  birthDate: string; // YYYY-MM-DD
  birthTime: string; // HH:MM or ''
  birthTimeUnknown: boolean;
  birthLocation: { lat: number; lng: number; name: string; timeZoneOffsetMinutes: number } | null;
  useTrueSolarTime: boolean;
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
  cloudConsent: boolean;
  preferredLLM: string;
  theme: 'light' | 'dark' | 'night-soothing';
  reducedMotion: boolean;
  crisisRegion: string;
  onboardingDone: boolean;
  legalAcceptedAt: string;
  legalVersion: string;
  /** BYOK: 암호화 스토리지(secureStorage)에만 저장되며 서버로 전송하지 않는다. */
  apiKeys: { openai?: string; anthropic?: string };
}

export interface CheckIn {
  date: string; // YYYY-MM-DD
  energy: number;  // 0~10
  mood: number;    // 0~10
  focus: number;   // 0~10
  sleepHours: number | null;
}

export interface AssessmentRecord {
  id: 'dcs' | 'who5' | 'gad7' | 'phq9';
  total: number;
  flag: boolean; // 임계치 초과 여부
  suicidalityFlag?: boolean;
  takenAt: number;
}

interface UserState {
  profile: UserProfile;
  settings: UserSettings;
  checkIns: CheckIn[];
  assessments: AssessmentRecord[];
  setProfile: (profile: Partial<UserProfile>) => void;
  setSettings: (settings: Partial<UserSettings>) => void;
  toggleModule: (moduleId: string) => void;
  setModuleWeight: (moduleId: string, weight: number) => void;
  completeOnboarding: () => void;
  addCheckIn: (checkIn: CheckIn) => void;
  addAssessment: (record: AssessmentRecord) => void;
}

const defaultProfile: UserProfile = {
  nickname: '',
  gender: '',
  birthDate: '',
  birthTime: '',
  birthTimeUnknown: false,
  birthLocation: null,
  useTrueSolarTime: true,
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
  cloudConsent: false,
  preferredLLM: 'ollama',
  theme: 'light',
  reducedMotion: false,
  crisisRegion: 'KR',
  onboardingDone: false,
  legalAcceptedAt: '',
  legalVersion: '',
  apiKeys: {},
};

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      profile: defaultProfile,
      settings: defaultSettings,
      checkIns: [],
      assessments: [],
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
      addCheckIn: (checkIn) => {
        const rest = get().checkIns.filter(c => c.date !== checkIn.date);
        set({ checkIns: [...rest, checkIn].slice(-30) });
      },
      addAssessment: (record) => {
        set({ assessments: [...get().assessments, record].slice(-50) });
      },
    }),
    {
      name: 'jinam-user',
      storage: createJSONStorage(() => secureStorage),
      skipHydration: true,
      partialize: (state) => ({
        profile: state.profile,
        settings: state.settings,
        checkIns: state.checkIns,
        assessments: state.assessments,
      } as UserState),
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<UserState>;
        return {
          ...current,
          ...p,
          profile: { ...current.profile, ...(p.profile ?? {}) },
          settings: { ...current.settings, ...(p.settings ?? {}), apiKeys: { ...current.settings.apiKeys, ...(p.settings?.apiKeys ?? {}) } },
          checkIns: p.checkIns ?? [],
          assessments: p.assessments ?? [],
        };
      },
    }
  )
);
