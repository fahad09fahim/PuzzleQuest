import { create } from "zustand";

interface GameState {
  soundEnabled: boolean;
  toggleSound: () => void;
  activeChapterId: string | null;
  setActiveChapterId: (id: string | null) => void;
}

export const useGameStore = create<GameState>((set) => ({
  soundEnabled: true,
  toggleSound: () => set((s) => ({ soundEnabled: !s.soundEnabled })),
  activeChapterId: null,
  setActiveChapterId: (id) => set({ activeChapterId: id }),
}));
