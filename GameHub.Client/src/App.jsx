import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import { useAuth } from "./context/AuthContext";
import './index.css';
import MainPage from "./pages/MainPage";

export default function App() {
  const { token } = useAuth();

  return (
    <Router>
      <Routes>
        {!token ? (
          <Route path="/login" element={<LoginPage />} />
        ) : (
          <Route path="/" element={<MainPage />} />
        )}
      </Routes>
    </Router>
  );
}
