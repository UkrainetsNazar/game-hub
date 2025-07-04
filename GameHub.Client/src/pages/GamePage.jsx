import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { createHubConnection } from "../signalr/gameHub";
import Board from "../components/Board";

const GamePage = () => {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const [game, setGame] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [whoAmI, setWhoAmI] = useState("");
  const [timeoutMessage, setTimeoutMessage] = useState(null);
  const hubRef = useRef(null);

  const isPlayerTurn = () => {
    if (!game || !whoAmI) return false;
    const currentSymbol = game.playerXName === whoAmI ? "X" : "O";
    return game.currentTurn === currentSymbol;
  };

  useEffect(() => {
    const start = async () => {
      try {
        const token = localStorage.getItem("token");
        const hub = createHubConnection(token);
        hubRef.current = hub;

        hub.on("GameUpdated", (updatedGame) => {
          setGame(updatedGame);
        });

        hub.on("GameTimeout", (game) => {
          setTimeoutMessage("Opponent disconnected. Game ended by timeout.");
        });

        await hub.start();
        const username = await hub.invoke("WhoAmI");
        setWhoAmI(username);

        const joined = await hub.invoke("JoinGame", gameId);
        setGame(joined);
        setIsLoading(false);
      } catch (err) {
        console.error("Failed to join game:", err);
        navigate("/");
      }
    };

    start();

    return () => {
      hubRef.current?.stop();
    };
  }, [gameId, navigate]);

  if (isLoading || !game) {
    return <p className="text-center mt-8">Loading game...</p>;
  }

  return (
    <div className="p-4 max-w-md mx-auto text-center">
      <h2 className="text-2xl font-bold mb-2">Game ID: {game.id}</h2>
      <p className="mb-1">Player X: {game.playerXName || "Waiting..."}</p>
      <p className="mb-1">Player O: {game.playerOName || "Waiting..."}</p>
      <p className="mb-2">You are: {whoAmI}</p>

      {game.status === 0 && <p className="text-blue-500">Waiting for opponent...</p>}

      {game.status === 1 && (
        <>
          <p className="mb-2">
            {isPlayerTurn() ? (
              <span className="text-green-600 font-semibold">Your turn!</span>
            ) : (
              <span className="text-gray-600">Opponent's turn...</span>
            )}
          </p>
          <Board game={game} isMyTurn={isPlayerTurn()} hub={hubRef.current} />
        </>
      )}

      {game.status === 2 && (
        <p className="text-green-700 font-semibold">
          Game Over! Winner: {game.winnerSymbol}
        </p>
      )}

      {game.status === 3 && (
        <p className="text-red-600 font-semibold">
          Timeout! Winner: {game.winnerSymbol}
        </p>
      )}

      {timeoutMessage && <p className="text-red-500 mt-2">{timeoutMessage}</p>}

      <p className="mt-4 text-sm text-gray-500">
        Status: {["WaitingForOpponent", "InProgress", "Completed", "Timeout"][game.status]}
      </p>
      <p className="text-sm text-gray-500">Current Turn: {game.currentTurn}</p>
    </div>
  );
};

export default GamePage;
