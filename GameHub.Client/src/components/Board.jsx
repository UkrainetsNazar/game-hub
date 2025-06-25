export default function Board({ board, onCellClick }) {
  return (
    <div className="grid grid-cols-3 gap-1 w-48 h-48 text-2xl text-center">
      {board.split("").map((cell, i) => (
        <button
          key={i}
          onClick={() => onCellClick(i)}
          className="border w-16 h-16 flex items-center justify-center"
        >
          {cell !== "_" ? cell : ""}
        </button>
      ))}
    </div>
  );
}