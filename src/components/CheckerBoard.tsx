
import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import CheckerPiece from "./CheckerPiece";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { Computer } from "lucide-react";

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
  const [isComputerPlayer, setIsComputerPlayer] = useState<boolean>(false);

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
  const calculateValidMoves = (piece: PieceType): [number, number][] => {
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

    // Check for jumps first
    directions.forEach(([dr, dc]) => {
      const jumpRow = row + dr * 2;
      const jumpCol = col + dc * 2;
      const intermediateRow = row + dr;
      const intermediateCol = col + dc;
      
      // Get the piece at the intermediate position
      const intermediatePiece = getPieceAtPosition(intermediateRow, intermediateCol);
      
      // Fixed jump validation: Check that we're jumping over an opponent's piece
      if (
        jumpRow >= 0 && jumpRow < 4 && jumpCol >= 0 && jumpCol < 8 && // Within board
        !getPieceAtPosition(jumpRow, jumpCol) && // Landing spot is empty
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
        !getPieceAtPosition(newRow, newCol) // Spot is empty
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
    
    // Check for promotion (reaching the opposite end)
    const shouldPromote = 
      (updatedPiece.player === 1 && toRow === 0) || 
      (updatedPiece.player === 2 && toRow === 3);
    
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
      const furtherJumps = calculateValidMoves(updatedPiece).filter(
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

  // Simple AI for computer player
  const makeComputerMove = () => {
    if (currentPlayer !== 2 || gameOver) return;
    
    const computerPieces = pieces.filter(p => p.player === 2);
    if (computerPieces.length === 0) return;
    
    // First, look for mandatory jumps
    let jumpingPiece = null;
    let jumpMove: [number, number] | null = null;
    
    for (const piece of computerPieces) {
      const moves = calculateValidMoves(piece);
      const jumpMoves = moves.filter(([row, col]) => 
        Math.abs(row - piece.position[0]) === 2
      );
      
      if (jumpMoves.length > 0) {
        jumpingPiece = piece;
        jumpMove = jumpMoves[0];
        break;
      }
    }
    
    // If there's a jump, take it
    if (jumpingPiece && jumpMove) {
      setSelectedPiece(jumpingPiece);
      setValidMoves([jumpMove]);
      setTimeout(() => {
        movePiece(jumpingPiece!, jumpMove![0], jumpMove![1]);
      }, 500);
      return;
    }
    
    // Otherwise, make a regular move
    const availablePieces = computerPieces.filter(piece => 
      calculateValidMoves(piece).length > 0
    );
    
    if (availablePieces.length > 0) {
      // Pick a random piece that can move
      const randomPiece = availablePieces[Math.floor(Math.random() * availablePieces.length)];
      const moves = calculateValidMoves(randomPiece);
      const randomMove = moves[Math.floor(Math.random() * moves.length)];
      
      setSelectedPiece(randomPiece);
      setValidMoves([randomMove]);
      setTimeout(() => {
        movePiece(randomPiece, randomMove[0], randomMove[1]);
      }, 500);
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
  }, [currentPlayer, isComputerPlayer, gameOver]);

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

