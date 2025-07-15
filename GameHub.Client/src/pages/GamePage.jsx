import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { createHubConnection } from "../signalr/gameHub";
import Board from "../components/Board";
import GameResult from "../components/GameResult";
import TurnTimer from "../components/TurnTimer";
import Loader from "../components/Loader";

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
  const [copied, setCopied] = useState(false);

  const copyGameId = () => {
    navigator.clipboard.writeText(game.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  useEffect(() => {
    const initializeConnection = async () => {
      const createdGameId = localStorage.getItem("createdGameId");

      if (connectionInitialized.current && hubRef.current) {
        if (gameId === createdGameId) {
          const game = await hubRef.current.invoke("GetGame", gameId);
          setGame(game);
          setLoading(false);
          return;
        }

        try {
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
          setGame(updatedGame);

          if ([2, 3, 4].includes(updatedGame.status)) {
            localStorage.removeItem("createdGameId");
          }
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
        isCreatingGame.current = true;
        const session = await hubRef.current.invoke("CreateGame");
        localStorage.setItem("createdGameId", session.id);
        setGame(session);
        navigate(`/game/${session.id}`, { replace: true });
        setLoading(false);
        return;
      }

      if (gameId === createdGameId) {
        try {
          const game = await hubRef.current.invoke("GetGame", gameId);
          setGame(game);
        } catch (err) {
          console.error("Failed to get created game:", err);
        }
        setLoading(false);
        return;
      }

      try {
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

  if (loading || !game) {
    return <Loader message="Loading game..." />;
  }

  return (
    <div className="p-4 max-w-md mx-auto bg-white shadow-xl rounded-xl mt-8">
      <h2 className="text-2xl font-bold text-center mb-4 text-gray-800">Tic Tac Toe</h2>

      <div className="mb-3 text-center">
        <span className="font-medium text-black">Game ID:</span>
        <br />
        <button
          onClick={copyGameId}
          className="text-sm text-gray-600 hover:text-black transition-colors duration-150"
          title="Click to copy Game ID"
        >
          <span className="font-mono">{game.id}</span>
          {copied && <span className="ml-2 text-green-600 text-xs">Copied!</span>}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm text-gray-700 mb-4">
        <div className="bg-gray-100 p-2 rounded text-center">
          <p className="text-xs text-gray-500">Player X</p>
          <p className="font-medium text-black">{game.playerXName || "..."}</p>
        </div>
        <div className="bg-gray-100 p-2 rounded text-center">
          <p className="text-xs text-gray-500">Player O</p>
          <p className="font-medium text-black">{game.playerOName || "..."}</p>
        </div>
      </div>

      <p className="text-center text-sm text-gray-700 mb-4">
        <span className="font-medium">You are:</span> {whoAmI}
      </p>

      {game.status === 0 && (
        <p className="text-center text-blue-500 font-semibold">Waiting for opponent...</p>
      )}

      {game.status === 1 && (
        <>
          <p className={`text-center font-semibold mb-2 ${isMyTurn() ? "text-green-600" : "text-gray-500"}`}>
            {isMyTurn() ? "Your turn!" : "Opponent's turn..."}
          </p>

          <div className="flex justify-center mb-4">
            <TurnTimer currentTurn={game.currentTurn} duration={20} />
          </div>

          <Board game={game} hub={hubRef.current} isMyTurn={isMyTurn()} />
        </>
      )}

      {[2, 3, 4].includes(game.status) && (
        <GameResult game={game} timeoutMessage={timeoutMessage} whoAmI={whoAmI} />
      )}
    </div>
  );
};

export default GamePage;