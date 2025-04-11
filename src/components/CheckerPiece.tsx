
import React from "react";
import { cn } from "@/lib/utils";
import { PieceType } from "./CheckerBoard";
import { Crown } from "lucide-react";

interface CheckerPieceProps {
  piece: PieceType;
  isSelected: boolean;
  onSelect: () => void;
}

const CheckerPiece: React.FC<CheckerPieceProps> = ({ piece, isSelected, onSelect }) => {
  const { player, isKing } = piece;
  
  return (
    <div
      className={cn(
        "w-10 h-10 rounded-full cursor-pointer relative flex items-center justify-center transform transition-all duration-200",
        player === 1 ? "bg-black border-2 border-gray-400" : "bg-gray-200 border-2 border-white",
        isSelected && "ring-4 ring-yellow-400 scale-110"
      )}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
    >
      {isKing && (
        <Crown 
          className={cn(
            "w-6 h-6",
            player === 1 ? "text-yellow-400" : "text-yellow-600"
          )} 
        />
      )}
    </div>
  );
};

export default CheckerPiece;
