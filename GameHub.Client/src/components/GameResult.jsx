import { useNavigate } from "react-router-dom";
import { CheckCircle, XCircle, AlertCircle } from "lucide-react";

const GameResult = ({ game, timeoutMessage, whoAmI }) => {
  const navigate = useNavigate();

  const getOutcome = () => {
    if (game.status === 2) {
      return game.winnerName === whoAmI ? "win" : "lose";
    }
    if (game.status === 3) {
      return "draw";
    }
    if (game.status === 4) {
      if (!game.winnerName) return "draw";
      return game.winnerName === whoAmI ? "win" : "lose";
    }
    return null;
  };

  const renderMessage = () => {
    const outcome = getOutcome();

    switch (outcome) {
      case "win":
        return (
          <div className="flex items-center text-green-600 space-x-2">
            <CheckCircle className="w-5 h-5" />
            <span>You won!</span>
          </div>
        );
      case "lose":
        return (
          <div className="flex items-center text-red-600 space-x-2">
            <XCircle className="w-5 h-5" />
            <span>You lost.</span>
          </div>
        );
      case "draw":
        return (
          <div className="flex items-center text-yellow-600 space-x-2">
            <AlertCircle className="w-5 h-5" />
            <span>It's a draw!</span>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="mt-4 space-y-4">
      {renderMessage()}
      {timeoutMessage && game.status === 4 && (
        <p className="text-sm text-gray-500 italic">{timeoutMessage}</p>
      )}
      <div className="space-x-4 mt-2">
        <button
          onClick={() => navigate("/game/temp")}
          className="bg-green-500 text-white px-4 py-2 rounded"
        >
          Create New Game
        </button>
        <button
          onClick={() => navigate("/")}
          className="bg-gray-400 text-white px-4 py-2 rounded"
        >
          To Lobby
        </button>
      </div>
    </div>
  );
};

export default GameResult;