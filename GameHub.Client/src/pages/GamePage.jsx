import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { createHubConnection } from "../signalr/gameHub";
import Board from "../components/Board";

const GamePage = () => {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const [game, setGame] = useState(null);
  const [whoAmI, setWhoAmI] = useState("");
  const [loading, setLoading] = useState(true);
  const [timeoutMessage, setTimeoutMessage] = useState("");
  const hubRef = useRef(null);
  const connectionInitialized = useRef(false);
  const isCreatingGame = useRef(false);

  useEffect(() => {
    const initializeConnection = async () => {
      if (connectionInitialized.current && hubRef.current) {
        if (gameId === "temp") return;
        
        if (isCreatingGame.current) {
          isCreatingGame.current = false;
          return;
        }

        try {
          console.log("Attempting to join existing game:", gameId);
          const session = await hubRef.current.invoke("JoinGame", gameId);
          setGame(session);
        } catch (error) {
          console.error("Failed to join game:", error);
        }
        setLoading(false);
        return;
      }

      if (!hubRef.current) {
        const token = localStorage.getItem("token");
        const hub = createHubConnection(token);
        hubRef.current = hub;

        hub.on("GameUpdated", (updatedGame) => {
          console.log("Game updated:", updatedGame);
          setGame(updatedGame);
        });
        
        hub.on("GameTimeout", () => setTimeoutMessage("Timeout!"));

        try {
          await hub.start();
          connectionInitialized.current = true;
        } catch (error) {
          console.error("Failed to start connection:", error);
          setLoading(false);
          return;
        }
      }

      const user = await hubRef.current.invoke("WhoAmI");
      setWhoAmI(user);

      if (gameId === "temp") {
        console.log("Creating new game");
        isCreatingGame.current = true;
        const session = await hubRef.current.invoke("CreateGame");
        setGame(session);
        navigate(`/game/${session.id}`, { replace: true });
        setLoading(false);
        return;
      }

      try {
        console.log("Joining existing game:", gameId);
        const session = await hubRef.current.invoke("JoinGame", gameId);
        setGame(session);
      } catch (error) {
        console.error("Failed to join game:", error);
      }

      setLoading(false);
    };

    initializeConnection();

    return () => {
      if (gameId === undefined) {
        hubRef.current?.stop();
        hubRef.current = null;
        connectionInitialized.current = false;
      }
    };
  }, [gameId, navigate]);

  useEffect(() => {
    return () => {
      if (hubRef.current) {
        hubRef.current.stop();
        hubRef.current = null;
        connectionInitialized.current = false;
      }
    };
  }, []);

  const isMyTurn = () => {
    if (!game || !whoAmI) return false;
    const mySymbol = game.playerXName === whoAmI ? "X" : "O";
    return game.currentTurn === mySymbol;
  };

  if (loading || !game) return <p>Loading...</p>;

  return (
    <div className="p-4 max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-2">Game ID: {game.id}</h2>
      <p>Player X: {game.playerXName || "..."}</p>
      <p>Player O: {game.playerOName || "..."}</p>
      <p>You are: {whoAmI}</p>

      {game.status === 0 && <p className="text-blue-500">Waiting for opponent...</p>}

      {game.status === 1 && (
        <>
          <p>{isMyTurn() ? "Your turn" : "Opponent's turn"}</p>
          <Board game={game} hub={hubRef.current} isMyTurn={isMyTurn()} />
        </>
      )}

      {game.status === 2 && <p className="text-green-600">Game Over. Winner: {game.winnerName}</p>}
      {game.status === 3 && <p className="text-red-500">{timeoutMessage}</p>}
    </div>
  );
};

export default GamePage;