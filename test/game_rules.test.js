import test from 'brittle'
import { createHash, generateSet } from '../encrypt/game_rules.js';

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

test('generateSet: returns a set (array)', t => {
  const set = generateSet();
  t.ok(Array.isArray(set));
});

test('generateSet: set is not empty', t => {
  const set = generateSet();
  t.ok(set.length > 0);
});
