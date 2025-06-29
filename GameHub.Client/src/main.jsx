import { createRoot } from 'react-dom/client'
import { AuthProvider } from "./context/AuthContext";
import { GameProvider } from "./context/GameContext";
import App from './App.jsx'
import './index.css';

createRoot(document.getElementById('root')).render(
  <AuthProvider>
    <GameProvider>
      <App />
    </GameProvider>
  </AuthProvider>
)