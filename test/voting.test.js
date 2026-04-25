import test from 'brittle'
import GameState from '../game.js'
import Card from '../card.js'

test('submitCard - accepts valid card from any player', (t) => {
  const game = new GameState('alice', ['alice', 'bob', 'charlie'])
  const card = new Card(5, 'hearts')
  const result = game.submitCard(card, 'bob')
  t.ok(result.accepted, 'bob can submit card')
  t.is(result.card.rank, 5)
})

test('submitCard - replaces pending card', (t) => {
  const game = new GameState('alice', ['alice', 'bob', 'charlie'])
  const card1 = new Card(5, 'hearts')
  const card2 = new Card(7, 'clubs')
  game.submitCard(card1, 'alice')
  game.submitCard(card2, 'bob')
  t.is(game.pendingCard.rank, 7)
})

test('canVote - true when pending card exists', (t) => {
  const game = new GameState('alice', ['alice', 'bob', 'charlie'])
  const card = new Card(5, 'hearts')
  game.submitCard(card, 'alice')
  t.ok(game.canVote('bob'))
  t.ok(game.canVote('charlie'))
})

test('canVote - false when no pending card', (t) => {
  const game = new GameState('alice', ['alice', 'bob', 'charlie'])
  t.absent(game.canVote('bob'))
})

test('castVote - accepts yes/no', (t) => {
  const game = new GameState('alice', ['alice', 'bob', 'charlie'])
  const card = new Card(5, 'hearts')
  game.submitCard(card, 'alice')
  t.ok(game.castVote('bob', 'yes').accepted)
  t.ok(game.castVote('charlie', 'no').accepted)
})

test('castVote - rejects duplicate voter', (t) => {
  const game = new GameState('alice', ['alice', 'bob', 'charlie'])
  const card = new Card(5, 'hearts')
  game.submitCard(card, 'alice')
  game.castVote('bob', 'yes')
  t.absent(game.castVote('bob', 'no').accepted)
})

test('getVoteResults - counts correctly', (t) => {
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

test('resolveTurn - succeeds with majority', (t) => {
  const game = new GameState('alice', ['alice', 'bob', 'charlie'])
  const card = new Card(5, 'hearts')
  game.submitCard(card, 'alice')
  game.castVote('bob', 'yes')
  const resolved = game.resolveTurn()
  t.ok(resolved.success)
  t.is(resolved.card.rank, 5)
  t.ok(!game.pendingCard, 'pending card cleared')
  t.is(game.votes.size, 0, 'votes cleared')
})

test('resolveTurn - fails without majority', (t) => {
  const game = new GameState('alice', ['alice', 'bob', 'charlie'])
  const card = new Card(5, 'hearts')
  game.submitCard(card, 'alice')
  game.castVote('bob', 'no')
  const resolved = game.resolveTurn()
  t.absent(resolved.success)
  t.ok(game.pendingCard, 'pending card still exists')
})

test('resolveTurn - clears votes after resolution', (t) => {
  const game = new GameState('alice', ['alice', 'bob', 'charlie'])
  const card = new Card(5, 'hearts')
  game.submitCard(card, 'alice')
  game.castVote('bob', 'yes')
  game.resolveTurn()
  t.is(game.votes.size, 0)
})

test('any player can submit card', (t) => {
  const game = new GameState('player1', ['player1', 'player2', 'player3', 'player4'])
  const card = new Card(3, 'spades')
  const result = game.submitCard(card, 'player3')
  t.ok(result.accepted, 'player3 can submit')
})

test('submitCard clears previous votes', (t) => {
  const game = new GameState('alice', ['alice', 'bob', 'charlie'])
  const card1 = new Card(5, 'hearts')
  const card2 = new Card(9, 'diamonds')
  game.submitCard(card1, 'alice')
  game.castVote('bob', 'yes')
  game.castVote('charlie', 'no')
  game.submitCard(card2, 'bob')
  const results = game.getVoteResults()
  t.is(results.totalVotes, 1)
  t.is(results.yesVotes, 1)
  t.is(results.noVotes, 0)
})