import test from 'brittle'
import { createHash, generateHashedRuleSet } from '../encrypt/game_rules.js';

test('createHash: consistent hash for same input', t => {
  const hash1 = createHash(1, 2, 3, 'mao');
  const hash2 = createHash(1, 2, 3, 'mao');
  t.is(hash1, hash2);
});

test('createHash: different hashes for different actions', t => {
  const hash1 = createHash(1, 2, 3, 'mao');
  const hash2 = createHash(1, 2, 3, 'hit card');
  t.not(hash1, hash2);
});

test('createHash: standardizes action string', t => {
  const hash1 = createHash(1, 2, 3, '  MAO  ');
  const hash2 = createHash(1, 2, 3, 'mao');
  t.is(hash1, hash2);
});

test('generateHashedRuleSet: returns a set', t => {
  const set = generateHashedRuleSet();
  t.ok(set instanceof Set);
});

test('generateHashedRuleSet: set is not empty', t => {
  const set = generateHashedRuleSet();
  t.ok(set.size > 0);
});

test('generateHashedRuleSet: cannot play a red card against a black card', t => {
  const set = generateHashedRuleSet();
  const hash = createHash(1, 14, 0, 'mao'); // Ace of Hearts (red) against Ace of Spades (black)
});