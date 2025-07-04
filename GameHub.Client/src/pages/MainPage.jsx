import axiosInstance from "../api/AxiosInstance";
import { useNavigate } from "react-router-dom";
import { createHubConnection } from "../signalr/gameHub";
import { useEffect, useRef, useState } from "react";

const MainPage = () => {
  const navigate = useNavigate();
  const userId = localStorage.getItem("token");
  const reply = useRef("");
  const [replyArr, setReplyArr] = useState([]);
  const connection = useRef(null);
  const [gameId, setGameId] = useState(null);
  const [isWaiting, setIsWaiting] = useState(false);
  const [joinId, setJoinId] = useState("");

  const handleJoinGame = () => {
    if (joinId.trim()) {
      navigate(`/game/${joinId.trim()}`);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    const hub = createHubConnection(token);
    connection.current = hub;

    hub.on("GameUpdated", (updatedGame) => {
      if (updatedGame.id === gameId && updatedGame.status === 1) {
        setIsWaiting(false);
        navigate(`/game/${updatedGame.id}`);
      }
    });

    return () => {
      hub.stop();
    };
  }, []);


  const handleCreateGame = async (e) => {
    e.preventDefault();
    try {
      if (connection.current.state !== "Connected") {
        await connection.current.start();
      }

      const game = await connection.current.invoke("CreateGame");
      setGameId(game.id);
      setIsWaiting(true);

    } catch (err) {
      console.log(err);
    }
  };


  const handleLogout = async () => {
    try {
      await axiosInstance.post("/logout");
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      localStorage.removeItem("token");
      navigate("/login");
    }
  };

  useEffect(() => {
    console.log("Result", replyArr);
  }, [replyArr]);
  return (
    <div>
      <header className="flex justify-between items-center p-4 border-b">
        <h1 className="text-xl font-bold">Main Page</h1>
        <button
          onClick={handleLogout}
          className="bg-red-500 hover:bg-red-600 text-white py-1 px-3 rounded"
        >
          Logout
        </button>
      </header>

      <main className="p-4">
        <p>Welcome to the main page!</p>

        <form
          onSubmit={handleCreateGame}
          className="flex flex-col gap-4 p-4 border rounded shadow"
        >
          <h2 className="text-xl font-semibold text-center">
            Create a new game!
          </h2>
          <button type="submit" className="bg-green-400 rounded-md">
            Create
          </button>
          {gameId && (
            <div className="text-center mt-4">
              <p className="text-lg font-medium">Game ID: <code>{gameId}</code></p>
              {isWaiting && <p className="text-blue-500">Waiting for opponent...</p>}
            </div>
          )}
          <div className="mt-6">
            <h2 className="text-lg font-semibold">Join Existing Game</h2>
            <input
              type="text"
              placeholder="Enter game ID"
              value={joinId}
              onChange={(e) => setJoinId(e.target.value)}
              className="border px-2 py-1 rounded mr-2"
            />
            <button
              onClick={handleJoinGame}
              className="bg-blue-500 text-white px-4 py-1 rounded"
            >
              Join Game
            </button>
          </div>
        </form>
      </main>
    </div>
  );
};

export default MainPage;
