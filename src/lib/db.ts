'use server';

import type { Game, Player, Transaction, DiceRoll } from './types';

// In-memory store
const games: Game[] = [];

// --- MOCK DATA ---
const initialGameId = 'c1a7b8e8-4c3d-4e9f-8b2a-1c9d8e7f6a5b';
const initialPlayers: Player[] = [
  { id: 'player-1', name: 'Player 1', balance: 1500, gameId: initialGameId },
  { id: 'player-2', name: 'Player 2', balance: 1500, gameId: initialGameId },
  { id: 'player-3', name: 'Player 3', balance: 1500, gameId: initialGameId },
];
const initialTransactions: Transaction[] = [];
games.push({
    id: initialGameId,
    playerCount: 3,
    startingBalance: 1500,
    createdAt: new Date(),
    players: initialPlayers,
    transactions: initialTransactions,
    diceRolls: [],
});

// --- API FUNCTIONS ---

export async function getGames(): Promise<Game[]> {
  // Simulates: SELECT * FROM games;
  return Promise.resolve(games);
}

export async function getGameById(id: string): Promise<Game | undefined> {
  // Simulates: SELECT * FROM games WHERE id = ?;
  return Promise.resolve(games.find(g => g.id === id));
}

export async function createGame(playerNames: string[], startingBalance: number): Promise<Game> {
  const gameId = crypto.randomUUID();
  const players: Player[] = [];
  for (const name of playerNames) {
    players.push({ id: crypto.randomUUID(), name, balance: startingBalance, gameId });
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

  // Simulates: INSERT INTO games (...);
  games.unshift(newGame);
  return Promise.resolve(newGame);
}

export async function getPlayersByGameId(gameId: string): Promise<Player[]> {
  const game = await getGameById(gameId);
  return Promise.resolve(game ? game.players : []);
}

export async function updatePlayerName(playerId: string, gameId: string, newName: string): Promise<Player> {
    const game = await getGameById(gameId);
    if (!game) throw new Error('Game not found');

    const player = game.players.find(p => p.id === playerId);
    if (!player) throw new Error('Player not found');

    player.name = newName;

    return Promise.resolve(player);
}

export async function makePayment(details: {
  gameId: string;
  fromPlayerId: string;
  toPlayerId: string | 'bank';
  amount: number;
  reason: string;
}): Promise<{ fromPlayer: Player; toPlayer?: Player }> {
  const { gameId, fromPlayerId, toPlayerId, amount, reason } = details;
  const game = await getGameById(gameId);
  if (!game) throw new Error('Game not found');

  const fromPlayer = game.players.find(p => p.id === fromPlayerId);
  if (!fromPlayer) throw new Error('Sender not found');
  
  const toPlayer = toPlayerId === 'bank' ? undefined : game.players.find(p => p.id === toPlayerId);
  if (toPlayerId !== 'bank' && !toPlayer) throw new Error('Recipient not found');

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

  return Promise.resolve({ fromPlayer, toPlayer });
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

    return Promise.resolve(player);
}


export async function getTransactionsByGameId(gameId: string): Promise<Transaction[]> {
    const game = await getGameById(gameId);
    return Promise.resolve(game ? game.transactions : []);
}

export async function recordDiceRoll(details: {
    gameId: string,
    values: [number, number],
    total: number,
    method: string,
}): Promise<DiceRoll> {
    const game = await getGameById(details.gameId);
    if (!game) throw new Error('Game not found');
    
    const newRoll: DiceRoll = {
        id: crypto.randomUUID(),
        createdAt: new Date(),
        ...details
    };
    game.diceRolls.push(newRoll);

    return Promise.resolve(newRoll);
}

export async function getDiceRollsByGameId(gameId: string): Promise<DiceRoll[]> {
    const game = await getGameById(gameId);
    return Promise.resolve(game ? game.diceRolls : []);
}
