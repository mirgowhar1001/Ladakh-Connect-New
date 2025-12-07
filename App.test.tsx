import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App';

describe('App', () => {
    it('renders without crashing', () => {
        render(<App />);
        // Since we don't know exactly what's in App, we just check if it renders.
        // Ideally we would check for some text, but for a smoke test this is fine.
        // If it throws, the test fails.
        expect(true).toBe(true);
    });
});
