import { useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const { login } = useAuth();
  const [form, setForm] = useState({ username: "", password: "" });
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    const endpoint = isRegistering ? "/api/auth/register" : "/api/auth/login";

    try {
      const res = await axios.post(endpoint, form);
      login(res.data.token);
    } catch (err) {
      setError("Auth error");
    }
  };

  return (
    <div className="max-w-sm mx-auto mt-20">
      <form onSubmit={submit} className="flex flex-col gap-4">
        <input
          placeholder="Username"
          value={form.username}
          onChange={(e) => setForm({ ...form, username: e.target.value })}
        />
        <input
          placeholder="Password"
          type="password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />
        <button type="submit">{isRegistering ? "Register" : "Login"}</button>
        <button type="button" onClick={() => setIsRegistering(!isRegistering)}>
          {isRegistering ? "Already have account?" : "Create new account"}
        </button>
        {error && <p className="text-red-500">{error}</p>}
      </form>
    </div>
  );
}