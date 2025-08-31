import { render, screen } from '@testing-library/react';
import App from '../App';
import '@testing-library/jest-dom';
import { describe, it, expect } from 'vitest';

describe('App', () => {
  it('renders without crashing', () => {
    render(<App />);
    // Update the text below to match something visible in your App component
    // For example, if your App renders 'Viral Views', use that string
    // expect(screen.getByText(/viral views/i)).toBeInTheDocument();
  });
});
