
import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import CheckerPiece from "./CheckerPiece";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { Computer } from "lucide-react";
import { Input } from "@/components/ui/input";

// Define piece types
export type PieceType = {
  id: number;
  player: 1 | 2;
  isKing: boolean;
  position: [number, number]; // [row, col]
};

// Initial setup with one piece per player on valid checkerboard squares
const initialPieces: PieceType[] = [
  { id: 1, player: 1, isKing: false, position: [3, 0] }, // Player 1 starts with one piece (bottom row, valid black square)
  { id: 2, player: 2, isKing: false, position: [0, 1] }, // Player 2 starts with one piece (top row, valid black square)
];

const CheckerBoard = () => {
  const [pieces, setPieces] = useState<PieceType[]>(initialPieces);
  const [selectedPiece, setSelectedPiece] = useState<PieceType | null>(null);
  const [validMoves, setValidMoves] = useState<[number, number][]>([]);
  const [currentPlayer, setCurrentPlayer] = useState<1 | 2>(1);
  const [mustJump, setMustJump] = useState<boolean>(false);
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [winner, setWinner] = useState<1 | 2 | null>(null);
  const [nextId, setNextId] = useState(3); // For generating unique IDs for new pieces
  const [isComputerPlayer, setIsComputerPlayer] = useState<boolean>(true); // Set to true by default
  const [searchDepth, setSearchDepth] = useState<number>(5); // Default search depth is 5 plys

  // Reset game
  const resetGame = () => {
    setPieces(initialPieces);
    setSelectedPiece(null);
    setValidMoves([]);
    setCurrentPlayer(1);
    setMustJump(false);
    setGameOver(false);
    setWinner(null);
    setNextId(3);
  };

  // Helper to find a piece at a given position
  const getPieceAtPosition = (row: number, col: number) => {
    return pieces.find(piece => piece.position[0] === row && piece.position[1] === col);
  };

  // Helper to check if a position is a valid checkerboard square (black square)
  const isValidCheckerSquare = (row: number, col: number) => {
    return (row + col) % 2 === 1;
  };

  // Check if a move is valid
  const calculateValidMoves = (piece: PieceType, boardState: PieceType[] = pieces): [number, number][] => {
    if (!piece) return [];

    const [row, col] = piece.position;
    const moves: [number, number][] = [];
    const jumps: [number, number][] = [];
    
    // Directions to check (forward for normal pieces, all directions for kings)
    const directions = piece.isKing 
      ? [[-1, -1], [-1, 1], [1, -1], [1, 1]] // Kings can move in all directions
      : piece.player === 1 
        ? [[-1, -1], [-1, 1]] // Player 1 moves up
        : [[1, -1], [1, 1]];  // Player 2 moves down

    // Helper to find pieces in the board state
    const getPieceFromBoardState = (r: number, c: number) => {
      return boardState.find(p => p.position[0] === r && p.position[1] === c);
    };

    // Check for jumps first
    directions.forEach(([dr, dc]) => {
      const jumpRow = row + dr * 2;
      const jumpCol = col + dc * 2;
      const intermediateRow = row + dr;
      const intermediateCol = col + dc;
      
      // Get the piece at the intermediate position
      const intermediatePiece = getPieceFromBoardState(intermediateRow, intermediateCol);
      
      // Fixed jump validation: Check that we're jumping over an opponent's piece
      if (
        jumpRow >= 0 && jumpRow < 4 && jumpCol >= 0 && jumpCol < 8 && // Within board
        !getPieceFromBoardState(jumpRow, jumpCol) && // Landing spot is empty
        intermediatePiece && // There is a piece to jump over
        intermediatePiece.player !== piece.player // It's an opponent's piece
      ) {
        jumps.push([jumpRow, jumpCol]);
      }
    });

    // If jumps are available, only allow jumps
    if (jumps.length > 0) {
      return jumps;
    }

    // Regular moves if no jumps are available
    directions.forEach(([dr, dc]) => {
      const newRow = row + dr;
      const newCol = col + dc;
      
      if (
        newRow >= 0 && newRow < 4 && newCol >= 0 && newCol < 8 && // Within board
        !getPieceFromBoardState(newRow, newCol) // Spot is empty
      ) {
        moves.push([newRow, newCol]);
      }
    });

    return moves;
  };

  // Handle piece selection
  const handlePieceSelect = (piece: PieceType) => {
    // Can only select pieces of the current player
    if (piece.player !== currentPlayer || gameOver) return;
    
    setSelectedPiece(piece);
    
    // Calculate and show valid moves
    const moves = calculateValidMoves(piece);
    
    // Check if any moves are jumps
    const jumpMoves = moves.filter(([row, col]) => 
      Math.abs(row - piece.position[0]) === 2 && Math.abs(col - piece.position[1]) === 2
    );
    
    // If there are jumps, only allow jumps
    if (jumpMoves.length > 0) {
      setValidMoves(jumpMoves);
      setMustJump(true);
    } else {
      setValidMoves(moves);
      setMustJump(false);
    }
  };

  // Handle square click for moving a piece
  const handleSquareClick = (row: number, col: number) => {
    if (!selectedPiece || gameOver) return;
    
    // Check if the clicked square is a valid move
    if (validMoves.some(([r, c]) => r === row && c === col)) {
      movePiece(selectedPiece, row, col);
    }
  };

  // Handle moving a piece
  const movePiece = (piece: PieceType, toRow: number, toCol: number) => {
    // Make a copy of the pieces array
    let newPieces = [...pieces];
    
    // Check if this is a jump move
    const isJump = Math.abs(toRow - piece.position[0]) === 2;
    
    if (isJump) {
      // Calculate the position of the jumped piece
      const jumpedRow = (piece.position[0] + toRow) / 2;
      const jumpedCol = (piece.position[1] + toCol) / 2;
      
      // Remove the jumped piece
      newPieces = newPieces.filter(p => !(p.position[0] === jumpedRow && p.position[1] === jumpedCol));
    }
    
    // Update the selected piece's position
    const pieceIndex = newPieces.findIndex(p => p.id === piece.id);
    
    // Create a copy of the piece to modify
    const updatedPiece = { ...newPieces[pieceIndex] };
    
    // Update position
    updatedPiece.position = [toRow, toCol];
    
    // Check for promotion (reaching the opposite end and not already a king)
    const shouldPromote = 
      !updatedPiece.isKing && // Only promote if not already a king
      ((updatedPiece.player === 1 && toRow === 0) || 
      (updatedPiece.player === 2 && toRow === 3));
    
    if (shouldPromote) {
      updatedPiece.isKing = true;
      
      // Create a new piece in the home row
      const newPieceRow = updatedPiece.player === 1 ? 3 : 0;
      
      // Find a corresponding empty spot in the home row
      // Start with the same column as the promoted piece if it's a valid square
      let newPieceCol = toCol;
      
      // If the column is not a valid checker square, adjust it
      if (!isValidCheckerSquare(newPieceRow, newPieceCol)) {
        newPieceCol += 1; // Move to the next column
      }
      
      // If that spot is occupied or invalid, search for another valid spot
      let attempts = 0;
      while (attempts < 8 && (getPieceAtPosition(newPieceRow, newPieceCol % 8) || !isValidCheckerSquare(newPieceRow, newPieceCol % 8))) {
        newPieceCol = (newPieceCol + 2) % 8; // Try next valid square (skip 2 to stay on same color)
        attempts += 1;
      }
      
      // If there's an open valid spot, add the new piece
      if (attempts < 8) {
        const validCol = newPieceCol % 8;
        const newPiece = {
          id: nextId,
          player: updatedPiece.player,
          isKing: false,
          position: [newPieceRow, validCol] as [number, number]
        };
        newPieces.push(newPiece);
        setNextId(nextId + 1);
        
        // Show toast for promotion
        toast({
          title: "Piece Promoted!",
          description: "A king was crowned and a new piece appeared.",
        });
      }
    }
    
    // Update the piece in the array
    newPieces[pieceIndex] = updatedPiece;
    
    // Update state
    setPieces(newPieces);
    
    // Check if the player can jump again with the same piece
    if (isJump) {
      const furtherJumps = calculateValidMoves(updatedPiece, newPieces).filter(
        ([row, col]) => Math.abs(row - updatedPiece.position[0]) === 2
      );
      
      if (furtherJumps.length > 0) {
        // Player can continue jumping
        setSelectedPiece(updatedPiece);
        setValidMoves(furtherJumps);
        return;
      }
    }
    
    // End turn
    setSelectedPiece(null);
    setValidMoves([]);
    setCurrentPlayer(currentPlayer === 1 ? 2 : 1);
  };

  // Check for winner
  const checkWinner = () => {
    const player1Pieces = pieces.filter(p => p.player === 1).length;
    const player2Pieces = pieces.filter(p => p.player === 2).length;
    
    if (player1Pieces === 0) {
      setGameOver(true);
      setWinner(2);
      return true;
    } else if (player2Pieces === 0) {
      setGameOver(true);
      setWinner(1);
      return true;
    }
    
    return false;
  };

  // Min-Max algorithm with Alpha-Beta Pruning for AI player
  const evaluateBoard = (boardState: PieceType[]) => {
    const player1Pieces = boardState.filter(p => p.player === 1);
    const player2Pieces = boardState.filter(p => p.player === 2);
    
    // Count pieces with weights (kings are worth more)
    let player1Score = player1Pieces.reduce((score, piece) => 
      score + (piece.isKing ? 3 : 1), 0);
    
    let player2Score = player2Pieces.reduce((score, piece) => 
      score + (piece.isKing ? 3 : 1), 0);
    
    // Consider position - pieces closer to promotion are worth more
    player1Pieces.forEach(piece => {
      if (!piece.isKing) {
        // Player 1 moves up, so row 1 is worth more than row 2, etc.
        player1Score += (3 - piece.position[0]) * 0.1;
      }
    });
    
    player2Pieces.forEach(piece => {
      if (!piece.isKing) {
        // Player 2 moves down, so row 2 is worth more than row 1, etc.
        player2Score += piece.position[0] * 0.1;
      }
    });
    
    // Return the score differential from player2's perspective
    return player2Score - player1Score;
  };

  const simulateMove = (piece: PieceType, toRow: number, toCol: number, boardState: PieceType[]): PieceType[] => {
    // Create a deep copy of the board state
    let newBoardState = JSON.parse(JSON.stringify(boardState));
    
    // Check if the move is a jump
    const isJump = Math.abs(toRow - piece.position[0]) === 2;
    
    // Find the piece in the new board state
    const pieceIndex = newBoardState.findIndex((p: PieceType) => p.id === piece.id);
    
    if (isJump) {
      // Calculate position of jumped piece
      const jumpedRow = (piece.position[0] + toRow) / 2;
      const jumpedCol = (piece.position[1] + toCol) / 2;
      
      // Remove the jumped piece
      newBoardState = newBoardState.filter((p: PieceType) => 
        !(p.position[0] === jumpedRow && p.position[1] === jumpedCol)
      );
    }
    
    // Update the piece's position
    const updatedPiece = { ...newBoardState[pieceIndex] };
    updatedPiece.position = [toRow, toCol];
    
    // Check for promotion
    const shouldPromote = 
      !updatedPiece.isKing && 
      ((updatedPiece.player === 1 && toRow === 0) || 
       (updatedPiece.player === 2 && toRow === 3));
    
    if (shouldPromote) {
      updatedPiece.isKing = true;
      // In simulation, we don't add the new piece to simplify
    }
    
    // Update the board state
    newBoardState[pieceIndex] = updatedPiece;
    
    return newBoardState;
  };

  const minMax = (
    depth: number,
    boardState: PieceType[],
    alpha: number,
    beta: number,
    isMaximizingPlayer: boolean,
    player: 1 | 2
  ): { score: number; move?: { piece: PieceType; to: [number, number] } } => {
    // Base case: terminal node or max depth reached
    if (depth === 0) {
      return { score: evaluateBoard(boardState) };
    }
    
    const playerPieces = boardState.filter(p => p.player === player);
    
    // Check if any player has no pieces left
    if (playerPieces.length === 0) {
      return { 
        score: player === 2 ? -1000 : 1000 // Very high/low score based on who lost
      };
    }
    
    // Find all possible moves for the current player
    let allMoves: { piece: PieceType; to: [number, number] }[] = [];
    let jumpMoves: { piece: PieceType; to: [number, number] }[] = [];
    
    // Check for jumps first
    for (const piece of playerPieces) {
      const moves = calculateValidMoves(piece, boardState);
      
      // Separate jump moves
      const pieceJumps = moves.filter(
        ([row, col]) => Math.abs(row - piece.position[0]) === 2
      );
      
      if (pieceJumps.length > 0) {
        pieceJumps.forEach(move => {
          jumpMoves.push({ piece, to: move });
        });
      } else if (jumpMoves.length === 0) { // Only consider non-jump moves if no jumps are available
        moves.forEach(move => {
          allMoves.push({ piece, to: move });
        });
      }
    }
    
    // If jumps are available, only consider jumps
    if (jumpMoves.length > 0) {
      allMoves = jumpMoves;
    }
    
    // No moves available, this is a loss for the current player
    if (allMoves.length === 0) {
      return {
        score: player === 2 ? -1000 : 1000 // Very high/low score based on who lost
      };
    }
    
    let bestMove: { piece: PieceType; to: [number, number] } | undefined;
    
    if (isMaximizingPlayer) { // Player 2 (AI)
      let maxEval = -Infinity;
      
      for (const move of allMoves) {
        // Simulate this move
        const newBoardState = simulateMove(move.piece, move.to[0], move.to[1], boardState);
        
        // Recursively evaluate this move
        const evaluation = minMax(depth - 1, newBoardState, alpha, beta, false, 1).score;
        
        if (evaluation > maxEval) {
          maxEval = evaluation;
          bestMove = move;
        }
        
        alpha = Math.max(alpha, maxEval);
        if (beta <= alpha) {
          break; // Beta cutoff
        }
      }
      
      return { score: maxEval, move: bestMove };
    } else { // Player 1 (human)
      let minEval = Infinity;
      
      for (const move of allMoves) {
        // Simulate this move
        const newBoardState = simulateMove(move.piece, move.to[0], move.to[1], boardState);
        
        // Recursively evaluate this move
        const evaluation = minMax(depth - 1, newBoardState, alpha, beta, true, 2).score;
        
        if (evaluation < minEval) {
          minEval = evaluation;
          bestMove = move;
        }
        
        beta = Math.min(beta, minEval);
        if (beta <= alpha) {
          break; // Alpha cutoff
        }
      }
      
      return { score: minEval, move: bestMove };
    }
  };

  // Advanced AI for computer player using min-max algorithm
  const makeComputerMove = () => {
    if (currentPlayer !== 2 || gameOver) return;
    
    const computerPieces = pieces.filter(p => p.player === 2);
    if (computerPieces.length === 0) return;
    
    // Use min-max with alpha-beta pruning to find the best move
    const bestMoveResult = minMax(
      searchDepth, 
      pieces, 
      -Infinity, 
      Infinity, 
      true, // Maximizing player (AI)
      2 // Player 2
    );
    
    if (bestMoveResult.move) {
      const { piece, to } = bestMoveResult.move;
      
      // Find the actual piece in the current state (not from the simulation)
      const currentPiece = pieces.find(p => p.id === piece.id);
      
      if (currentPiece) {
        // Show the selected piece and valid move
        setSelectedPiece(currentPiece);
        setValidMoves([to]);
        
        // Execute the move after a short delay
        setTimeout(() => {
          movePiece(currentPiece, to[0], to[1]);
        }, 500);
      }
    }
  };

  // Handle search depth change
  const handleSearchDepthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const depth = parseInt(e.target.value);
    if (!isNaN(depth) && depth > 0 && depth <= 10) {
      setSearchDepth(depth);
    }
  };

  // Check for winner after each move
  useEffect(() => {
    if (!gameOver) {
      checkWinner();
    }
  }, [pieces]);

  // Auto-play computer moves if enabled
  useEffect(() => {
    if (isComputerPlayer && currentPlayer === 2 && !gameOver) {
      const timer = setTimeout(() => {
        makeComputerMove();
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [currentPlayer, isComputerPlayer, gameOver, searchDepth]);

  // Render the board
  const renderBoard = () => {
    const board = [];
    
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 8; col++) {
        const isBlackSquare = (row + col) % 2 === 1;
        const piece = getPieceAtPosition(row, col);
        const isValidMove = validMoves.some(([r, c]) => r === row && c === col);
        
        board.push(
          <div 
            key={`${row}-${col}`}
            className={cn(
              "aspect-square w-12 sm:w-16 flex items-center justify-center relative",
              isBlackSquare ? "bg-red-900" : "bg-amber-100",
              isValidMove && "bg-green-500/50"
            )}
            onClick={() => handleSquareClick(row, col)}
          >
            {isValidMove && (
              <div className="absolute inset-0 border-2 border-yellow-400 z-10"></div>
            )}
            {piece && (
              <CheckerPiece
                piece={piece}
                isSelected={selectedPiece?.id === piece.id}
                onSelect={() => handlePieceSelect(piece)}
              />
            )}
          </div>
        );
      }
    }
    
    return board;
  };

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <h2 className="text-2xl font-bold mb-2">
        {gameOver 
          ? `Player ${winner} Wins!` 
          : `Player ${currentPlayer}'s Turn`}
      </h2>
      
      <div className="grid grid-cols-8 border border-gray-800 shadow-lg">
        {renderBoard()}
      </div>
      
      <div className="flex flex-col sm:flex-row gap-4 mt-4 items-center">
        <Button variant="outline" onClick={resetGame}>New Game</Button>
        
        <div className="flex items-center gap-2">
          <Checkbox 
            id="computer-player" 
            checked={isComputerPlayer} 
            onCheckedChange={(checked) => setIsComputerPlayer(checked === true)}
          />
          <label htmlFor="computer-player" className="text-sm cursor-pointer">
            Computer plays Player 2
          </label>
        </div>
        
        <div className="flex items-center gap-2">
          <label htmlFor="search-depth" className="text-sm whitespace-nowrap">
            Search Depth:
          </label>
          <Input
            id="search-depth"
            type="number"
            min="1"
            max="10"
            className="w-16"
            value={searchDepth}
            onChange={handleSearchDepthChange}
          />
        </div>
        
        {currentPlayer === 2 && !gameOver && !isComputerPlayer && (
          <Button onClick={makeComputerMove} variant="secondary">
            <Computer className="mr-2 h-4 w-4" />
            Make Computer Move
          </Button>
        )}
      </div>
    </div>
  );
};

export default CheckerBoard;

