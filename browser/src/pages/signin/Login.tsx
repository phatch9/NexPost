import React, { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import axios, { AxiosError } from "axios";
import { useNavigate, Link } from "react-router-dom";
import AuthConsumer from "../../components/AuthContext";
import Loader from "../../components/Loader";
import Svg from "../../components/Svg";

// ---- TYPES -------//

interface LoginResponse {
  token: string;
  userId: string;
}

interface LoginErrorResponse {
  message: string;
}

// ---COMPONENT ----- //

export function Login() {
  const [showPass, setShowPass] = useState<boolean>(false);
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");

  const navigate = useNavigate();
  const { isAuthenticated, login } = AuthConsumer();

  const { mutate, status, error, reset } = useMutation<
    LoginResponse,
    AxiosError<LoginErrorResponse>
  >({
    mutationFn: async () => {
      const res = await axios.post<LoginResponse>("/api/auth/login", { email, password });
      return res.data as LoginResponse;
    },
    onSuccess: (data) => {
      login(data);
      navigate("/home");
    },
  });

  useEffect(() => {
    document.title = "Reddot | Login";
    return () => {
      document.title = "Reddot";
    };
  }, []);

  if (isAuthenticated) {
    navigate("/home");
    return null;
  }

  const handleInputChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    setter: React.Dispatch<React.SetStateAction<string>>
  ) => {
    setter(event.target.value);
    reset();
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    mutate();
  };

  return (
    <div className="flex justify-center items-center min-h-screen md:space-x-10 bg-gray-50 font-inter">
      <div className="flex flex-col p-8 py-10 space-y-8 bg-white rounded-xl shadow-2xl w-full max-w-sm">
        <h1
          className={`text-center transition-all duration-300 ${
            status !== "pending" ? "text-2xl" : "text-xl"
          } tracking-wide ${
            error ? "font-extrabold uppercase text-red-600" : "font-semibold text-gray-700"
          }`}
        >
          {error
            ? error.response?.data?.message || "Login failed"
            : status === "pending"
            ? <Loader forPosts={true} />
            : "Welcome Back!"}
        </h1>

        <form className="flex flex-col items-center space-y-6" onSubmit={handleSubmit}>
          <label className="flex flex-col w-full space-y-1">
            <span className="pl-1 text-sm font-medium text-gray-500">Email</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => handleInputChange(e, setEmail)}
              className="w-full px-3 py-2 border-b-2 border-gray-300 focus:border-theme-orange outline-none rounded transition-colors"
            />
          </label>

          <label className="flex flex-col w-full space-y-1">
            <span className="pl-1 text-sm font-medium text-gray-500">Password</span>
            <div className="flex items-center w-full border-b-2 border-gray-300 focus-within:border-theme-orange rounded transition-colors">
              <input
                type={showPass ? "text" : "password"}
                required
                minLength={8}
                value={password}
                onChange={(e) => handleInputChange(e, setPassword)}
                className="flex-grow px-3 py-2 outline-none"
              />

              {showPass ? (
                <Svg
                  type="eye-open"
                  className="w-6 h-6 mr-2 cursor-pointer text-gray-500 hover:text-theme-orange"
                  onClick={() => setShowPass(false)}
                />
              ) : (
                <Svg
                  type="eye-close"
                  className="w-6 h-6 mr-2 cursor-pointer text-gray-500 hover:text-theme-orange"
                  onClick={() => setShowPass(true)}
                />
              )}
            </div>
          </label>

          <button
            type="submit"
            disabled={status === "pending"}
            className="w-full py-2 font-semibold text-white bg-theme-orange hover:bg-orange-700 rounded-lg shadow-md transition-all disabled:opacity-50 active:scale-[0.98]"
          >
            {status === "pending" ? "Logging in..." : "Log in"}
          </button>
        </form>

        <div className="flex justify-between text-sm">
          <Link to="/forgot-password" className="flex items-center font-medium text-gray-600 hover:text-theme-orange group">
            Forgot Password
            <Svg type="arrow-right" className="w-5 h-5 ml-1 transition-transform opacity-0 group-hover:opacity-100 group-hover:translate-x-1 text-theme-orange" />
          </Link>

          <Link to="/signup" className="flex items-center font-medium text-gray-600 hover:text-theme-orange group">
            Signup
            <Svg type="arrow-right" className="w-5 h-5 ml-1 transition-transform opacity-0 group-hover:opacity-100 group-hover:translate-x-1 text-theme-orange" />
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Login;
