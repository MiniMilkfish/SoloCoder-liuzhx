export type GameMode = 'coop' | 'battle';

export type GameStatus = 'waiting' | 'playing' | 'ended';

export type PlayerRole = 'player' | 'spectator';

export type CellState = {
  revealed: boolean;
  flagged: boolean;
  isMine: boolean;
  adjacentMines: number;
};

export type Player = {
  id: string;
  nickname: string;
  role: PlayerRole;
  wins: number;
  isReady: boolean;
};

export type GameRoom = {
  id: string;
  mode: GameMode;
  status: GameStatus;
  players: Record<string, Player>;
  spectators: Record<string, Player>;
  currentPlayerId: string | null;
  timeLimit: number;
  timeRemaining: number;
  board: CellState[][];
  encryptedMines: string;
  mineCount: number;
  rows: number;
  cols: number;
  resetVote: {
    initiatedBy: string | null;
    agreed: string[];
  };
};

export type SocketMessage = {
  type: string;
  data: unknown;
};

export type GameResult = {
  winner: string | null;
  reason: string;
};
