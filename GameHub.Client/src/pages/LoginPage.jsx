import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Endpoints from "../api/Endpoints";
import axiosInstance from "../api/AxiosInstance";

const LoginPage = () => {
  const [form, setForm] = useState({
    username: "",
    password: "",
    confirmPassword: "",
  });
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isRegistering && form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    const endpoint = isRegistering
      ? Endpoints.AUTH.REGISTER
      : Endpoints.AUTH.LOGIN;

    try {
      const res = await axiosInstance.post(endpoint, {
        username: form.username,
        password: form.password,
      });

      if (res.data.accessToken) {
        const token = res.data.accessToken;
        localStorage.setItem("token", token);
        setError("");
      } else {
        setError("Error while setting token");
      }

      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Auth error");
    }
  };

  return (
    <div className="max-w-sm mx-auto mt-20">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 p-4 border rounded shadow"
      >
        <h2 className="text-xl font-semibold text-center">
          {isRegistering ? "Register" : "Login"}
        </h2>

        <input
          placeholder="Username"
          value={form.username}
          onChange={(e) => setForm({ ...form, username: e.target.value })}
          className="border px-3 py-2 rounded"
        />

        <input
          placeholder="Password"
          type="password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          className="border px-3 py-2 rounded"
        />

        {isRegistering && (
          <input
            placeholder="Repeat Password"
            type="password"
            value={form.confirmPassword}
            onChange={(e) =>
              setForm({ ...form, confirmPassword: e.target.value })
            }
            className="border px-3 py-2 rounded"
          />
        )}

        <button
          type="submit"
          className="bg-blue-500 hover:bg-blue-600 text-white py-2 rounded"
        >
          {isRegistering ? "Register" : "Login"}
        </button>

        <button
          type="button"
          onClick={() => {
            setIsRegistering(!isRegistering);
            setForm({ username: "", password: "", confirmPassword: "" });
            setError("");
          }}
          className="text-blue-600 underline text-sm"
        >
          {isRegistering ? "Already have an account?" : "Create new account"}
        </button>

        {error && <p className="text-red-500 text-sm text-center">{error}</p>}
      </form>
    </div>
  );
};

export default LoginPage;
