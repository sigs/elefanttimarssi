
import React from "react";
import CheckerBoard from "@/components/CheckerBoard";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 to-slate-200 py-8">
      <div className="container mx-auto px-4">
        <header className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-2">Mini Checkers</h1>
          <p className="text-gray-600">
            4-row checkers with a twist: promotion spawns new pieces!
          </p>
        </header>
        
        <div className="flex justify-center">
          <CheckerBoard />
        </div>
        
        <div className="mt-8 max-w-md mx-auto text-sm text-gray-600">
          <h3 className="font-bold mb-2">How to Play:</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>Move diagonally to empty squares</li>
            <li>Jump over opponent pieces to capture them</li>
            <li>When a piece reaches the opposite end, it becomes a king</li>
            <li>Kings can move both forward and backward</li>
            <li>When a piece is promoted, a new piece appears in your home row</li>
            <li>Capture all opponent pieces to win</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Index;
