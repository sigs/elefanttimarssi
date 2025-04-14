
import React from "react";
import CheckerBoard from "@/components/CheckerBoard";
import { useIsMobile } from "@/hooks/use-mobile";

const Index = () => {
  const isMobile = useIsMobile();

  return (
    <div className="min-h-screen bg-emerald-900 bg-[url('/lovable-uploads/3f78b572-570a-4eb5-8bdd-20908ec3338a.png')] bg-cover bg-center py-8">
      <div className="container mx-auto px-4">
        <header className={`text-center mb-8 ${!isMobile ? 'bg-black/30 rounded-lg p-4' : ''}`}>
          <h1 className="text-3xl sm:text-4xl font-bold text-amber-50 mb-2 drop-shadow-md">Elefanttimarssi</h1>
          <p className="text-amber-100 drop-shadow-sm">
            Yksi pieni elefantti marssi näin aurinkoista tietä eteenpäin
          </p>
        </header>
        
        <div className="flex justify-center w-full">
          <div className={`${!isMobile ? 'bg-black/30 p-4 rounded-lg' : 'w-full'}`}>
            <CheckerBoard />
          </div>
        </div>
        
        <div className="mt-8 max-w-md mx-auto text-sm text-amber-100 bg-black/50 p-4 rounded-md">
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
