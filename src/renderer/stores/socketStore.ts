import { create } from 'zustand';
import type { OnlineMember } from '../../shared/types';
import type { ConnectionStatus } from '../services/socketService';

interface CaptionData {
  text: string;
  userId: string;
  userName: string;
  timestamp: number;
}

interface SocketState {
  connectionStatus: ConnectionStatus;
  onlineMembers: OnlineMember[];
  lastCaption: CaptionData | null;
  captionsByUser: Record<string, CaptionData>;

  setConnectionStatus: (status: ConnectionStatus) => void;
  setOnlineMembers: (members: OnlineMember[]) => void;
  addOnlineMember: (member: OnlineMember) => void;
  removeOnlineMember: (userId: string) => void;
  setLastCaption: (caption: CaptionData) => void;
  updateMemberRole: (userId: string, role: 'operator' | 'standby') => void;
  reset: () => void;
}

export const useSocketStore = create<SocketState>((set) => ({
  connectionStatus: 'disconnected',
  onlineMembers: [],
  lastCaption: null,
  captionsByUser: {},

  setConnectionStatus: (status) => set({ connectionStatus: status }),

  setOnlineMembers: (members) => set({ onlineMembers: members }),

  addOnlineMember: (member) =>
    set((state) => {
      // 중복 방지
      const exists = state.onlineMembers.some((m) => m.userId === member.userId);
      if (exists) return state;
      return { onlineMembers: [...state.onlineMembers, member] };
    }),

  removeOnlineMember: (userId) =>
    set((state) => ({
      onlineMembers: state.onlineMembers.filter((m) => m.userId !== userId),
    })),

  setLastCaption: (caption) => set((state) => ({
    lastCaption: caption,
    captionsByUser: { ...state.captionsByUser, [caption.userId]: caption },
  })),

  updateMemberRole: (userId, role) =>
    set((state) => ({
      onlineMembers: state.onlineMembers.map((m) =>
        m.userId === userId ? { ...m, role } : m
      ),
    })),

  reset: () =>
    set({
      connectionStatus: 'disconnected',
      onlineMembers: [],
      lastCaption: null,
      captionsByUser: {},
    }),
}));
