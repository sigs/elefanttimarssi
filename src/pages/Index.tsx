
import React from "react";
import CheckerBoard from "@/components/CheckerBoard";

const Index = () => {
  return (
    <div className="min-h-screen bg-[url('/jungle-background.jpg')] bg-cover bg-center py-8">
      <div className="container mx-auto px-4">
        <header className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-amber-50 mb-2 drop-shadow-md">Elefanttimarssi</h1>
          <p className="text-amber-100 drop-shadow-sm">
            Neljän rivin shakki jännittävällä tvistillä: ylennys tuo uusia nappuloita!
          </p>
        </header>
        
        <div className="flex justify-center">
          <CheckerBoard />
        </div>
        
        <div className="mt-8 max-w-md mx-auto text-sm text-amber-100 bg-amber-900/70 p-4 rounded-md">
          <h3 className="font-bold mb-2">Pelin säännöt:</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>Liiku viistosti tyhjiin ruutuihin</li>
            <li>Hyppää vastustajan nappulan yli kaappaaksesi sen</li>
            <li>Kun norsu saavuttaa vastapuolen, siitä tulee aikuinen norsu</li>
            <li>Aikuiset norsut voivat liikkua sekä eteen- että taaksepäin</li>
            <li>Kun norsu ylennetään, uusi norsu ilmestyy kotiriviin</li>
            <li>Kaappaa kaikki vastustajan norsut voittaaksesi</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Index;
