import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatusBar } from './StatusBar';
import { useAppStore } from '../stores/appStore';
import { useSocketStore } from '../stores/socketStore';

describe('StatusBar', () => {
  beforeEach(() => {
    // Reset stores
    useAppStore.setState({
      activeOperatorId: 'A',
      stenographers: [
        { id: 'A', name: '속기사 A', isActive: true },
        { id: 'B', name: '속기사 B', isActive: false },
      ],
    });
    useSocketStore.setState({
      connectionStatus: 'disconnected',
      onlineMembers: [],
      lastCaption: null,
    });
  });

  it('should render the active operator name', () => {
    render(<StatusBar />);
    expect(screen.getByText('속기사 A')).toBeInTheDocument();
  });

  it('should show local mode when disconnected', () => {
    render(<StatusBar />);
    expect(screen.getByText('로컬 모드')).toBeInTheDocument();
  });

  it('should show online status when connected', () => {
    useSocketStore.setState({ connectionStatus: 'connected' });
    render(<StatusBar />);
    expect(screen.getByText('온라인')).toBeInTheDocument();
  });

  it('should show reconnecting status', () => {
    useSocketStore.setState({ connectionStatus: 'reconnecting' });
    render(<StatusBar />);
    expect(screen.getByText('재연결 중...')).toBeInTheDocument();
  });

  it('should show online member count when members exist', () => {
    useSocketStore.setState({
      onlineMembers: [
        { userId: '1', name: 'User1', role: 'operator' },
        { userId: '2', name: 'User2', role: 'standby' },
      ],
    });
    render(<StatusBar />);
    expect(screen.getByText('접속자 2명')).toBeInTheDocument();
  });

  it('should show stenographer count in local mode', () => {
    render(<StatusBar />);
    expect(screen.getByText('속기사 2명')).toBeInTheDocument();
  });

  it('should display session timer', () => {
    render(<StatusBar />);
    expect(screen.getByText('00:00:00')).toBeInTheDocument();
  });
});
