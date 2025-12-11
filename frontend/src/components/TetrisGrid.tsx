import './TetrisGrid.css';

interface TetrisGridProps {
  grid: number[][];
  currentPiece?: any;
  title?: string;
  score?: number;
  lines?: number;
  level?: number;
}

const COLORS = ['#000', '#00f0f0', '#f0f0f0', '#800080', '#00f000', '#f00000', '#0000f0', '#f0a000', '#f0f000'];

export default function TetrisGrid({ grid, currentPiece, title, score, lines, level }: TetrisGridProps) {
  const displayGrid = grid.map((row) => [...row]);

  // Place current piece on display grid
  if (currentPiece && currentPiece.shape) {
    const { shape, position } = currentPiece;
    for (let row = 0; row < shape.length; row++) {
      for (let col = 0; col < shape[row].length; col++) {
        if (shape[row][col]) {
          const y = position.y + row;
          const x = position.x + col;
          if (y >= 0 && y < displayGrid.length && x >= 0 && x < displayGrid[0].length) {
            displayGrid[y][x] = 2; // Use 2 to show current piece
          }
        }
      }
    }
  }

  return (
    <div className="tetris-grid-container">
      {title && <h3 className="grid-title">{title}</h3>}
      <div className="tetris-grid">
        {displayGrid.map((row, rowIndex) => (
          <div key={rowIndex} className="grid-row">
            {row.map((cell, colIndex) => (
              <div
                key={`${rowIndex}-${colIndex}`}
                className="grid-cell"
                style={{
                  backgroundColor: COLORS[cell] || COLORS[0],
                  border: cell ? '1px solid #333' : '1px solid #555',
                }}
              />
            ))}
          </div>
        ))}
      </div>
      {(score !== undefined || lines !== undefined || level !== undefined) && (
        <div className="grid-stats">
          {score !== undefined && <div>Score: {score}</div>}
          {lines !== undefined && <div>Lines: {lines}</div>}
          {level !== undefined && <div>Level: {level}</div>}
        </div>
      )}
    </div>
  );
}

