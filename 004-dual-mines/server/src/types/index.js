/**
 * @typedef {'coop' | 'battle'} GameMode
 * @typedef {'waiting' | 'playing' | 'ended'} GameStatus
 * @typedef {'player' | 'spectator'} PlayerRole
 */

/**
 * @typedef {Object} CellState
 * @property {boolean} revealed
 * @property {boolean} flagged
 * @property {boolean} isMine
 * @property {number} adjacentMines
 */

/**
 * @typedef {Object} Player
 * @property {string} id
 * @property {string} nickname
 * @property {PlayerRole} role
 * @property {number} wins
 * @property {boolean} isReady
 */

/**
 * @typedef {Object} GameRoom
 * @property {string} id
 * @property {GameMode} mode
 * @property {GameStatus} status
 * @property {Object.<string, Player>} players
 * @property {Object.<string, Player>} spectators
 * @property {string | null} currentPlayerId
 * @property {number} timeLimit
 * @property {number} timeRemaining
 * @property {CellState[][]} board
 * @property {string} encryptedMines
 * @property {number} mineCount
 * @property {number} rows
 * @property {number} cols
 * @property {{initiatedBy: string | null, agreed: string[]}} resetVote
 */

/**
 * @typedef {Object} GameResult
 * @property {string | null} winner
 * @property {string} reason
 */

export const GAME_CONFIG = {
  ROWS: 10,
  COLS: 10,
  MINE_COUNT: 15,
  TIME_LIMIT: 30,
  MAX_SPECTATORS: 5,
};
