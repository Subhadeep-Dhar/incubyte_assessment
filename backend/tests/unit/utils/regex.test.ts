import { describe, it, expect } from 'vitest';
import { escapeRegex } from '../../../src/utils/regex.util';

describe('Regex Utility (Unit Test)', () => {
  it('should escape all standard regular expression special characters', () => {
    const raw = '.*+?^${}()|[]\\';
    const escaped = escapeRegex(raw);

    expect(escaped).toBe('\\.\\*\\+\\?\\^\\$\\{\\}\\(\\)\\|\\[\\]\\\\');
  });

  it('should return unchanged string when no regex special characters are present', () => {
    const raw = 'Toyota Camry 2023';
    expect(escapeRegex(raw)).toBe('Toyota Camry 2023');
  });
});
