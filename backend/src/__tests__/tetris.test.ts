import {
  createTetromino,
  rotateTetromino,
  isValidPosition,
  placeTetromino,
  clearLines,
  calculateScore,
  createEmptyGrid,
  isGameOver,
  GRID_WIDTH,
  GRID_HEIGHT,
} from '../models/tetris';
import { Tetromino } from '../models/types';

describe('Tetris Logic', () => {
  describe('createTetromino', () => {
    it('should create a tetromino with valid shape and position', () => {
      const tetromino = createTetromino('I');
      expect(tetromino.type).toBe('I');
      expect(tetromino.shape).toBeDefined();
      expect(tetromino.position).toBeDefined();
      expect(tetromino.position.x).toBeGreaterThanOrEqual(0);
      expect(tetromino.position.y).toBe(0);
    });

    it('should create a random tetromino if no type specified', () => {
      const tetromino = createTetromino();
      expect(['I', 'O', 'T', 'S', 'Z', 'J', 'L']).toContain(tetromino.type);
    });
  });

  describe('rotateTetromino', () => {
    it('should rotate a tetromino to the next rotation state', () => {
      const tetromino = createTetromino('I');
      const initialRotation = tetromino.rotation;
      const rotated = rotateTetromino(tetromino);
      expect(rotated.rotation).toBe((initialRotation + 1) % 2); // I has 2 rotations
    });

    it('should cycle through all rotations', () => {
      const tetromino = createTetromino('T');
      const rotations: number[] = [];
      let current = tetromino;

      for (let i = 0; i < 4; i++) {
        rotations.push(current.rotation);
        current = rotateTetromino(current);
      }

      expect(rotations).toEqual([0, 1, 2, 3]);
    });
  });

  describe('isValidPosition', () => {
    it('should return true for valid position in empty grid', () => {
      const grid = createEmptyGrid();
      const tetromino = createTetromino('O');
      expect(isValidPosition(grid, tetromino)).toBe(true);
    });

    it('should return false for position outside grid bounds (left)', () => {
      const grid = createEmptyGrid();
      const tetromino: Tetromino = {
        ...createTetromino('O'),
        position: { x: -1, y: 0 },
      };
      expect(isValidPosition(grid, tetromino)).toBe(false);
    });

    it('should return false for position outside grid bounds (right)', () => {
      const grid = createEmptyGrid();
      const tetromino: Tetromino = {
        ...createTetromino('O'),
        position: { x: GRID_WIDTH, y: 0 },
      };
      expect(isValidPosition(grid, tetromino)).toBe(false);
    });

    it('should return false for collision with existing blocks', () => {
      const grid = createEmptyGrid();
      grid[5][5] = 1; // Place a block
      const tetromino: Tetromino = {
        ...createTetromino('O'),
        position: { x: 4, y: 4 },
      };
      expect(isValidPosition(grid, tetromino)).toBe(false);
    });
  });

  describe('placeTetromino', () => {
    it('should place tetromino blocks on the grid', () => {
      const grid = createEmptyGrid();
      const tetromino = createTetromino('O');
      const newGrid = placeTetromino(grid, tetromino);

      let blockCount = 0;
      for (let row = 0; row < newGrid.length; row++) {
        for (let col = 0; col < newGrid[row].length; col++) {
          if (newGrid[row][col] === 1) blockCount++;
        }
      }

      expect(blockCount).toBe(4); // O piece has 4 blocks
    });
  });

  describe('clearLines', () => {
    it('should clear a full line', () => {
      const grid = createEmptyGrid();
      // Fill a line
      for (let col = 0; col < GRID_WIDTH; col++) {
        grid[GRID_HEIGHT - 1][col] = 1;
      }

      const { grid: newGrid, linesCleared } = clearLines(grid);
      expect(linesCleared).toBe(1);
      expect(newGrid[GRID_HEIGHT - 1].every((cell) => cell === 0)).toBe(true);
    });

    it('should clear multiple full lines', () => {
      const grid = createEmptyGrid();
      // Fill two lines
      for (let row = GRID_HEIGHT - 2; row < GRID_HEIGHT; row++) {
        for (let col = 0; col < GRID_WIDTH; col++) {
          grid[row][col] = 1;
        }
      }

      const { grid: newGrid, linesCleared } = clearLines(grid);
      expect(linesCleared).toBe(2);
      expect(newGrid[GRID_HEIGHT - 1].every((cell) => cell === 0)).toBe(true);
      expect(newGrid[GRID_HEIGHT - 2].every((cell) => cell === 0)).toBe(true);
    });

    it('should not clear incomplete lines', () => {
      const grid = createEmptyGrid();
      // Fill a line partially
      for (let col = 0; col < GRID_WIDTH - 1; col++) {
        grid[GRID_HEIGHT - 1][col] = 1;
      }

      const { linesCleared } = clearLines(grid);
      expect(linesCleared).toBe(0);
    });
  });

  describe('calculateScore', () => {
    it('should return 0 for 0 lines', () => {
      expect(calculateScore(0, 0)).toBe(0);
    });

    it('should return 100 for 1 line at level 0', () => {
      expect(calculateScore(1, 0)).toBe(100);
    });

    it('should return 300 for 2 lines at level 0', () => {
      expect(calculateScore(2, 0)).toBe(300);
    });

    it('should multiply score by level + 1', () => {
      expect(calculateScore(1, 1)).toBe(200); // 100 * 2
      expect(calculateScore(1, 2)).toBe(300); // 100 * 3
    });
  });

  describe('isGameOver', () => {
    it('should return false for empty grid', () => {
      const grid = createEmptyGrid();
      expect(isGameOver(grid)).toBe(false);
    });

    it('should return true if top row has blocks', () => {
      const grid = createEmptyGrid();
      grid[0][5] = 1;
      expect(isGameOver(grid)).toBe(true);
    });
  });
});

