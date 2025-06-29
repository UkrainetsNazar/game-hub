import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import GamePage from "./pages/GamePage";
import { useAuth } from "./context/AuthContext";
import './index.css';

export default function App() {
  const { token } = useAuth();

  return (
    <Router>
      <Routes>
        {!token ? (
          <Route path="*" element={<LoginPage />} />
        ) : (
          <Route path="*" element={<GamePage />} />
        )}
      </Routes>
    </Router>
  );
}
