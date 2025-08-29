export interface Player {
  id: string;
  name: string;
  balance: number;
  gameId: string;
}

export interface Transaction {
  id: string;
  gameId: string;
  fromPlayerId: string | 'bank';
  toPlayerId: string | 'bank';
  amount: number;
  reason: string;
  createdAt: Date;
}

export interface DiceRoll {
  id: string;
  gameId: string;
  values: [number, number];
  total: number;
  method: string;
  createdAt: Date;
}

export interface GameSettings {
  jailFee: number;
  passGoAmount: number;
  freeParkingAmount: number;
}

export interface Game {
  id:string;
  playerCount: number;
  startingBalance: number;
  createdAt: Date;
  players: Player[];
  transactions: Transaction[];
  diceRolls: DiceRoll[];
  settings: GameSettings;
}
