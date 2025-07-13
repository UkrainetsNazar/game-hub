import { useNavigate } from "react-router-dom";
import { useState } from "react";
import axiosInstance from "../api/AxiosInstance";

const MainPage = () => {
  const [joinId, setJoinId] = useState("");
  const navigate = useNavigate();

  const handleCreate = () => navigate("/game/temp");
  const handleJoin = () => joinId && navigate(`/game/${joinId.trim()}`);

  const handleLogout = async () => {
    try {
      await axiosInstance.post("/logout");
    } catch (err) {
      console.error("Logout failed:", err);
    } finally {
      localStorage.removeItem("token");
      navigate("/login");
    }
  };

  return (
    <div className="p-4">
      <header className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold">Tic Tac Toe</h1>
        <button
          onClick={handleLogout}
          className="bg-red-500 text-white px-3 py-1 rounded"
        >
          Logout
        </button>
      </header>

      <button
        onClick={handleCreate}
        className="bg-green-500 px-4 py-2 text-white rounded"
      >
        Create Game
      </button>

      <div className="mt-6">
        <input
          value={joinId}
          onChange={(e) => setJoinId(e.target.value)}
          placeholder="Enter Game ID"
          className="border px-2 py-1 mr-2"
        />
        <button
          onClick={handleJoin}
          className="bg-blue-500 text-white px-4 py-1 rounded"
        >
          Join Game
        </button>
      </div>
    </div>
  );
};

export default MainPage;
