import { create } from 'zustand';

export interface Affirmation {
  id: string;
  uri: string;
  title: string;
  text?: string;
  isFavorite?: boolean;
  date: number;
}

interface AppState {
  affirmations: Affirmation[];
  isDarkMode: boolean;
  bgmType: string;
  voiceVolume: number;
  bgmVolume: number;
  isNotificationEnabled: boolean;
  notificationTime: Date;
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
}

export const useAppStore = create<AppState>((set) => ({
  affirmations: [],
  isDarkMode: true, // デフォルトはダークモード
  bgmType: 'none',
  voiceVolume: 1.0,
  bgmVolume: 0.15,
  isNotificationEnabled: false,
  notificationTime: new Date(new Date().setHours(8, 0, 0, 0)), // デフォルトは朝8時
  
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
}));
