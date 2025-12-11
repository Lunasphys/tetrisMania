import { Position, Tetromino } from './types';

// Tetris grid dimensions
export const GRID_WIDTH = 10;
export const GRID_HEIGHT = 20;

// Tetromino shapes (I, O, T, S, Z, J, L)
const TETROMINO_SHAPES: Record<string, number[][][]> = {
  I: [
    [[1, 1, 1, 1]],
    [[1], [1], [1], [1]],
  ],
  O: [
    [[1, 1], [1, 1]],
  ],
  T: [
    [[0, 1, 0], [1, 1, 1]],
    [[1, 0], [1, 1], [1, 0]],
    [[1, 1, 1], [0, 1, 0]],
    [[0, 1], [1, 1], [0, 1]],
  ],
  S: [
    [[0, 1, 1], [1, 1, 0]],
    [[1, 0], [1, 1], [0, 1]],
  ],
  Z: [
    [[1, 1, 0], [0, 1, 1]],
    [[0, 1], [1, 1], [1, 0]],
  ],
  J: [
    [[1, 0, 0], [1, 1, 1]],
    [[1, 1], [1, 0], [1, 0]],
    [[1, 1, 1], [0, 0, 1]],
    [[0, 1], [0, 1], [1, 1]],
  ],
  L: [
    [[0, 0, 1], [1, 1, 1]],
    [[1, 0], [1, 0], [1, 1]],
    [[1, 1, 1], [1, 0, 0]],
    [[1, 1], [0, 1], [0, 1]],
  ],
};

/**
 * Create a new tetromino of a random type
 */
export function createTetromino(type?: string): Tetromino {
  const types: Array<'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L'> = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];
  const tetrominoType = (type as any) || types[Math.floor(Math.random() * types.length)];
  const shapes = TETROMINO_SHAPES[tetrominoType];
  const shape = shapes[0];

  return {
    shape,
    position: { x: Math.floor(GRID_WIDTH / 2) - Math.floor(shape[0].length / 2), y: 0 },
    type: tetrominoType,
    rotation: 0,
  };
}

/**
 * Rotate a tetromino shape clockwise
 */
export function rotateTetromino(tetromino: Tetromino): Tetromino {
  const shapes = TETROMINO_SHAPES[tetromino.type];
  const nextRotation = (tetromino.rotation + 1) % shapes.length;
  const rotatedShape = shapes[nextRotation];

  return {
    ...tetromino,
    shape: rotatedShape,
    rotation: nextRotation,
  };
}

/**
 * Check if a position is valid (within bounds and not colliding)
 */
export function isValidPosition(
    grid: number[][],
    tetromino: Tetromino | null,
    newPosition?: Position
): boolean {
  const position = newPosition || tetromino.position;
  const { shape } = tetromino;

  for (let row = 0; row < shape.length; row++) {
    for (let col = 0; col < shape[row].length; col++) {
      if (shape[row][col]) {
        const x = position.x + col;
        const y = position.y + row;

        // Check bounds
        if (x < 0 || x >= GRID_WIDTH || y >= GRID_HEIGHT) {
          return false;
        }

        // Check collision with existing blocks (only if y >= 0)
        if (y >= 0 && grid[y] && grid[y][x]) {
          return false;
        }
      }
    }
  }

  return true;
}

/**
 * Place a tetromino on the grid
 */
export function placeTetromino(grid: number[][], tetromino: Tetromino): number[][] {
  const newGrid = grid.map((row) => [...row]);
  const { shape, position } = tetromino;

  for (let row = 0; row < shape.length; row++) {
    for (let col = 0; col < shape[row].length; col++) {
      if (shape[row][col]) {
        const x = position.x + col;
        const y = position.y + row;

        if (y >= 0 && y < GRID_HEIGHT && x >= 0 && x < GRID_WIDTH) {
          newGrid[y][x] = 1;
        }
      }
    }
  }

  return newGrid;
}

/**
 * Clear completed lines and return new grid with score
 */
export function clearLines(grid: number[][]): { grid: number[][]; linesCleared: number } {
  const newGrid: number[][] = [];
  let linesCleared = 0;

  for (let row = grid.length - 1; row >= 0; row--) {
    if (grid[row].every((cell) => cell === 1)) {
      linesCleared++;
    } else {
      newGrid.unshift(grid[row]);
    }
  }

  // Add empty rows at the top
  while (newGrid.length < GRID_HEIGHT) {
    newGrid.unshift(new Array(GRID_WIDTH).fill(0));
  }

  return { grid: newGrid, linesCleared };
}

/**
 * Calculate score based on lines cleared
 */
export function calculateScore(linesCleared: number, level: number): number {
  const baseScores = [0, 100, 300, 500, 800];
  const score = baseScores[linesCleared] || 0;
  return score * (level + 1);
}

/**
 * Create an empty grid
 */
export function createEmptyGrid(): number[][] {
  return Array(GRID_HEIGHT)
    .fill(null)
    .map(() => Array(GRID_WIDTH).fill(0));
}

/**
 * Check if game is over (top row has blocks)
 */
export function isGameOver(grid: number[][]): boolean {
  return grid[0].some((cell) => cell === 1);
}

