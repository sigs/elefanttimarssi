
import React from "react";
import { cn } from "@/lib/utils";
import { PieceType } from "./CheckerBoard";
import { Elephant } from "lucide-react";

interface CheckerPieceProps {
  piece: PieceType;
  isSelected: boolean;
  onSelect: () => void;
  isHighlighted?: boolean;
}

const CheckerPiece: React.FC<CheckerPieceProps> = ({ piece, isSelected, onSelect, isHighlighted = false }) => {
  const { player, isKing } = piece;
  
  return (
    <div
      className={cn(
        "w-10 h-10 rounded-full cursor-pointer relative flex items-center justify-center transform transition-all duration-200",
        player === 1 ? "bg-amber-900/80 border-2 border-amber-800" : "bg-stone-200 border-2 border-white",
        isSelected && "ring-4 ring-yellow-400 scale-110",
        isHighlighted && "ring-2 ring-blue-500"
      )}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
    >
      <Elephant 
        className={cn(
          player === 1 ? "text-amber-950" : "text-stone-500",
          isKing ? "w-8 h-8" : "w-6 h-6", // Adult elephants are bigger
          "transform transition-all"
        )}
      />
    </div>
  );
};

export default CheckerPiece;
