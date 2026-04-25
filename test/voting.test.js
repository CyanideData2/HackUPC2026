import test from 'brittle'
import GameState from '../game.js'
import {Card} from '../card.js'

test('canVote - returns false when no pending card', (t) => {
  const game = new GameState('alice', ['alice', 'bob', 'charlie'])
  t.absent(game.canVote('bob'))
})

test('canVote - returns false when player already voted', (t) => {
  const game = new GameState('alice', ['alice', 'bob', 'charlie'])
  const card = new Card(5, 'hearts')
  game.submitCard(card, 'alice')
  t.absent(game.canVote('alice'))
})

test('canVote - returns true for eligible voter', (t) => {
  const game = new GameState('alice', ['alice', 'bob', 'charlie'])
  const card = new Card(5, 'hearts')
  game.submitCard(card, 'alice')
  t.ok(game.canVote('bob'))
})

test('castVote - accepts yes vote', (t) => {
  const game = new GameState('alice', ['alice', 'bob', 'charlie'])
  const card = new Card(5, 'hearts')
  game.submitCard(card, 'alice')
  const result = game.castVote('bob', 'yes')
  t.ok(result.accepted)
  t.is(result.vote, 'yes')
})

test('castVote - accepts no vote', (t) => {
  const game = new GameState('alice', ['alice', 'bob', 'charlie'])
  const card = new Card(5, 'hearts')
  game.submitCard(card, 'alice')
  const result = game.castVote('bob', 'no')
  t.ok(result.accepted)
  t.is(result.vote, 'no')
})

test('castVote - rejects invalid vote value', (t) => {
  const game = new GameState('alice', ['alice', 'bob', 'charlie'])
  const card = new Card(5, 'hearts')
  game.submitCard(card, 'alice')
  const result = game.castVote('bob', 'maybe')
  t.absent(result.accepted)
  t.is(result.reason, 'Invalid vote')
})

test('castVote - rejects when no pending card', (t) => {
  const game = new GameState('alice', ['alice', 'bob', 'charlie'])
  const result = game.castVote('bob', 'yes')
  t.absent(result.accepted)
  t.is(result.reason, 'Cannot vote now')
})

test('castVote - rejects duplicate vote', (t) => {
  const game = new GameState('alice', ['alice', 'bob', 'charlie'])
  const card = new Card(5, 'hearts')
  game.submitCard(card, 'alice')
  game.castVote('bob', 'yes')
  const result = game.castVote('bob', 'no')
  t.absent(result.accepted)
  t.is(result.reason, 'Cannot vote now')
})

test('getVoteResults - empty when no votes', (t) => {
  const game = new GameState('alice', ['alice', 'bob', 'charlie'])
  const results = game.getVoteResults()
  t.is(results.totalVotes, 0)
  t.is(results.yesVotes, 0)
  t.is(results.noVotes, 0)
})

test('getVoteResults - counts votes correctly', (t) => {
  const game = new GameState('alice', ['alice', 'bob', 'charlie'])
  const card = new Card(5, 'hearts')
  game.submitCard(card, 'alice')
  game.castVote('bob', 'yes')
  game.castVote('charlie', 'no')
  const results = game.getVoteResults()
  t.is(results.totalVotes, 3)
  t.is(results.yesVotes, 2)
  t.is(results.noVotes, 1)
})

test('resolveTurn - fails without majority yes votes', (t) => {
  const game = new GameState('alice', ['alice', 'bob', 'charlie'])
  const card = new Card(5, 'hearts')
  game.submitCard(card, 'alice')
  game.castVote('bob', 'no')
  const result = game.resolveTurn()
  t.absent(result.success)
  t.is(result.results.yesVotes, 1)
})

test('resolveTurn - succeeds with majority yes votes', (t) => {
  const game = new GameState('alice', ['alice', 'bob', 'charlie'])
  const card = new Card(5, 'hearts')
  game.submitCard(card, 'alice')
  game.castVote('bob', 'yes')
  const result = game.resolveTurn()
  t.ok(result.success)
  t.ok(result.card)
  t.is(result.card.rank, 5)
})

test('resolveTurn - clears pending card after resolution', (t) => {
  const game = new GameState('alice', ['alice', 'bob', 'charlie'])
  const card = new Card(5, 'hearts')
  game.submitCard(card, 'alice')
  game.castVote('bob', 'yes')
  game.resolveTurn()
  t.absent(game.pendingCard)
})

test('resolveTurn - clears votes after resolution', (t) => {
  const game = new GameState('alice', ['alice', 'bob', 'charlie'])
  const card = new Card(5, 'hearts')
  game.submitCard(card, 'alice')
  game.castVote('bob', 'yes')
  game.resolveTurn()
  t.is(game.votes.size, 0)
})

test('submitCard - automatically votes yes for submitter', (t) => {
  const game = new GameState('alice', ['alice', 'bob', 'charlie'])
  const card = new Card(5, 'hearts')
  game.submitCard(card, 'alice')
  const results = game.getVoteResults()
  t.is(results.totalVotes, 1)
  t.is(results.yesVotes, 1)
})

test('submitCard - clears previous votes when new card submitted', (t) => {
  const game = new GameState('alice', ['alice', 'bob', 'charlie'])
  const card1 = new Card(5, 'hearts')
  const card2 = new Card(7, 'clubs')
  game.submitCard(card1, 'alice')
  game.castVote('bob', 'yes')
  game.castVote('charlie', 'no')
  game.submitCard(card2, 'alice')
  const results = game.getVoteResults()
  t.is(results.totalVotes, 1)
  t.is(results.yesVotes, 1)
  t.is(results.noVotes, 0)
})