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
  const [initialized, setInitialized] = useState(false);
  const hubRef = useRef(null);

  useEffect(() => {
    if (initialized) return;

    const start = async () => {
      const token = localStorage.getItem("token");
      const hub = createHubConnection(token);
      hubRef.current = hub;

      hub.on("GameUpdated", setGame);
      hub.on("GameTimeout", () => setTimeoutMessage("Timeout!"));

      await hub.start();
      const user = await hub.invoke("WhoAmI");
      setWhoAmI(user);

      let session;

      if (gameId === "temp") {
        session = await hub.invoke("CreateGame");
        setGame(session);
        setInitialized(true);
        navigate(`/game/${session.id}`, { replace: true });
        setLoading(false);
        return;
      }

      try {
        session = await hub.invoke("JoinGame", gameId);
        setGame(session);
        setInitialized(true);
      } catch (error) {
        console.error("Failed to join game:", error);
        setInitialized(true);
      }

      setLoading(false);
    };

    start();

    return () => {
      hubRef.current?.stop();
    };
  }, [gameId, navigate, initialized]);

  useEffect(() => {
    if (!initialized || gameId === "temp") return;

    const reconnect = async () => {
      if (hubRef.current) {
        try {
          // Перевіряємо, чи вже є гра з таким ID
          const existingGame = await hubRef.current.invoke("GetGame", gameId);
          if (existingGame) {
            setGame(existingGame);
            return;
          }
        } catch (error) {
          console.log("Game not found or error getting game:", error);
        }

        // Тільки якщо гра не знайдена або це новий gameId
        try {
          const session = await hubRef.current.invoke("JoinGame", gameId);
          setGame(session);
        } catch (error) {
          console.error("Failed to join game:", error);
        }
      }
    };

    reconnect();
  }, [gameId, initialized]);

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

      {game.status === 2 && <p className="text-green-600">Game Over. Winner: {game.winnerSymbol}</p>}
      {game.status === 3 && <p className="text-red-500">{timeoutMessage}</p>}
    </div>
  );
};

export default GamePage;