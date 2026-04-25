# Peer to peer card game with Zero-Knowledge

The card game is mao, which is like uno but with unspoken rules.

The objective is to create a visual interface for playing the game.

## Setup

### Prerequisites

- Node.js LTS (includes npm)

### Install dependencies

```bash
npm install
```

### Run the app

```bash
npm run dev
```

Notes:

- The first run may ask to install `pear` runtime tools. If prompted with `Ok to proceed? (y)`, type `y`.
- To stop the app, press `Ctrl + C` in the terminal.

### Windows PowerShell note

If PowerShell blocks npm scripts with an execution policy error, run:

```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

Then restart the terminal.

### Run tests

```bash
npm test
```

## Decisions

- The game must not use servers, but rather be peer to peer, because
this way every player can audit all the process.
- We use [hyperswarm](https://github.com/rafapaezbas/holepunch-workshop/tree/main/hyperswarm) because it can manage a pool of users and their peer to peer connections.
- The deck shuffling and dealing must be encrypted and of type
Zero-Knowledge proof, so that every player can be sure that no other
player is cheating, no one can see each other cards, and no one can choose their cards in advance. Therefore, randomness and shuffling cannot be broken. In order to achieve this level of security, we implement an algorithm based on mental poker.

## Architecture

The app is a webapp frontened by HTML, CSS and JavaScript in a localhost.

The backend is made in JavaScript and is responsible for the game logic, including the encryption, decryption, shuffling, dealing, rule handling.

## The game: Mao

### Deck definition

There are 52 cards. Each card is defined by its rank (1 to 13) and its suit (0 to 3).

### Dealing

First, the deck is shuffled. Then, every player gets 3 cards.
Every player can only see their cards.

### Rules

Mao is like uno but with extra secret rules.
For example, after playing a 7, the player must say "Good morning!" and get an extra card. Otherwise, it will be punished.

## Authorship

This app was built in 36 hours for the HackUPC 2026 hackathon by a team of four: Dani, Helena, Bernat, Víctor.
