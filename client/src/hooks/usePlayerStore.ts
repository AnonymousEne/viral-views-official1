import { create } from 'zustand';

interface Track {
  id: string;
  title: string;
  artist: string;
  audioUrl: string;
  coverImage?: string;
  duration?: number;
}

interface PlayerState {
  currentTrack: Track | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  playlist: Track[];
  currentIndex: number;
  isShuffled: boolean;
  repeatMode: 'none' | 'one' | 'all';
}

interface PlayerActions {
  setCurrentTrack: (track: Track) => void;
  setPlaylist: (tracks: Track[], startIndex?: number) => void;
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  next: () => void;
  previous: () => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  clearPlayer: () => void;
}

type PlayerStore = PlayerState & PlayerActions;

export const usePlayerStore = create<PlayerStore>((set, get) => ({
  // Initial State
  currentTrack: null,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  volume: 1,
  isMuted: false,
  playlist: [],
  currentIndex: -1,
  isShuffled: false,
  repeatMode: 'none' as const,

  // Actions
  setCurrentTrack: (track: Track) => {
    set({
      currentTrack: track,
      currentTime: 0,
      playlist: [track],
      currentIndex: 0
    });
  },

  setPlaylist: (tracks: Track[], startIndex = 0) => {
    set({
      playlist: tracks,
      currentIndex: startIndex,
      currentTrack: tracks[startIndex] || null,
      currentTime: 0
    });
  },

  play: () => set({ isPlaying: true }),
  pause: () => set({ isPlaying: false }),
  
  togglePlay: () => {
    const { isPlaying } = get();
    set({ isPlaying: !isPlaying });
  },

  next: () => {
    const { playlist, currentIndex, isShuffled, repeatMode } = get();
    if (playlist.length === 0) return;

    let nextIndex: number;
    
    if (isShuffled) {
      nextIndex = Math.floor(Math.random() * playlist.length);
    } else {
      nextIndex = currentIndex + 1;
      if (nextIndex >= playlist.length) {
        nextIndex = repeatMode === 'all' ? 0 : playlist.length - 1;
      }
    }

    set({
      currentIndex: nextIndex,
      currentTrack: playlist[nextIndex],
      currentTime: 0
    });
  },

  previous: () => {
    const { playlist, currentIndex } = get();
    if (playlist.length === 0) return;

    let prevIndex = currentIndex - 1;
    if (prevIndex < 0) {
      prevIndex = playlist.length - 1;
    }

    set({
      currentIndex: prevIndex,
      currentTrack: playlist[prevIndex],
      currentTime: 0
    });
  },

  setCurrentTime: (time: number) => set({ currentTime: time }),
  setDuration: (duration: number) => set({ duration }),
  setVolume: (volume: number) => set({ volume, isMuted: volume === 0 }),
  
  toggleMute: () => {
    const { isMuted, volume } = get();
    set({ isMuted: !isMuted });
  },

  toggleShuffle: () => {
    const { isShuffled } = get();
    set({ isShuffled: !isShuffled });
  },

  toggleRepeat: () => {
    const { repeatMode } = get();
    const modes: ('none' | 'one' | 'all')[] = ['none', 'one', 'all'];
    const currentModeIndex = modes.indexOf(repeatMode);
    const nextMode = modes[(currentModeIndex + 1) % modes.length];
    set({ repeatMode: nextMode });
  },

  clearPlayer: () => {
    set({
      currentTrack: null,
      isPlaying: false,
      currentTime: 0,
      duration: 0,
      playlist: [],
      currentIndex: -1
    });
  }
}));
