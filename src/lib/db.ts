'use server';

import {promises as fs} from 'fs';
import path from 'path';
import type {Game, Player, Transaction, DiceRoll, GameSettings} from './types';

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
    settings: {
      jailFee: 50,
      passGoAmount: 200,
      freeParkingAmount: 0,
      theme: {
        primary: '180 100% 25%',
        accent: '204 70% 67%',
        background: '180 60% 96%',
      }
    },
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
}): Promise<{fromPlayer?: Player; toPlayer?: Player}> {
  const {gameId, fromPlayerId, toPlayerId, amount, reason} = details;
  const game = await getGameById(gameId);
  if (!game) throw new Error('Game not found');

  const fromPlayer =
    fromPlayerId === 'bank'
      ? undefined
      : game.players.find(p => p.id === fromPlayerId);
  if (fromPlayerId !== 'bank' && !fromPlayer)
    throw new Error('Sender not found');

  const toPlayer =
    toPlayerId === 'bank'
      ? undefined
      : game.players.find(p => p.id === toPlayerId);
  if (toPlayerId !== 'bank' && !toPlayer)
    throw new Error('Recipient not found');

  if (fromPlayer && fromPlayer.balance < amount)
    throw new Error('Insufficient funds');

  if (fromPlayer) {
    fromPlayer.balance -= amount;
  }
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

  const passGoAmount = game.settings.passGoAmount || 200;
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
    if (!gameId || !transactionId) {
        throw new Error('Game ID and Transaction ID are required.');
    }

    const game = await getGameById(gameId);
    if (!game) {
        throw new Error('Game not found');
    }

    const transactionIndex = game.transactions.findIndex(t => t.id === transactionId);
    if (transactionIndex === -1) {
        throw new Error('Transaction not found');
    }
    
    const transaction = game.transactions[transactionIndex];
    const { fromPlayerId, toPlayerId, amount } = transaction;


    // Reverse the balance changes
    const fromPlayer = fromPlayerId === 'bank' ? null : game.players.find(p => p.id === fromPlayerId);
    const toPlayer = toPlayerId === 'bank' ? null : game.players.find(p => p.id === toPlayerId);

    if (fromPlayer) {
        fromPlayer.balance += amount;
    }
    if (toPlayer) {
        toPlayer.balance -= amount;
    }
    
    // Remove the transaction from the history
    game.transactions.splice(transactionIndex, 1);

    await writeGame(game);
}

export async function updateGameSettings(gameId: string, newSettings: Partial<GameSettings>): Promise<Game> {
  const game = await getGameById(gameId);
  if (!game) throw new Error('Game not found');

  game.settings = {
    ...game.settings,
    ...newSettings,
  };

  await writeGame(game);
  return game;
}

export async function executeTrade(details: {
  gameId: string;
  player1Id: string;
  player2Id: string;
  player1Amount: number;
  player2Amount: number;
  reason: string;
}): Promise<void> {
  const { gameId, player1Id, player2Id, player1Amount, player2Amount, reason } = details;

  if (player1Id === player2Id) {
    throw new Error('Players in a trade cannot be the same.');
  }

  const game = await getGameById(gameId);
  if (!game) throw new Error('Game not found');

  const player1 = game.players.find(p => p.id === player1Id);
  if (!player1) throw new Error('Player 1 not found');

  const player2 = game.players.find(p => p.id === player2Id);
  if (!player2) throw new Error('Player 2 not found');

  if (player1.balance < player1Amount) {
    throw new Error(`${player1.name} has insufficient funds for this trade.`);
  }
  if (player2.balance < player2Amount) {
    throw new Error(`${player2.name} has insufficient funds for this trade.`);
  }

  // Perform the balance changes
  player1.balance = player1.balance - player1Amount + player2Amount;
  player2.balance = player2.balance - player2Amount + player1Amount;

  // Record the transaction for Player 1 giving money
  if (player1Amount > 0) {
    const t1: Transaction = {
      id: crypto.randomUUID(),
      gameId,
      fromPlayerId: player1.id,
      toPlayerId: player2.id,
      amount: player1Amount,
      reason: `Trade: ${reason}`,
      createdAt: new Date(),
    };
    game.transactions.push(t1);
  }

  // Record the transaction for Player 2 giving money
  if (player2Amount > 0) {
    const t2: Transaction = {
      id: crypto.randomUUID(),
      gameId,
      fromPlayerId: player2.id,
      toPlayerId: player1.id,
      amount: player2Amount,
      reason: `Trade: ${reason}`,
      createdAt: new Date(),
    };
    game.transactions.push(t2);
  }
  
  await writeGame(game);
}
