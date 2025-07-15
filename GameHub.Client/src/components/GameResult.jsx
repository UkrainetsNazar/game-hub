import { useNavigate } from "react-router-dom";
import { CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";

const GameResult = ({ game, timeoutMessage, whoAmI }) => {
  const navigate = useNavigate();

  const getOutcome = () => {
    if (game.status === 2) return game.winnerName === whoAmI ? "win" : "lose";
    if (game.status === 3) return "draw";
    if (game.status === 4) {
      if (!game.winnerName) return "draw";
      return game.winnerName === whoAmI ? "win" : "lose";
    }
    return null;
  };

  const outcome = getOutcome();

  const renderMessage = () => {
    switch (outcome) {
      case "win":
        return (
          <div className="flex items-center text-green-600 space-x-2 text-xl">
            <CheckCircle className="w-6 h-6" />
            <span>You won!</span>
          </div>
        );
      case "lose":
        return (
          <div className="flex items-center text-red-600 space-x-2 text-xl">
            <XCircle className="w-6 h-6" />
            <span>You lost.</span>
          </div>
        );
      case "draw":
        return (
          <div className="flex items-center text-yellow-600 space-x-2 text-xl">
            <AlertCircle className="w-6 h-6" />
            <span>It's a draw!</span>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="bg-white rounded-2xl shadow-xl p-6 w-80 text-center"
      >
        {renderMessage()}

        {timeoutMessage && game.status === 4 && (
          <p className="text-sm text-gray-500 italic mt-2">{timeoutMessage}</p>
        )}

        <div className="space-y-2 mt-6">
          <button
            onClick={() => navigate("/game/temp")}
            className="bg-green-500 w-full text-white px-4 py-2 rounded hover:bg-green-600 transition"
          >
            Create New Game
          </button>
          <button
            onClick={() => navigate("/")}
            className="bg-gray-400 w-full text-white px-4 py-2 rounded hover:bg-gray-500 transition"
          >
            To Lobby
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default GameResult;
