import { useEffect, useState } from "react";
import { createHubConnection } from "../signalr/gameHub";
import { useAuth } from "../context/AuthContext";
import Board from "../components/Board";

export default function GamePage() {
    const { token, user } = useAuth();
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
    }, [token]);

    const makeMove = (i) => {
        if (hub && game?.status === 1) {
            hub.invoke("MakeMove", game.id, i);
        }
    };

    function getMySymbol(game) {
        if (!game || !user) return null;

        if (game.playerXId === user.id) return "X";
        if (game.playerOId === user.id) return "O";
        return null;
    }

    function getGameResult(game) {
        const mySymbol = getMySymbol(game);
        if (!game || !mySymbol) return null;

        switch (game.status) {
            case 2: // Won
                return game.winnerSymbol === mySymbol
                    ? "🎉 You won!"
                    : "😞 You lost.";
            case 3: // Draw
                return "🤝 Draw.";
            case 4: // Timeout
                return game.winnerSymbol === mySymbol
                    ? "🎉 Opponent timed out — you win!"
                    : "⏰ You ran out of time — you lose.";
            default:
                return null;
        }
    }

    if (!game) return <div>Loading game...</div>;

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col items-center p-4">
            <h1 className="text-3xl font-bold mb-4 text-indigo-700">Tic Tac Toe</h1>

            {game ? (
                <>
                    <Board game={game} isMyTurn={isMyTurn} hub={hub} />

                    <div className="mt-4 text-center">
                        <p className="text-lg">
                            <span className="font-semibold">Current Turn:</span>{" "}
                            <span className={isMyTurn ? "text-green-600" : "text-gray-600"}>
                                {game.currentTurn} {isMyTurn && "(Your move)"}
                            </span>
                        </p>
                        <p className="text-sm text-gray-500">Status: {GameStatusText(game.status)}</p>
                    </div>

                    {game.status >= 2 && (
                        <div className="mt-6 p-4 bg-white rounded-xl shadow text-xl font-bold text-center text-indigo-600">
                            {getGameResult(game)}
                        </div>
                    )}
                </>
            ) : (
                <p className="text-gray-600 text-xl">Loading game...</p>
            )}

            <div className="mt-10 w-full max-w-xs">
                <input
                    type="text"
                    placeholder="Enter Game ID to join"
                    value={joinGameId}
                    onChange={(e) => setJoinGameId(e.target.value)}
                    className="w-full border px-3 py-2 rounded shadow-sm"
                />
                <button
                    onClick={joinGame}
                    className="w-full mt-2 bg-blue-500 text-white py-2 rounded hover:bg-blue-600 transition"
                >
                    Join Game
                </button>
                {joinError && <p className="text-red-500 mt-2">{joinError}</p>}
            </div>
        </div>
    );
}

function GameStatusText(status) {
    return ["Waiting", "In Progress", "Won", "Draw", "Timeout"][status];
}