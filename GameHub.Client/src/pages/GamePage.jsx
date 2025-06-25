import { useEffect, useState } from "react";
import { createHubConnection } from "../signalr/gameHub";
import { useAuth } from "../context/AuthContext";
import Board from "../components/Board";

export default function GamePage() {
    const { token } = useAuth();
    const [hub, setHub] = useState(null);
    const [game, setGame] = useState(null);
    const [joinGameId, setJoinGameId] = useState("");
    const [joinError, setJoinError] = useState("");

    useEffect(() => {
        const connection = createHubConnection(token);
        setHub(connection);

        connection.start().then(() => {
            connection.invoke("CreateGame").then(setGame);
        });

        connection.on("GameUpdated", (updatedGame) => {
            setGame(updatedGame);
        });

        connection.on("GameTimeout", (timeoutGame) => {
            alert("Game timeout");
            setGame(timeoutGame);
        });

        return () => {
            connection.stop();
        };
    }, []);

    const makeMove = (i) => {
        if (hub && game?.status === 1) {
            hub.invoke("MakeMove", game.id, i);
        }
    };

    function getMySymbol(game) {
        if (!game || !game.playerOId) return null;

        return game.playerXId === game.playerOId ? "O" : "X";
    }

    function getGameResult(game) {
        const mySymbol = getMySymbol(game);
        if (!game || !mySymbol) return null;

        switch (game.status) {
            case 2:
                return game.winnerSymbol === mySymbol
                    ? "🎉 You won!"
                    : "😞 You lost.";
            case 3:
                return "🤝 Draw.";
            case 4:
                return game.winnerSymbol === mySymbol
                    ? "🎉 Opponent timed out — you win!"
                    : "⏰ You ran out of time — you lose.";
            default:
                return null;
        }
    }

    if (!game) return <div>Loading game...</div>;

    return (
        <div className="flex flex-col items-center mt-6">
            <input
                type="text"
                placeholder="Enter Game ID"
                value={joinGameId}
                onChange={(e) => setJoinGameId(e.target.value)}
                className="border px-2 py-1"
            />
            <button
                className="mt-2 bg-blue-500 text-white px-4 py-2 rounded"
                onClick={async () => {
                    try {
                        const joinedGame = await hub.invoke("JoinGame", joinGameId);
                        setGame(joinedGame);
                        setJoinError("");
                    } catch (err) {
                        console.error(err);
                        setJoinError("Can’t join to this game.");
                    }
                }}
            >
                Join Game
            </button>
            {joinError && <p className="text-red-500 mt-2">{joinError}</p>}

            <Board board={game.board} onCellClick={makeMove} />

            <p className="mt-4 text-lg">Turn: {game.currentTurn}</p>
            <p className="text-gray-600">Status: {GameStatusText(game.status)}</p>

            {game.status >= 2 && (
                <div className="mt-4 text-xl font-bold text-center text-indigo-600">
                    {getGameResult(game)}
                </div>
            )}
        </div>
    );
}

function GameStatusText(status) {
    return ["Waiting", "In Progress", "Won", "Draw", "Timeout"][status];
}