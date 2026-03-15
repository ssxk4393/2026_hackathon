import { describe, it, expect, vi } from 'vitest';
import { notifySessionEnded } from './handlers';
import type { Server } from 'socket.io';

describe('socket handlers', () => {
  describe('notifySessionEnded', () => {
    it('should emit session:ended to the correct room', () => {
      const mockEmit = vi.fn();
      const mockTo = vi.fn().mockReturnValue({ emit: mockEmit });
      const mockIo = { to: mockTo } as unknown as Server;

      const sessionId = 'test-session-123';
      notifySessionEnded(mockIo, sessionId);

      expect(mockTo).toHaveBeenCalledWith(`session:${sessionId}`);
      expect(mockEmit).toHaveBeenCalledWith('session:ended', { sessionId });
    });

    it('should handle multiple calls for different sessions', () => {
      const mockEmit = vi.fn();
      const mockTo = vi.fn().mockReturnValue({ emit: mockEmit });
      const mockIo = { to: mockTo } as unknown as Server;

      notifySessionEnded(mockIo, 'session-1');
      notifySessionEnded(mockIo, 'session-2');

      expect(mockTo).toHaveBeenCalledTimes(2);
      expect(mockTo).toHaveBeenCalledWith('session:session-1');
      expect(mockTo).toHaveBeenCalledWith('session:session-2');
      expect(mockEmit).toHaveBeenCalledTimes(2);
    });
  });
});
