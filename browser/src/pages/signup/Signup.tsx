import React, { useState, useEffect, useCallback } from 'react';
import { AxiosError } from 'axios'; // We assume Axios is installed and its types are available
import Loader from "../../components/Loader";
import { Link, useNavigate } from "react-router-dom";
import useAuth from "../../components/AuthContext";
import { AppLogo } from "../../components/Navbar";
import Svg from "../../components/Svg";

// Mock Types for useMutation
// Define the expected successful data structure from the API (Same as login)
interface AuthResponseData {
    token: string;
    userId: string;
    // Add any other user properties returned by the API
}

// Define the expected error structure for validation errors (specific to Register)
interface ValidationError {
    username?: string[]; // Array of error messages for this field
    email?: string[];
    password?: string[];
}

interface RegisterErrorBody {
    message?: string; // For general errors (like server failure)
    errors: ValidationError; // For validation errors
}

// Mock AxiosError specific to our register error structure
type RegisterError = AxiosError<RegisterErrorBody>;

interface MutationResult<TData, TError> {
    mutate: () => void;
    status: 'idle' | 'loading' | 'error' | 'success';
    error: TError | null;
    reset: () => void;
}

function useMutation<TData, TError>(options: {
    mutationFn: () => Promise<TData>;
    onSuccess: (data: TData) => void;
}): MutationResult<TData, TError> {
    const [status, setStatus] = useState<'idle' | 'loading' | 'error' | 'success'>('idle');
    const [error, setError] = useState<TError | null>(null);

    const reset = useCallback(() => {
        setStatus('idle');
        setError(null);
    }, []);

    const mutate = useCallback(async () => {
        setStatus('loading');
        setError(null);
        try {
            if (options.mutationFn) {
                const result = await options.mutationFn();
                setStatus('success');
                options.onSuccess(result);
            }
        } catch (err) {
            setStatus('error');
            setError(err as TError); // Cast to our expected error type
        }
    }, [options.mutationFn, options.onSuccess]);

    return { mutate, status, error: error as TError | null, reset };
}
// Using real components from the `components` directory (no mocks)

export function Signup() {
    // State Typing
    const [showPass, setShowPass] = useState<boolean>(false);
    const [username, setUsername] = useState<string>("");
    const [email, setEmail] = useState<string>("");
    const [password, setPassword] = useState<string>("");

    // Hook Usage
    const { isAuthenticated, login } = useAuth();
    const navigate = useNavigate();

    // useMutation Typing: Using RegisterError for validation handling
    const { mutate, status, error } = useMutation<AuthResponseData, RegisterError>({
        // The mutation function must be an async function that returns a Promise<AuthResponseData>
        mutationFn: async () => {
            console.log(`Mock API call: Signing up user ${username}...`);

            // Mocking the axios call and error structure for Sign up
            if (username === "fail") {
                 // Simulate validation errors
                 throw {
                    response: {
                        data: {
                            errors: {
                                username: ["Username 'fail' is already taken."],
                                password: ["Password is too common."],
                            }
                        }
                    }
                 } as RegisterError;
            } else if (username && email && password) {
                const responseData: AuthResponseData = { token: "fake-jwt", userId: "user-456" };
                return responseData; // Success data
            }
            // Fallback error
            throw { response: { data: { message: "Internal server error." } } } as RegisterError;
            // End Mock Logic
        },
        onSuccess: () => navigate("/home"),
    });

    useEffect(() => {
        document.title = "Threaddit | Signup";
        return () => {
            document.title = "Threaddit";
        }
    }, []);

    // Redirect logic
    if (isAuthenticated) {
        navigate("/home");
        return null;
    }

    // Typed Event Handler for input changes (simplifies handlers in JSX)
    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>, setter: React.Dispatch<React.SetStateAction<string>>) => {
        setter(event.target.value);
        // Note: Reset logic is omitted here to keep validation errors visible while user types
    };

    // Typed Event Handler for form submission
    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        mutate();
    };

    // Safely destructure validation errors using optional chaining
    const {
        username: usernameError,
        email: emailError,
        password: passwordError,
    } = error?.response?.data?.errors || {};

    return (
        <div className="flex justify-center items-center min-h-screen md:space-x-10 bg-gray-50 font-inter">
            <AppLogo forBanner={true}>
                <h1 className="hidden font-mono text-4xl font-bold tracking-tight text-gray-800 md:block">Threaddit</h1>
            </AppLogo>
            <div className="flex flex-col p-8 py-10 space-y-8 bg-white rounded-xl shadow-2xl w-full max-w-sm">
                <div className="flex justify-center md:hidden">
                    <AppLogo>
                        <h1 className="font-mono text-3xl font-bold tracking-tight text-gray-800">Threaddit</h1>
                    </AppLogo>
                </div>
                <h1
                    className={`text-center transition-all duration-300 ${status !== "loading" ? "text-2xl" : "text-xl"} tracking-wide 
                        ${(error && Object.keys(error.response?.data?.errors || {}).length > 0) ? "font-extrabold uppercase text-red-600" : "font-semibold text-gray-700"}`}
                >
                    {/* Display general error message if no validation errors, otherwise default welcome */}
                    {status === "loading" ? <Loader forPosts={true} /> : "Join Threaddit Today!"}
                </h1>
                <form
                    className="flex flex-col items-center space-y-6 bg-white"
                    onSubmit={handleSubmit}>

                    {/* Username Input */}
                    <label htmlFor="username" className="flex flex-col w-full space-y-1">
                        <span className="pl-1 text-sm font-medium text-gray-500">Username</span>
                        <input
                            type="text"
                            name="username"
                            id="username"
                            required
                            value={username}
                            onChange={(e) => handleInputChange(e, setUsername)}
                            maxLength={15}
                            minLength={4}
                            className="w-full px-3 py-2 border-b-2 border-gray-300 focus:border-theme-orange transition-colors duration-200 outline-none rounded"
                        />
                        {/* Display Username Errors */}
                        {usernameError?.map((e, index) => (
                            <p className="w-full text-xs font-semibold text-red-600 truncate pt-1" key={index} title={e}>
                                {e}
                            </p>
                        ))}
                    </label>

                    {/* Email Input */}
                    <label htmlFor="email" className="flex flex-col w-full space-y-1">
                        <span className="pl-1 text-sm font-medium text-gray-500">Email</span>
                        <input
                            type="email"
                            name="email"
                            id="email"
                            required
                            value={email}
                            onChange={(e) => handleInputChange(e, setEmail)}
                            className="w-full px-3 py-2 border-b-2 border-gray-300 focus:border-theme-orange transition-colors duration-200 outline-none rounded"
                        />
                        {/* Display Email Errors */}
                        {emailError?.map((e, index) => (
                            <p className="w-full text-xs font-semibold text-red-600 truncate pt-1" key={index} title={e}>
                                {e}
                            </p>
                        ))}
                    </label>

                    {/* Password Input */}
                    <label htmlFor="password" className="flex flex-col w-full space-y-1">
                        <span className="pl-1 text-sm font-medium text-gray-500">Password</span>
                        <div className="flex items-center w-full border-b-2 border-gray-300 focus-within:border-theme-orange transition-colors duration-200 rounded">
                            <input
                                type={`${showPass ? "text" : "password"}`}
                                name="password"
                                id="password"
                                className="flex-grow px-3 py-2 outline-none"
                                required
                                minLength={8}
                                value={password}
                                onChange={(e) => handleInputChange(e, setPassword)}
                            />
                            {/* Display Password Errors (below the input field, not next to the show/hide icon) */}
                            {showPass ? (
                                <Svg type="eye-open" className="w-6 h-6 mr-2 cursor-pointer text-gray-500 hover:text-theme-orange" onClick={() => setShowPass(false)} />
                            ) : (
                                <Svg type="eye-close" className="w-6 h-6 mr-2 cursor-pointer text-gray-500 hover:text-theme-orange" onClick={() => setShowPass(true)} />
                            )}
                        </div>
                        {passwordError?.map((e, index) => (
                            <p className="w-full text-xs font-semibold text-red-600 truncate pt-1" key={index} title={e}>
                                {e}
                            </p>
                        ))}
                    </label>

                    <button
                        type="submit"
                        disabled={status === "loading"}
                        className="w-full py-2 font-semibold text-white transition-all duration-150 rounded-lg shadow-md bg-theme-orange hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]">
                        {status === "loading" ? "Signing Up..." : "Sign Up"}
                    </button>
                </form>
                <div className="flex justify-between text-sm">
                    {/* The original link text was 'Forgot Password', ensuring the path is correct */}
                    <Link to="/forgot-password" className="flex items-center font-medium cursor-pointer group text-gray-600 hover:text-theme-orange transition-colors">
                        Forgot Password
                        <Svg
                            type="arrow-right"
                            className="w-5 h-5 ml-1 transition-transform duration-200 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 text-theme-orange"></Svg>
                    </Link>
                    {/* Link to Login */}
                    <Link to="/login" className="flex items-center font-medium cursor-pointer group text-gray-600 hover:text-theme-orange transition-colors">
                        Login
                        <Svg
                            type="arrow-right"
                            className="w-5 h-5 ml-1 transition-transform duration-200 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 text-theme-orange"></Svg>
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default Signup;
