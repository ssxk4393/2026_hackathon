import { describe, it, expect, beforeEach } from 'vitest';
import { useSocketStore } from './socketStore';
import type { OnlineMember } from '../../shared/types';

describe('socketStore', () => {
  beforeEach(() => {
    // Reset store to initial state
    useSocketStore.getState().reset();
  });

  describe('addOnlineMember', () => {
    it('should add a member to onlineMembers', () => {
      const member: OnlineMember = { userId: 'u1', name: 'User 1', role: 'operator' };

      useSocketStore.getState().addOnlineMember(member);

      const state = useSocketStore.getState();
      expect(state.onlineMembers).toHaveLength(1);
      expect(state.onlineMembers[0]).toEqual(member);
    });

    it('should prevent duplicate members', () => {
      const member: OnlineMember = { userId: 'u1', name: 'User 1', role: 'operator' };

      useSocketStore.getState().addOnlineMember(member);
      useSocketStore.getState().addOnlineMember(member);

      const state = useSocketStore.getState();
      expect(state.onlineMembers).toHaveLength(1);
    });

    it('should add multiple different members', () => {
      const member1: OnlineMember = { userId: 'u1', name: 'User 1', role: 'operator' };
      const member2: OnlineMember = { userId: 'u2', name: 'User 2', role: 'standby' };

      useSocketStore.getState().addOnlineMember(member1);
      useSocketStore.getState().addOnlineMember(member2);

      const state = useSocketStore.getState();
      expect(state.onlineMembers).toHaveLength(2);
    });
  });

  describe('removeOnlineMember', () => {
    it('should remove a member by userId', () => {
      const member: OnlineMember = { userId: 'u1', name: 'User 1', role: 'operator' };
      useSocketStore.getState().addOnlineMember(member);

      useSocketStore.getState().removeOnlineMember('u1');

      const state = useSocketStore.getState();
      expect(state.onlineMembers).toHaveLength(0);
    });

    it('should only remove the specified member', () => {
      const member1: OnlineMember = { userId: 'u1', name: 'User 1', role: 'operator' };
      const member2: OnlineMember = { userId: 'u2', name: 'User 2', role: 'standby' };
      useSocketStore.getState().addOnlineMember(member1);
      useSocketStore.getState().addOnlineMember(member2);

      useSocketStore.getState().removeOnlineMember('u1');

      const state = useSocketStore.getState();
      expect(state.onlineMembers).toHaveLength(1);
      expect(state.onlineMembers[0].userId).toBe('u2');
    });

    it('should handle removing non-existent member gracefully', () => {
      useSocketStore.getState().removeOnlineMember('non-existent');

      const state = useSocketStore.getState();
      expect(state.onlineMembers).toHaveLength(0);
    });
  });

  describe('updateMemberRole', () => {
    it('should change the role of a member', () => {
      const member: OnlineMember = { userId: 'u1', name: 'User 1', role: 'standby' };
      useSocketStore.getState().addOnlineMember(member);

      useSocketStore.getState().updateMemberRole('u1', 'operator');

      const state = useSocketStore.getState();
      expect(state.onlineMembers[0].role).toBe('operator');
    });

    it('should not affect other members', () => {
      const member1: OnlineMember = { userId: 'u1', name: 'User 1', role: 'operator' };
      const member2: OnlineMember = { userId: 'u2', name: 'User 2', role: 'standby' };
      useSocketStore.getState().addOnlineMember(member1);
      useSocketStore.getState().addOnlineMember(member2);

      useSocketStore.getState().updateMemberRole('u2', 'operator');

      const state = useSocketStore.getState();
      expect(state.onlineMembers.find((m) => m.userId === 'u1')?.role).toBe('operator');
      expect(state.onlineMembers.find((m) => m.userId === 'u2')?.role).toBe('operator');
    });
  });

  describe('reset', () => {
    it('should clear all state to defaults', () => {
      const member: OnlineMember = { userId: 'u1', name: 'User 1', role: 'operator' };
      useSocketStore.getState().addOnlineMember(member);
      useSocketStore.getState().setConnectionStatus('connected');
      useSocketStore.getState().setLastCaption({
        text: 'test',
        userId: 'u1',
        userName: 'User 1',
        timestamp: Date.now(),
      });

      useSocketStore.getState().reset();

      const state = useSocketStore.getState();
      expect(state.connectionStatus).toBe('disconnected');
      expect(state.onlineMembers).toHaveLength(0);
      expect(state.lastCaption).toBeNull();
      expect(state.captionsByUser).toEqual({});
    });
  });
});
