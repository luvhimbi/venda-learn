import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import Footer from './Footer';

describe('Footer Component', () => {
  it('renders the footer navigation and brand description', () => {
    render(
      <MemoryRouter>
        <Footer />
      </MemoryRouter>
    );
    expect(screen.getByText(/A platform for people who want to learn South African languages/i)).toBeInTheDocument();
    expect(screen.getByText('Privacy')).toBeInTheDocument();
    expect(screen.getByText('Terms')).toBeInTheDocument();
    expect(screen.getByText('Leaderboard')).toBeInTheDocument();
  });

  it('displays the Made in South Africa badge with the correct flag', () => {
    render(
      <MemoryRouter>
        <Footer />
      </MemoryRouter>
    );
    expect(screen.getByText(/MADE IN SOUTH AFRICA/i)).toBeInTheDocument();
    
    // Check if the flagcdn image is correctly attached
    const flagImg = screen.getByAltText('South Africa');
    expect(flagImg).toBeInTheDocument();
    expect(flagImg).toHaveAttribute('src', 'https://flagcdn.com/za.svg');
  });
});
