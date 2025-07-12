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

  useEffect(() => {
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
        navigate(`/game/${session.id}`, { replace: true });
      } else {
        session = await hub.invoke("JoinGame", gameId);
      }

      setGame(session);
      setLoading(false);
    };

    start();

    return () => {
      hubRef.current?.stop();
    };
  }, [gameId, navigate]);

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