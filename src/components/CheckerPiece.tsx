
import React from "react";
import { cn } from "@/lib/utils";
import { PieceType } from "./CheckerBoard";
import { Footprints } from "lucide-react";

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
      {/* Use Footprints icon to represent elephants and their tracks */}
      <Footprints 
        className={cn(
          player === 1 ? "text-amber-950" : "text-stone-500",
          isKing ? "w-8 h-8" : "w-6 h-6", // Adult elephants are bigger
          "transform transition-all"
        )}
      />
      
      {/* Add small ears to make it look more elephant-like */}
      <div className={cn(
        "absolute top-0 left-0 right-0 flex justify-center",
        isKing ? "scale-110" : "scale-100"
      )}>
        <div className={cn(
          "w-2 h-3 rounded-full -ml-5 mt-1",
          player === 1 ? "bg-amber-950" : "bg-stone-400"
        )}></div>
        <div className={cn(
          "w-2 h-3 rounded-full ml-5 mt-1",
          player === 1 ? "bg-amber-950" : "bg-stone-400"
        )}></div>
      </div>
    </div>
  );
};

export default CheckerPiece;
