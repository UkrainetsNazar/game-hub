import { createContext, useContext, useState } from "react";

const GameContext = createContext();

export const GameProvider = ({ children }) => {
  const [game, setGame] = useState(null);
  const [isMyTurn, setIsMyTurn] = useState(false);

  return (
    <GameContext.Provider value={{ game, setGame, isMyTurn, setIsMyTurn }}>
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => useContext(GameContext);