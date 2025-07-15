import axios from "axios";

const axiosInstance = axios.create({
  baseURL: "http://localhost:5216/api/auth",
  withCredentials: true,
});

const bareAxios = axios.create({ withCredentials: true });

const authEndpoints = ["/login", "/register", "/refresh-token"];

axiosInstance.interceptors.request.use(
  async (config) => {
    const isAuthRequest = authEndpoints.some((path) =>
      config.url.includes(path)
    );
    if (isAuthRequest) return config;

    let token = localStorage.getItem("token");
    if (!token) return config;

    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      const now = Math.floor(Date.now() / 1000);
      const exp = payload.exp;

      if (exp < now + 60) {
        const res = await bareAxios.post(
          "http://localhost:5216/api/auth/refresh-token"
        );
        token = res.data.accessToken;
        localStorage.setItem("token", token);
      }

      config.headers["Authorization"] = `Bearer ${token}`;
      return config;
    } catch (e) {
      if (e.response?.status === 401) {
        localStorage.removeItem("token");
        window.location.href = "/login";
      }
      return Promise.reject(e);
    }
  },
  (error) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const isAuthRequest = authEndpoints.some((path) =>
      error.config?.url?.includes(path)
    );

    if (error.response?.status === 401 && !isAuthRequest) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;