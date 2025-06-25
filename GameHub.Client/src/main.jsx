import { createRoot } from 'react-dom/client'
import { AuthProvider } from "./context/AuthContext";
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <AuthProvider>
    <App />
  </AuthProvider>
)
