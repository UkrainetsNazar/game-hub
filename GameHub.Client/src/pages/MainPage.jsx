import axiosInstance from "../api/AxiosInstance";
import { useNavigate } from "react-router-dom";

const MainPage = () => {
  const navigate = useNavigate();

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
      </main>
    </div>
  );
};

export default MainPage;
