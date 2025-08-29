'use server';

import {promises as fs} from 'fs';
import path from 'path';
import type {Game, Player, Transaction, DiceRoll} from './types';

const gamesDir = path.join(process.cwd(), 'games');

// Helper function to ensure the games directory exists
async function ensureGamesDir() {
  try {
    await fs.access(gamesDir);
  } catch (error) {
    await fs.mkdir(gamesDir, {recursive: true});
  }
}

// Helper function to write game data to a file
async function writeGame(game: Game) {
  await ensureGamesDir();
  const filePath = path.join(gamesDir, `game_${game.id}.json`);
  await fs.writeFile(filePath, JSON.stringify(game, null, 2));
}

// --- API FUNCTIONS ---

export async function getGames(): Promise<Game[]> {
  await ensureGamesDir();
  const gameFiles = (await fs.readdir(gamesDir)).filter(file =>
    file.startsWith('game_')
  );
  const games: Game[] = [];
  for (const file of gameFiles) {
    const filePath = path.join(gamesDir, file);
    const fileContent = await fs.readFile(filePath, 'utf-8');
    try {
      const game = JSON.parse(fileContent) as Game;
      games.push(game);
    } catch (e) {
      console.error(`Could not parse ${file}`);
    }
  }
  // Sort games by creation date, most recent first
  return games.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function getGameById(id: string): Promise<Game | undefined> {
  await ensureGamesDir();
  const filePath = path.join(gamesDir, `game_${id}.json`);
  try {
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const game = JSON.parse(fileContent) as Game;
    // Dates are stored as strings in JSON, so we need to parse them back
    game.createdAt = new Date(game.createdAt);
    game.transactions.forEach(t => (t.createdAt = new Date(t.createdAt)));
    game.diceRolls.forEach(dr => (dr.createdAt = new Date(dr.createdAt)));
    return game;
  } catch (error) {
    // If the file doesn't exist, return undefined
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'ENOENT'
    ) {
      return undefined;
    }
    // For other errors, re-throw
    throw error;
  }
}

export async function createGame(
  playerNames: string[],
  startingBalance: number
): Promise<Game> {
  const gameId = crypto.randomUUID();
  const players: Player[] = [];
  for (const name of playerNames) {
    players.push({
      id: crypto.randomUUID(),
      name,
      balance: startingBalance,
      gameId,
    });
  }

  const newGame: Game = {
    id: gameId,
    playerCount: players.length,
    startingBalance,
    createdAt: new Date(),
    players,
    transactions: [],
    diceRolls: [],
  };

  await writeGame(newGame);
  return newGame;
}

export async function getPlayersByGameId(gameId: string): Promise<Player[]> {
  const game = await getGameById(gameId);
  return game ? game.players : [];
}

export async function updatePlayerName(
  playerId: string,
  gameId: string,
  newName: string
): Promise<Player> {
  const game = await getGameById(gameId);
  if (!game) throw new Error('Game not found');

  const player = game.players.find(p => p.id === playerId);
  if (!player) throw new Error('Player not found');

  player.name = newName;
  await writeGame(game);

  return player;
}

export async function makePayment(details: {
  gameId: string;
  fromPlayerId: string;
  toPlayerId: string | 'bank';
  amount: number;
  reason: string;
}): Promise<{fromPlayer: Player; toPlayer?: Player}> {
  const {gameId, fromPlayerId, toPlayerId, amount, reason} = details;
  const game = await getGameById(gameId);
  if (!game) throw new Error('Game not found');

  const fromPlayer = game.players.find(p => p.id === fromPlayerId);
  if (!fromPlayer) throw new Error('Sender not found');

  const toPlayer =
    toPlayerId === 'bank'
      ? undefined
      : game.players.find(p => p.id === toPlayerId);
  if (toPlayerId !== 'bank' && !toPlayer)
    throw new Error('Recipient not found');

  if (fromPlayer.balance < amount) throw new Error('Insufficient funds');

  fromPlayer.balance -= amount;
  if (toPlayer) {
    toPlayer.balance += amount;
  }

  const transaction: Transaction = {
    id: crypto.randomUUID(),
    gameId,
    fromPlayerId,
    toPlayerId,
    amount,
    reason,
    createdAt: new Date(),
  };
  game.transactions.push(transaction);

  await writeGame(game);

  return {fromPlayer, toPlayer};
}

export async function passGo(playerId: string, gameId: string): Promise<Player> {
  const game = await getGameById(gameId);
  if (!game) throw new Error('Game not found');

  const player = game.players.find(p => p.id === playerId);
  if (!player) throw new Error('Player not found');

  const passGoAmount = 200;
  player.balance += passGoAmount;

  const transaction: Transaction = {
    id: crypto.randomUUID(),
    gameId,
    fromPlayerId: 'bank',
    toPlayerId: playerId,
    amount: passGoAmount,
    reason: 'Passed GO',
    createdAt: new Date(),
  };
  game.transactions.push(transaction);

  await writeGame(game);

  return player;
}

export async function getTransactionsByGameId(
  gameId: string
): Promise<Transaction[]> {
  const game = await getGameById(gameId);
  return game ? game.transactions : [];
}

export async function recordDiceRoll(details: {
  gameId: string;
  values: [number, number];
  total: number;
  method: string;
}): Promise<DiceRoll> {
  const game = await getGameById(details.gameId);
  if (!game) throw new Error('Game not found');

  const newRoll: DiceRoll = {
    id: crypto.randomUUID(),
    createdAt: new Date(),
    ...details,
  };
  game.diceRolls.push(newRoll);

  await writeGame(game);

  return newRoll;
}

export async function getDiceRollsByGameId(
  gameId: string
): Promise<DiceRoll[]> {
  const game = await getGameById(gameId);
  return game ? game.diceRolls : [];
}

export async function deleteGame(gameId: string): Promise<void> {
    await ensureGamesDir();
    const filePath = path.join(gamesDir, `game_${gameId}.json`);
    try {
        await fs.unlink(filePath);
    } catch (error) {
        if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'ENOENT') {
            // File already deleted, ignore.
            return;
        }
        throw error;
    }
}

export async function resetGame(gameId: string): Promise<Game> {
    const game = await getGameById(gameId);
    if (!game) throw new Error('Game not found');

    // Reset player balances
    game.players.forEach(p => {
        p.balance = game.startingBalance;
    });

    // Clear transactions and dice rolls
    game.transactions = [];
    game.diceRolls = [];

    await writeGame(game);
    return game;
}

export async function giveToAllPlayers(gameId: string, amount: number, reason: string): Promise<void> {
    const game = await getGameById(gameId);
    if (!game) throw new Error('Game not found');

    for (const player of game.players) {
        player.balance += amount;
        const transaction: Transaction = {
            id: crypto.randomUUID(),
            gameId,
            fromPlayerId: 'bank',
            toPlayerId: player.id,
            amount,
            reason,
            createdAt: new Date(),
        };
        game.transactions.push(transaction);
    }

    await writeGame(game);
}

export async function takeFromAllPlayers(gameId: string, amount: number, reason: string): Promise<void> {
    const game = await getGameById(gameId);
    if (!game) throw new Error('Game not found');

    for (const player of game.players) {
        player.balance -= amount;
        const transaction: Transaction = {
            id: crypto.randomUUID(),
            gameId,
            fromPlayerId: player.id,
            toPlayerId: 'bank',
            amount,
            reason,
            createdAt: new Date(),
        };
        game.transactions.push(transaction);
    }

    await writeGame(game);
}

export async function undoTransaction(gameId: string, transactionId: string): Promise<void> {
    console.log('[undoTransaction] START: gameId:', gameId, 'transactionId:', transactionId);
    if (!gameId) {
        console.error('[undoTransaction] ERROR: gameId is missing or undefined.');
        throw new Error('gameId is not defined');
    }
    const game = await getGameById(gameId);
    if (!game) {
        console.error('[undoTransaction] ERROR: Game not found for gameId:', gameId);
        throw new Error('Game not found');
    }
    console.log('[undoTransaction] Found game:', game.id);

    const transactionIndex = game.transactions.findIndex(t => t.id === transactionId);
    if (transactionIndex === -1) {
        console.error('[undoTransaction] ERROR: Transaction not found for transactionId:', transactionId);
        throw new Error('Transaction not found');
    }
    console.log('[undoTransaction] Found transaction at index:', transactionIndex);

    const transaction = game.transactions[transactionIndex];
    const { fromPlayerId, toPlayerId, amount } = transaction;

    // Reverse the balance changes
    const fromPlayer = fromPlayerId === 'bank' ? null : game.players.find(p => p.id === fromPlayerId);
    const toPlayer = toPlayerId === 'bank' ? null : game.players.find(p => p.id === toPlayerId);

    if (fromPlayer) {
        fromPlayer.balance += amount;
        console.log(`[undoTransaction] Reverted fromPlayer ${fromPlayer.id}: balance is now ${fromPlayer.balance}`);
    }
    if (toPlayer) {
        toPlayer.balance -= amount;
        console.log(`[undoTransaction] Reverted toPlayer ${toPlayer.id}: balance is now ${toPlayer.balance}`);
    }
    
    // Remove the transaction
    game.transactions.splice(transactionIndex, 1);
    console.log('[undoTransaction] Removed transaction from history.');

    await writeGame(game);
    console.log('[undoTransaction] END: Successfully wrote updated game file.');
}
