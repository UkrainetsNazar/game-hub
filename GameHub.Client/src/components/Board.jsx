export default function Board({ game, isMyTurn, hub }) {
  const handleClick = (i) => {
    if (isMyTurn && game.status === 1 && game.board[i] === "_") {
      hub.invoke("MakeMove", game.id, i);
    }
  };

  return (
    <div className="grid grid-cols-3 gap-2 bg-white rounded-xl p-4 shadow-md">
      {game.board.split("").map((cell, i) => (
        <button
          key={i}
          onClick={() => handleClick(i)}
          className={`w-20 h-20 text-4xl font-bold flex items-center justify-center border rounded-xl 
                      ${cell === "X" ? "text-indigo-700" : cell === "O" ? "text-pink-600" : "text-gray-400"}
                      ${isMyTurn && cell === "_" ? "hover:bg-gray-200" : "cursor-not-allowed"}`}
        >
          {cell !== "_" ? cell : ""}
        </button>
      ))}
    </div>
  );
}
