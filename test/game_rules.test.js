import { createHash, generateSet } from '../encrypt/game_rules.js';

describe('createHash', () => {
  it('should generate consistent hash for same input', () => {
    const hash1 = createHash(1, 2, 3, 'mao');
    const hash2 = createHash(1, 2, 3, 'mao');
    expect(hash1).toBe(hash2);
  });

  it('should generate different hashes for different actions', () => {
    const hash1 = createHash(1, 2, 3, 'mao');
    const hash2 = createHash(1, 2, 3, 'hit card');
    expect(hash1).not.toBe(hash2);
  });

  it('should standardize action string', () => {
    const hash1 = createHash(1, 2, 3, '  MAO  ');
    const hash2 = createHash(1, 2, 3, 'mao');
    expect(hash1).toBe(hash2);
  });
});

describe('generateSet', () => {
  it('should return a set', () => {
    const set = generateSet();
    expect(set instanceof Array).toBe(true);
  });

  it('should not be empty', () => {
    const set = generateSet();
    expect(set.length).toBeGreaterThan(0);
  });
});
