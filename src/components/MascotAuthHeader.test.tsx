import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import MascotAuthHeader from '../features/auth/components/MascotAuthHeader';

describe('MascotAuthHeader Gamified Component', () => {
  it('renders the core SVG elements', () => {
    const { container } = render(<MascotAuthHeader />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('remains static when user is not typing', () => {
    const { container } = render(<MascotAuthHeader isTyping={false} />);
    const styleTag = container.querySelector('style');
    expect(styleTag?.innerHTML).toContain('animation: none');
  });

  it('applies the dynamic scribble animation class when user is typing', () => {
    const { container } = render(<MascotAuthHeader isTyping={true} />);
    const styleTag = container.querySelector('style');
    expect(styleTag?.innerHTML).toContain('animation: scribble 0.3s infinite ease-in-out');
  });
});






