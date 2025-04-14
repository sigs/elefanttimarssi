
import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import CheckerPiece from "./CheckerPiece";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { Computer } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useIsMobile } from "@/hooks/use-mobile";

export type PieceType = {
  id: number;
  player: 1 | 2;
  isKing: boolean;
  position: [number, number]; // [row, col]
};

const initialPieces: PieceType[] = [
  { id: 1, player: 1, isKing: false, position: [3, 0] }, // Player 1 starts with one piece (bottom row, valid black square)
  { id: 2, player: 2, isKing: false, position: [0, 1] }, // Player 2 starts with one piece (top row, valid black square)
];

const CheckerBoard = () => {
  const isMobile = useIsMobile();
  const [pieces, setPieces] = useState<PieceType[]>(initialPieces);
  const [selectedPiece, setSelectedPiece] = useState<PieceType | null>(null);
  const [validMoves, setValidMoves] = useState<[number, number][]>([]);
  const [currentPlayer, setCurrentPlayer] = useState<1 | 2>(1);
  const [mustJump, setMustJump] = useState<boolean>(false);
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [winner, setWinner] = useState<1 | 2 | null>(null);
  const [nextId, setNextId] = useState(3);
  const [isComputerPlayer, setIsComputerPlayer] = useState<boolean>(true);
  const [searchDepth, setSearchDepth] = useState<number>(5);
  const [piecesWithJumps, setPiecesWithJumps] = useState<number[]>([]);

  const resetGame = () => {
    setPieces(initialPieces);
    setSelectedPiece(null);
    setValidMoves([]);
    setCurrentPlayer(1);
    setMustJump(false);
    setGameOver(false);
    setWinner(null);
    setPiecesWithJumps([]);
  };

  const getPieceAtPosition = (row: number, col: number) => {
    return pieces.find(piece => piece.position[0] === row && piece.position[1] === col);
  };

  const isValidCheckerSquare = (row: number, col: number) => {
    return (row + col) % 2 === 1;
  };

  const calculateValidMoves = (piece: PieceType, boardState: PieceType[] = pieces): [number, number][] => {
    if (!piece) return [];

    const [row, col] = piece.position;
    const moves: [number, number][] = [];
    const jumps: [number, number][] = [];
    
    const directions = piece.isKing 
      ? [[-1, -1], [-1, 1], [1, -1], [1, 1]]
      : piece.player === 1 
        ? [[-1, -1], [-1, 1]]
        : [[1, -1], [1, 1]];

    const getPieceFromBoardState = (r: number, c: number) => {
      return boardState.find(p => p.position[0] === r && p.position[1] === c);
    };

    directions.forEach(([dr, dc]) => {
      const jumpRow = row + dr * 2;
      const jumpCol = col + dc * 2;
      const intermediateRow = row + dr;
      const intermediateCol = col + dc;
      
      const intermediatePiece = getPieceFromBoardState(intermediateRow, intermediateCol);
      
      if (
        jumpRow >= 0 && jumpRow < 4 && jumpCol >= 0 && jumpCol < 8 &&
        !getPieceFromBoardState(jumpRow, jumpCol) &&
        intermediatePiece &&
        intermediatePiece.player !== piece.player
      ) {
        jumps.push([jumpRow, jumpCol]);
      }
    });

    if (jumps.length > 0) {
      return jumps;
    }

    directions.forEach(([dr, dc]) => {
      const newRow = row + dr;
      const newCol = col + dc;
      
      if (
        newRow >= 0 && newRow < 4 && newCol >= 0 && newCol < 8 &&
        !getPieceFromBoardState(newRow, newCol)
      ) {
        moves.push([newRow, newCol]);
      }
    });

    return moves;
  };

  const findPiecesWithJumps = (player: 1 | 2, boardState: PieceType[] = pieces): number[] => {
    const playerPieces = boardState.filter(p => p.player === player);
    const piecesWithJumps: number[] = [];
    
    playerPieces.forEach(piece => {
      const moves = calculateValidMoves(piece, boardState);
      const jumpMoves = moves.filter(([row, col]) => 
        Math.abs(row - piece.position[0]) === 2 && Math.abs(col - piece.position[1]) === 2
      );
      
      if (jumpMoves.length > 0) {
        piecesWithJumps.push(piece.id);
      }
    });
    
    return piecesWithJumps;
  };

  useEffect(() => {
    if (!gameOver) {
      const jumpingPieces = findPiecesWithJumps(currentPlayer);
      setPiecesWithJumps(jumpingPieces);
      
      if (selectedPiece && jumpingPieces.length > 0 && !jumpingPieces.includes(selectedPiece.id)) {
        setSelectedPiece(null);
        setValidMoves([]);
      }
    }
  }, [currentPlayer, pieces]);

  const handlePieceSelect = (piece: PieceType) => {
    if (piece.player !== currentPlayer || gameOver) return;
    
    if (piecesWithJumps.length > 0 && !piecesWithJumps.includes(piece.id)) {
      toast({
        title: "Jump required!",
        description: "You must make a jump move with another piece.",
        variant: "destructive",
      });
      return;
    }
    
    setSelectedPiece(piece);
    
    const moves = calculateValidMoves(piece);
    
    const jumpMoves = moves.filter(([row, col]) => 
      Math.abs(row - piece.position[0]) === 2 && Math.abs(col - piece.position[1]) === 2
    );
    
    if (jumpMoves.length > 0) {
      setValidMoves(jumpMoves);
      setMustJump(true);
    } else {
      setValidMoves(moves);
      setMustJump(false);
    }
  };

  const handleSquareClick = (row: number, col: number) => {
    if (!selectedPiece || gameOver) return;
    
    if (validMoves.some(([r, c]) => r === row && c === col)) {
      movePiece(selectedPiece, row, col);
    }
  };

  const movePiece = (piece: PieceType, toRow: number, toCol: number) => {
    let newPieces = [...pieces];
    
    const isJump = Math.abs(toRow - piece.position[0]) === 2;
    
    if (isJump) {
      const jumpedRow = (piece.position[0] + toRow) / 2;
      const jumpedCol = (piece.position[1] + toCol) / 2;
      
      newPieces = newPieces.filter(p => !(p.position[0] === jumpedRow && p.position[1] === jumpedCol));
    }
    
    const pieceIndex = newPieces.findIndex(p => p.id === piece.id);
    
    const updatedPiece = { ...newPieces[pieceIndex] };
    
    updatedPiece.position = [toRow, toCol];
    
    const shouldPromote = 
      !updatedPiece.isKing &&
      ((updatedPiece.player === 1 && toRow === 0) || 
      (updatedPiece.player === 2 && toRow === 3));
    
    if (shouldPromote) {
      updatedPiece.isKing = true;
      
      const newPieceRow = updatedPiece.player === 1 ? 3 : 0;
      
      let newPieceCol = toCol;
      
      if (!isValidCheckerSquare(newPieceRow, newPieceCol)) {
        newPieceCol += 1;
      }
      
      let attempts = 0;
      while (attempts < 8 && (getPieceAtPosition(newPieceRow, newPieceCol % 8) || !isValidCheckerSquare(newPieceRow, newPieceCol % 8))) {
        newPieceCol = (newPieceCol + 2) % 8;
        attempts += 1;
      }
      
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
        
        toast({
          description: "Koska päivä oli hauska niin, ottivat he mukaan yhden kaverin!",
        });
      }
    }
    
    newPieces[pieceIndex] = updatedPiece;
    
    setPieces(newPieces);
    
    if (isJump) {
      const furtherJumps = calculateValidMoves(updatedPiece, newPieces).filter(
        ([row, col]) => Math.abs(row - updatedPiece.position[0]) === 2
      );
      
      if (furtherJumps.length > 0) {
        setSelectedPiece(updatedPiece);
        setValidMoves(furtherJumps);
        return;
      }
    }
    
    setSelectedPiece(null);
    setValidMoves([]);
    setCurrentPlayer(currentPlayer === 1 ? 2 : 1);
  };

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

  const evaluateBoard = (boardState: PieceType[]) => {
    const player1Pieces = boardState.filter(p => p.player === 1);
    const player2Pieces = boardState.filter(p => p.player === 2);
    
    let player1Score = player1Pieces.reduce((score, piece) => 
      score + (piece.isKing ? 1 : 10), 0);
    
    let player2Score = player2Pieces.reduce((score, piece) => 
      score + (piece.isKing ? 1 : 10), 0);
    
    player1Pieces.forEach(piece => {
      if (!piece.isKing) {
        player1Score += (3 - piece.position[0]) * 0.1;
      }
    });
    
    player2Pieces.forEach(piece => {
      if (!piece.isKing) {
        player2Score += piece.position[0] * 0.1;
      }
    });
    
    return player2Score - player1Score;
  };

  const simulateMove = (piece: PieceType, toRow: number, toCol: number, boardState: PieceType[]): PieceType[] => {
    let newBoardState = JSON.parse(JSON.stringify(boardState));
    
    const isJump = Math.abs(toRow - piece.position[0]) === 2;
    
    const pieceIndex = newBoardState.findIndex((p: PieceType) => p.id === piece.id);
    
    if (isJump) {
      const jumpedRow = (piece.position[0] + toRow) / 2;
      const jumpedCol = (piece.position[1] + toCol) / 2;
      
      newBoardState = newBoardState.filter((p: PieceType) => 
        !(p.position[0] === jumpedRow && p.position[1] === jumpedCol)
      );
    }
    
    const updatedPiece = { ...newBoardState[pieceIndex] };
    updatedPiece.position = [toRow, toCol];
    
    const shouldPromote = 
      !updatedPiece.isKing && 
      ((updatedPiece.player === 1 && toRow === 0) || 
       (updatedPiece.player === 2 && toRow === 3));
    
    if (shouldPromote) {
      updatedPiece.isKing = true;
    }
    
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
    if (depth === 0) {
      return { score: evaluateBoard(boardState) };
    }
    
    const playerPieces = boardState.filter(p => p.player === player);
    
    if (playerPieces.length === 0) {
      return { 
        score: player === 2 ? -1000 : 1000
      };
    }
    
    let allMoves: { piece: PieceType; to: [number, number] }[] = [];
    let jumpMoves: { piece: PieceType; to: [number, number] }[] = [];
    
    for (const piece of playerPieces) {
      const moves = calculateValidMoves(piece, boardState);
      
      const pieceJumps = moves.filter(
        ([row, col]) => Math.abs(row - piece.position[0]) === 2
      );
      
      if (pieceJumps.length > 0) {
        pieceJumps.forEach(move => {
          jumpMoves.push({ piece, to: move });
        });
      } else if (jumpMoves.length === 0) {
        moves.forEach(move => {
          allMoves.push({ piece, to: move });
        });
      }
    }
    
    if (jumpMoves.length > 0) {
      allMoves = jumpMoves;
    }
    
    if (allMoves.length === 0) {
      return {
        score: player === 2 ? -1000 : 1000
      };
    }
    
    let bestMove: { piece: PieceType; to: [number, number] } | undefined;
    
    if (isMaximizingPlayer) {
      let maxEval = -Infinity;
      
      for (const move of allMoves) {
        const newBoardState = simulateMove(move.piece, move.to[0], move.to[1], boardState);
        
        const evaluation = minMax(depth - 1, newBoardState, alpha, beta, false, 1).score;
        
        if (evaluation > maxEval) {
          maxEval = evaluation;
          bestMove = move;
        }
        
        alpha = Math.max(alpha, maxEval);
        if (beta <= alpha) {
          break;
        }
      }
      
      return { score: maxEval, move: bestMove };
    } else {
      let minEval = Infinity;
      
      for (const move of allMoves) {
        const newBoardState = simulateMove(move.piece, move.to[0], move.to[1], boardState);
        
        const evaluation = minMax(depth - 1, newBoardState, alpha, beta, true, 2).score;
        
        if (evaluation < minEval) {
          minEval = evaluation;
          bestMove = move;
        }
        
        beta = Math.min(beta, minEval);
        if (beta <= alpha) {
          break;
        }
      }
      
      return { score: minEval, move: bestMove };
    }
  };

  const makeComputerMove = () => {
    if (currentPlayer !== 2 || gameOver) return;
    
    const computerPieces = pieces.filter(p => p.player === 2);
    if (computerPieces.length === 0) return;
    
    const bestMoveResult = minMax(
      searchDepth, 
      pieces, 
      -Infinity, 
      Infinity, 
      true,
      2
    );
    
    if (bestMoveResult.move) {
      const { piece, to } = bestMoveResult.move;
      
      const currentPiece = pieces.find(p => p.id === piece.id);
      
      if (currentPiece) {
        setSelectedPiece(currentPiece);
        setValidMoves([to]);
        
        setTimeout(() => {
          movePiece(currentPiece, to[0], to[1]);
        }, 500);
      }
    }
  };

  const handleSearchDepthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const depth = parseInt(e.target.value);
    if (!isNaN(depth) && depth > 0 && depth <= 10) {
      setSearchDepth(depth);
    }
  };

  useEffect(() => {
    if (!gameOver) {
      checkWinner();
    }
  }, [pieces]);

  useEffect(() => {
    if (isComputerPlayer && currentPlayer === 2 && !gameOver) {
      const timer = setTimeout(() => {
        makeComputerMove();
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [currentPlayer, isComputerPlayer, gameOver, searchDepth]);

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
              "aspect-square flex items-center justify-center relative",
              isMobile ? "w-full" : "w-12 sm:w-16",
              isBlackSquare ? "bg-amber-700/80 bg-[url('/footpath.jpeg')] bg-cover" : "bg-emerald-800/80 bg-[url('/jungle.jpeg')] bg-cover",
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
                isHighlighted={piecesWithJumps.includes(piece.id)}
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
      <h2 className="text-2xl font-bold mb-2 text-amber-50 drop-shadow-md">
        {gameOver 
          ? `Pelaaja ${winner} voittaa!` 
          : `Pelaaja ${currentPlayer}:n vuoro`}
      </h2>
      
      <div className={cn(
        "grid grid-cols-8 border border-amber-900 shadow-lg rounded-md overflow-hidden",
        isMobile ? "w-full" : "w-auto"
      )}>
        {renderBoard()}
      </div>
      
      <div className="flex flex-col sm:flex-row gap-4 mt-4 items-center">
        <Button variant="outline" onClick={resetGame} className="bg-amber-100/90">Uusi peli</Button>
        
        <div className="flex items-center gap-2">
          <Checkbox 
            id="computer-player" 
            checked={isComputerPlayer} 
            onCheckedChange={(checked) => setIsComputerPlayer(checked === true)}
          />
          <label htmlFor="computer-player" className="text-sm cursor-pointer text-amber-50">
            Tietokone pelaa Pelaaja 2:na
          </label>
        </div>
        
        <div className="flex items-center gap-2">
          <label htmlFor="search-depth" className="text-sm whitespace-nowrap text-amber-50">
            Haun syvyys:
          </label>
          <Input
            id="search-depth"
            type="number"
            min="1"
            max="10"
            className="w-16 bg-amber-100/90"
            value={searchDepth}
            onChange={handleSearchDepthChange}
          />
        </div>
        
        {currentPlayer === 2 && !gameOver && !isComputerPlayer && (
          <Button onClick={makeComputerMove} variant="secondary" className="bg-amber-100/90">
            <Computer className="mr-2 h-4 w-4" />
            Tee tietokoneen siirto
          </Button>
        )}
      </div>
    </div>
  );
};

export default CheckerBoard;
