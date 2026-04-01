import { create } from 'zustand';

export interface Affirmation {
  id: string;
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
}

export const useAppStore = create<AppState>((set) => ({
  affirmations: [],
  playlists: [],
  savedTexts: [],
  isDarkMode: false, // デフォルトはライトモード（写真背景推奨）
  bgmType: 'none',
  voiceVolume: 1.0,
  bgmVolume: 0.15,
  isNotificationEnabled: false,
  notificationTime: new Date(new Date().setHours(8, 0, 0, 0)), // デフォルトは朝8時
  isVisualizationEnabled: true, // デフォルトはオン
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

  markListenedToday: () => set((state) => {
    // ローカルタイムゾーンでの YYYY-MM-DD を取得
    const today = new Date();
    const tzOffset = today.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(today.getTime() - tzOffset)).toISOString().split('T')[0];

    // すでに今日記録済みなら何もしない
    if (state.listenedDays[localISOTime]) return state;

    const newListenedDays = { ...state.listenedDays, [localISOTime]: true };

    // 昨日の日付を計算してストリーク判定
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
  addSavedText: (st) => set((state) => ({ savedTexts: [st, ...state.savedTexts] })),
  removeSavedText: (id) => set((state) => ({
    savedTexts: state.savedTexts.filter(st => st.id !== id)
  }))
}));
