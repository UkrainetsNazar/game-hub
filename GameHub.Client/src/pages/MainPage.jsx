import { useNavigate } from "react-router-dom";
import { useState } from "react";
import axiosInstance from "../api/AxiosInstance";
import { User, LogOut } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const MainPage = () => {
  const [joinId, setJoinId] = useState("");
  const [profile, setProfile] = useState(null);
  const [showProfile, setShowProfile] = useState(false);
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

  const handleProfileClick = async () => {
    try {
      const res = await axiosInstance.get("/profile");
      setProfile(res.data);
      setShowProfile(true);
    } catch (err) {
      console.error("Failed to fetch profile:", err);
    }
  };

  const closeProfile = () => setShowProfile(false);

  return (
    <div className="p-4 max-w-md mx-auto">
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Tic Tac Toe</h1>
        <div className="flex items-center space-x-4">
          <button onClick={handleProfileClick} title="Profile">
            <User className="w-6 h-6 text-gray-700 hover:text-blue-600" />
          </button>
          <button
            onClick={handleLogout}
            title="Logout"
            className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      <div className="space-y-4">
        <button
          onClick={handleCreate}
          className="bg-green-500 w-full py-2 text-white rounded hover:bg-green-600 transition"
        >
          Create Game
        </button>

        <div className="flex items-center space-x-2">
          <input
            value={joinId}
            onChange={(e) => setJoinId(e.target.value)}
            placeholder="Enter Game ID"
            className="border px-3 py-2 rounded w-full"
          />
          <button
            onClick={handleJoin}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
          >
            Join
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showProfile && profile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-xl shadow-lg p-6 w-80 relative"
            >
              <h2 className="text-xl font-semibold mb-4 text-center">Profile</h2>
              <p><strong>Username:</strong> {profile.userName}</p>
              <p><strong>Your stats:</strong></p>
              <p><strong>Wins - </strong> {profile.win}</p>
              <p><strong>Losses - </strong> {profile.lose}</p>
              <p><strong>Draws - </strong> {profile.draw}</p>

              <button
                onClick={closeProfile}
                className="absolute top-2 right-2 text-gray-500 hover:text-gray-800"
              >
                ✖
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default MainPage;