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
  if (!connection.current) {
    connection.current = createHubConnection(userId);
    connection.current.on("WhoAmI");
  }
  const handleCreateGame = async (e) => {
    e.preventDefault();
    try {
      if (connection.current.state !== "Connected") {
        await connection.current.start();
      }
      await connection.current.invoke("CreateGame");
      const rep = await connection.current.invoke("WhoAmI");
      if (rep !== "") {
        reply.current = rep;
        setReplyArr((arr) => [...arr, rep]);
      }
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
            Create a mega super game, dalbayob!
          </h2>
          <button type="submit" className="bg-red-600 rounded-md ">
            Dalbayob
          </button>
        </form>
      </main>
    </div>
  );
};

export default MainPage;
