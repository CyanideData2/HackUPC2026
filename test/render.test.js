import test from 'brittle'
import { RenderScene } from '../ui.js'

function withMockDocument(selectors, fn) {
  const previousDocument = globalThis.document

  globalThis.document = {
    querySelector(selector) {
      return selectors[selector] || null
    },
    createElement(tagName) {
      return {
        tagName,
        className: '',
        innerHTML: ''
      }
    }
  }

  try {
    fn()
  } finally {
    globalThis.document = previousDocument
  }
}

function createMockBoard() {
  return {
    innerHTML: 'stale',
    children: [],
    appendChild(node) {
      this.children.push(node)
    }
  }
}

function getBoardHtml(board) {
  return board.children.map((child) => child.innerHTML).join(' ')
}

test('RenderScene - builds 9 board cells and excludes self', (t) => {
  const gameBoard = createMockBoard()
  const gameHand = { innerHTML: '' }

  withMockDocument({ '#game-board': gameBoard, '#game-hand': gameHand }, () => {
    RenderScene({
      peerId: 'self01',
      peerIds: ['self01', 'peerA1', 'peerB2'],
      hand: [],
      playedCards: []
    })
  })

  t.is(gameBoard.innerHTML, '')
  t.is(gameBoard.children.length, 9)

  const html = getBoardHtml(gameBoard)
  t.ok(html.includes('Player peerA1'))
  t.ok(html.includes('Player peerB2'))
  t.absent(html.includes('Player self01'))
  t.ok(html.includes('<span class="card-count">N</span>'))
})

test('RenderScene - renders empty board when no other peers', (t) => {
  const gameBoard = createMockBoard()
  const gameHand = { innerHTML: '' }

  withMockDocument({ '#game-board': gameBoard, '#game-hand': gameHand }, () => {
    RenderScene({
      peerId: 'solo01',
      peerIds: ['solo01'],
      hand: [],
      playedCards: []
    })
  })

  t.is(gameBoard.children.length, 9)
  t.absent(getBoardHtml(gameBoard).includes('Player '))
})

test('RenderScene - updates hand and other players board together', (t) => {
  const gameHand = { innerHTML: '' }
  const gameBoard = createMockBoard()

  const state = {
    hand: [{ toCode: () => '5H' }],
    peerId: 'self01',
    peerIds: ['self01', 'peerA1']
  }

  withMockDocument({
    '#game-hand': gameHand,
    '#game-board': gameBoard
  }, () => {
    RenderScene(state)
  })

  t.ok(gameHand.innerHTML.includes('pcard-5H'))
  t.is(gameBoard.children.length, 9)
  t.ok(getBoardHtml(gameBoard).includes('Player peerA1'))
})

test('RenderScene - renders at most five other players', (t) => {
  const gameBoard = createMockBoard()
  const gameHand = { innerHTML: '' }

  withMockDocument({ '#game-board': gameBoard, '#game-hand': gameHand }, () => {
    RenderScene({
      peerId: 'self01',
      peerIds: ['self01', 'p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7'],
      hand: [],
      playedCards: []
    })
  })

  const html = getBoardHtml(gameBoard)
  t.is((html.match(/class="other-player-cell"/g) || []).length, 5)
  t.ok(html.includes('Player p1'))
  t.ok(html.includes('Player p5'))
  t.absent(html.includes('Player p6'))
  t.absent(html.includes('Player p7'))
})
