import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { StenographerPanel } from './StenographerPanel';
import { useAppStore } from '../stores/appStore';

describe('StenographerPanel', () => {
  beforeEach(() => {
    useAppStore.setState({
      activeOperatorId: 'A',
      captionTexts: {},
    });
  });

  it('should render stenographer name', () => {
    render(
      <StenographerPanel
        stenographer={{ id: 'A', name: '속기사 A', isActive: true }}
      />
    );
    expect(screen.getByText('속기사 A')).toBeInTheDocument();
  });

  it('should show LIVE badge for active operator', () => {
    render(
      <StenographerPanel
        stenographer={{ id: 'A', name: '속기사 A', isActive: true }}
      />
    );
    expect(screen.getByText('LIVE')).toBeInTheDocument();
  });

  it('should show 대기 badge for inactive operator', () => {
    useAppStore.setState({ activeOperatorId: 'A' });
    render(
      <StenographerPanel
        stenographer={{ id: 'B', name: '속기사 B', isActive: false }}
      />
    );
    expect(screen.getByText('대기')).toBeInTheDocument();
  });

  it('should have a textarea for input', () => {
    render(
      <StenographerPanel
        stenographer={{ id: 'A', name: '속기사 A', isActive: true }}
      />
    );
    expect(screen.getByPlaceholderText(/자막을 입력하세요/)).toBeInTheDocument();
  });

  it('should show character count when typing', () => {
    render(
      <StenographerPanel
        stenographer={{ id: 'A', name: '속기사 A', isActive: true }}
      />
    );
    const textarea = screen.getByPlaceholderText(/자막을 입력하세요/);
    fireEvent.change(textarea, { target: { value: '테스트자막' } });
    expect(screen.getByText(/5\s*자/)).toBeInTheDocument();
  });
});
