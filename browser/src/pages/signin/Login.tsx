import React, { useState, useEffect, useCallback } from 'react';
import { AxiosError } from 'axios';

// MOCK IMPLEMENTATIONS (For single-file environment)
// In a real project, these would be separate imported modules.

// Mock Types for useMutation (The core of the TS conversion)
// Define the expected successful data structure from the API
interface LoginResponseData {
    token: string;
    userId: string;
  // Add any other user properties returned by the API
}

// Define the expected error structure from the API response body
interface ErrorResponseBody {
    message: string;
}

// Mock the useMutation hook
interface MutationResult<TData, TError> {
    mutate: () => void;
    status: 'idle' | 'loading' | 'error' | 'success';
    error: TError | null;
    reset: () => void;
}

// Mock AxiosError specific to our login error structure
type LoginError = AxiosError<ErrorResponseBody>;

function useMutation<TData, TError>(options: {
    mutationFn: () => Promise<TData>;
    onSuccess: (data: TData) => void;
    // We assume the error property on the hook uses the provided TError type
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
            // Simulate API call success/failure logic
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

// Mock AuthContext
interface AuthContextType {
    isAuthenticated: boolean;
    login: (userData: LoginResponseData) => void;
}

const AuthConsumer = (): AuthContextType => ({
    isAuthenticated: false,
    login: (userData: LoginResponseData) => {
        console.log('Mock Login: User authenticated with data:', userData);
        // In a real app, this would update global state
    },
});

// Mock Components
const useNavigate = () => (path: string) => console.log(`Navigating to: ${path}`);
const Link: React.FC<React.PropsWithChildren<{ to: string, className: string }>> = ({ children, to, className }) => (
    <a href={to} className={className} onClick={(e) => { e.preventDefault(); console.log(`Link clicked to: ${to}`); }}>
        {children}
    </a>
);

const Loader: React.FC<{ forPosts: boolean }> = () => <div className="animate-spin text-theme-orange">Loading...</div>;
const AppLogo: React.FC<React.PropsWithChildren<{ forBanner?: boolean }>> = ({ children }) => (
    <div className='flex items-center space-x-2'>
        <span className='text-3xl font-extrabold text-theme-orange'>&#9733;</span>
        {children}
    </div>
);
const Svg: React.FC<{ type: 'eye-open' | 'eye-close' | 'arrow-right', className: string, onClick?: (e: React.MouseEvent<SVGSVGElement>) => void }> = ({ type, className, onClick }) => {
    // Simple mock SVG icon logic
    const icon = type === 'eye-open' ? '👁️' : type === 'eye-close' ? '🔒' : '👉';
    return (
        <svg className={className} onClick={onClick}>
            <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" fontSize="20">{icon}</text>
        </svg>
    );
};
// END MOCK

export function Login() {
    // State Typing: Explicitly defining types for clarity, though inferred here is fine.
    const [showPass, setShowPass] = useState<boolean>(false);
    const [email, setEmail] = useState<string>("");
    const [password, setPassword] = useState<string>("");

    // Hook Usage
    const { isAuthenticated, login } = AuthConsumer();
    const navigate = useNavigate();

    // useMutation Typing: Crucial for type safety, defining success data and error format
    const { mutate, status, error, reset } = useMutation<LoginResponseData, LoginError>({
        // The mutation function must be an async function that returns a Promise<LoginResponseData>
        mutationFn: async () => {
            console.log(`Mock API call: Logging in with ${email} / ${password.length} chars...`);
            // Mocking the axios call and response structure
            if (email === "test@example.com" && password === "passwordxyz") {
                const responseData: LoginResponseData = { token: "auto-jwt", userId: "user-123" };
                return responseData; // Success data
            } else if (email.length > 0 && password.length > 0) {
                // Simulate an API error response for wrong credentials
                throw {
                    response: {
                        data: { message: "Invalid email or password." }
                    }
                } as LoginError;
            }
            // Fallback error if form is empty during a direct mutate call
            throw { response: { data: { message: "Please fill in all fields." } } } as LoginError;
        },
        // onSuccess ensures the data received is of type LoginResponseData
        onSuccess: (data) => navigate("/home"),
    });

    useEffect(() => {
        document.title = "Reddot | Login";
        return () => {
            document.title = "Reddot";
        }
    }, []);

    // Redirect logic
    if (isAuthenticated) {
        navigate("/home");
        return null; // Return null to avoid rendering the form while navigating
    }

    // Event Handler Typing: Explicitly define the event type
    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        mutate();
    };

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>, setter: React.Dispatch<React.SetStateAction<string>>) => {
        setter(event.target.value);
        reset();
    };

    return (
        <div className="flex justify-center items-center min-h-screen md:space-x-10 bg-gray-50 font-inter">
            <AppLogo forBanner={true}>
                <h1 className="hidden font-mono text-4xl font-bold tracking-tight text-gray-800 md:block">Reddot</h1>
            </AppLogo>
            <div className="flex flex-col p-8 py-10 space-y-8 bg-white rounded-xl shadow-2xl w-full max-w-sm">
                <div className="flex justify-center md:hidden">
                    <AppLogo>
                        <h1 className="font-mono text-3xl font-bold tracking-tight text-gray-800">Reddot</h1>
                    </AppLogo>
                </div>
                <h1
                    className={`text-center transition-all duration-300 ${status !== "loading" ? "text-2xl" : "text-xl"} tracking-wide
                        ${error ? "font-extrabold uppercase text-red-600" : "font-semibold text-gray-700"}`}
                >
                    {/* Access error message safely using optional chaining */}
                    {error ? error.response?.data?.message || "An unknown error occurred" : status === "loading" ? <Loader forPosts={true} /> : "Welcome Back!"}
                </h1>
                <form
                    className="flex flex-col items-center space-y-6 bg-white"
                    onSubmit={handleSubmit}>
                    <label htmlFor="email" className="flex flex-col w-full space-y-1">
                        <span className="pl-1 text-sm font-medium text-gray-500">Email</span>
                        <input
                            type="email"
                            name="email"
                            id="email"
                            required
                            value={email}
                            // Typed change handler
                            onChange={(event) => handleInputChange(event, setEmail)}
                            className="w-full px-3 py-2 border-b-2 border-gray-300 focus:border-theme-orange transition-colors duration-200 outline-none rounded"
                        />
                    </label>
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
                                // Typed change handler
                                onChange={(event) => handleInputChange(event, setPassword)}
                            />
                            {/* Typed click handler */}
                            {showPass ? (
                                <Svg type="eye-open" className="w-6 h-6 mr-2 cursor-pointer text-gray-500 hover:text-theme-orange" onClick={() => setShowPass(false)} />
                            ) : (
                                <Svg type="eye-close" className="w-6 h-6 mr-2 cursor-pointer text-gray-500 hover:text-theme-orange" onClick={() => setShowPass(true)} />
                            )}
                        </div>
                    </label>
                    <button
                        type="submit"
                        disabled={status === "loading"}
                        className="w-full py-2 font-semibold text-white transition-all duration-150 rounded-lg shadow-md bg-theme-orange hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]">
                        {status === "loading" ? "Logging in..." : "Log in"}
                    </button>
                </form>
                <div className="flex justify-between text-sm">
                    <Link to="/forgot-password" className="flex items-center font-medium cursor-pointer group text-gray-600 hover:text-theme-orange transition-colors">
                        Forgot Password
                        <Svg
                            type="arrow-right"
                            className="w-5 h-5 ml-1 transition-transform duration-200 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 text-theme-orange"></Svg>
                    </Link>
                    <Link to="/signup" className="flex items-center font-medium cursor-pointer group text-gray-600 hover:text-theme-orange transition-colors">
                        Signup
                        <Svg
                            type="arrow-right"
                            className="w-5 h-5 ml-1 transition-transform duration-200 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 text-theme-orange"></Svg>
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default Login;
