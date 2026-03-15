import { create } from 'zustand';
import type { OnlineMember } from '../../shared/types';
import type { ConnectionStatus } from '../services/socketService';

interface SocketState {
  connectionStatus: ConnectionStatus;
  onlineMembers: OnlineMember[];
  lastCaption: { text: string; userId: string; userName: string; timestamp: number } | null;

  setConnectionStatus: (status: ConnectionStatus) => void;
  setOnlineMembers: (members: OnlineMember[]) => void;
  addOnlineMember: (member: OnlineMember) => void;
  removeOnlineMember: (userId: string) => void;
  setLastCaption: (caption: { text: string; userId: string; userName: string; timestamp: number }) => void;
  updateMemberRole: (userId: string, role: 'operator' | 'standby') => void;
  reset: () => void;
}

export const useSocketStore = create<SocketState>((set) => ({
  connectionStatus: 'disconnected',
  onlineMembers: [],
  lastCaption: null,

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

  setLastCaption: (caption) => set({ lastCaption: caption }),

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
    }),
}));
