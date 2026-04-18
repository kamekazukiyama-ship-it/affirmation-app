import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Language = 'ja' | 'en';

export interface Affirmation {  id: string;
  uri: string;
  cloudUrl?: string;
  title: string;
  text?: string;
  isFavorite?: boolean;
  date: number;
}

export interface Playlist {
  id: string;
  name: string;
  itemIds: string[];
  createdAt: number;
}

export interface SavedText {
  id: string;
  title: string;
  text: string;
  createdAt: number;
}

export interface CustomBgm {
  id: string;
  name: string;
  uri: string;
}

interface AppState {
  language: Language;
  hasSetLanguage: boolean;
  setLanguage: (lang: Language) => void;
  affirmations: Affirmation[];
  playlists: Playlist[];
  savedTexts: SavedText[];
  isDarkMode: boolean;
  bgmType: string;
  voiceVolume: number;
  bgmVolume: number;
  isNotificationEnabled: boolean;
  notificationTime: Date;
  isVisualizationEnabled: boolean;
  setIsVisualizationEnabled: (enabled: boolean) => void;
  addAffirmation: (aff: Affirmation) => void;
  removeAffirmation: (id: string) => void;
  toggleFavorite: (id: string) => void;
  updateTitle: (id: string, title: string) => void;
  toggleTheme: () => void;
  setBgmType: (type: string) => void;
  setVoiceVolume: (vol: number) => void;
  setBgmVolume: (vol: number) => void;
  setIsNotificationEnabled: (enabled: boolean) => void;
  setNotificationTime: (time: Date) => void;
  addPlaylist: (pl: Playlist) => void;
  updatePlaylist: (id: string, name: string, itemIds: string[]) => void;
  removePlaylist: (id: string) => void;
  addSavedText: (st: SavedText) => void;
  removeSavedText: (id: string) => void;

  listenedDays: Record<string, boolean>;
  currentStreak: number;
  longestStreak: number;
  markListenedToday: () => void;
  bgImageUrl: string | null;
  setBgImageUrl: (url: string | null) => void;
  elevenLabsApiKey: string | null;
  setElevenLabsApiKey: (key: string | null) => void;

  customBgms: CustomBgm[];
  addCustomBgm: (bgm: CustomBgm) => void;
  removeCustomBgm: (id: string) => void;

  // 収益化・ポイント関連
  userId: string | null;
  setUserId: (id: string | null) => void;
  pointBalance: number;
  setPointBalance: (balance: number) => void;
  membershipType: 'free' | 'premium';
  setMembershipType: (type: 'free' | 'premium') => void;
  resetForLogout: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      language: 'ja',
      hasSetLanguage: false,
      setLanguage: (lang) => set({ language: lang, hasSetLanguage: true }),
      affirmations: [],
      playlists: [],
      savedTexts: [],
      isDarkMode: false,
      bgmType: 'none',
      voiceVolume: 1.0,
      bgmVolume: 0.15,
      isNotificationEnabled: false,
      notificationTime: new Date(new Date().setHours(8, 0, 0, 0)),
      isVisualizationEnabled: true,
      setIsVisualizationEnabled: (enabled) => set({ isVisualizationEnabled: enabled }),
      
      listenedDays: {},
      currentStreak: 0,
      longestStreak: 0,
      
      bgImageUrl: null,
      setBgImageUrl: (url) => set({ bgImageUrl: url }),

      elevenLabsApiKey: null,
      setElevenLabsApiKey: (key) => set({ elevenLabsApiKey: key }),

      customBgms: [],
      addCustomBgm: (bgm) => set((state) => ({ customBgms: [...state.customBgms, bgm] })),
      removeCustomBgm: (id) => set((state) => ({ customBgms: state.customBgms.filter(b => b.id !== id) })),

      userId: null,
      setUserId: (id) => set({ userId: id }),
      pointBalance: 0,
      setPointBalance: (balance) => set({ pointBalance: balance }),
      membershipType: 'free',
      setMembershipType: (type) => set({ membershipType: type }),

      markListenedToday: () => set((state) => {
        const today = new Date();
        const tzOffset = today.getTimezoneOffset() * 60000;
        const localISOTime = (new Date(today.getTime() - tzOffset)).toISOString().split('T')[0];

        if (state.listenedDays[localISOTime]) return state;

        const newListenedDays = { ...state.listenedDays, [localISOTime]: true };
        const yesterdayDate = new Date(today.getTime() - 24 * 60 * 60 * 1000);
        const yesterdayISO = (new Date(yesterdayDate.getTime() - tzOffset)).toISOString().split('T')[0];

        let newStreak = 1;
        if (state.listenedDays[yesterdayISO]) {
          newStreak = (state.currentStreak || 0) + 1;
        }

        const newLongest = Math.max(state.longestStreak || 0, newStreak);

        return {
          listenedDays: newListenedDays,
          currentStreak: newStreak,
          longestStreak: newLongest
        };
      }),
      
      addAffirmation: (aff) => set((state) => ({ 
        affirmations: [aff, ...state.affirmations] 
      })),
      removeAffirmation: (id) => set((state) => ({
        affirmations: state.affirmations.filter(aff => aff.id !== id)
      })),
      toggleFavorite: (id) => set((state) => ({
        affirmations: state.affirmations.map(aff => 
          aff.id === id ? { ...aff, isFavorite: !aff.isFavorite } : aff
        )
      })),
      updateTitle: (id, title) => set((state) => ({
        affirmations: state.affirmations.map(aff =>
          aff.id === id ? { ...aff, title } : aff
        )
      })),
      toggleTheme: () => set((state) => ({ isDarkMode: !state.isDarkMode })),
      setBgmType: (type) => set({ bgmType: type }),
      setVoiceVolume: (vol) => set({ voiceVolume: vol }),
      setBgmVolume: (vol) => set({ bgmVolume: vol }),
      setIsNotificationEnabled: (enabled) => set({ isNotificationEnabled: enabled }),
      setNotificationTime: (time) => set({ notificationTime: time }),
      
      addPlaylist: (pl) => set((state) => ({ playlists: [pl, ...state.playlists] })),
      updatePlaylist: (id, name, itemIds) => set((state) => ({
        playlists: state.playlists.map(pl => pl.id === id ? { ...pl, name, itemIds } : pl)
      })),
      removePlaylist: (id) => set((state) => ({
        playlists: state.playlists.filter(pl => pl.id !== id)
      })),
      removeSavedText: (id) => set((state) => ({
        savedTexts: state.savedTexts.filter(st => st.id !== id)
      })),
      resetForLogout: () => set({
        userId: null,
        pointBalance: 0,
        membershipType: 'free',
        affirmations: [],
        playlists: [],
        savedTexts: [],
        elevenLabsApiKey: null,
        bgImageUrl: null,
        currentStreak: 0,
        longestStreak: 0,
        listenedDays: {}
      })
    }),
    {
      name: 'antigravity-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
