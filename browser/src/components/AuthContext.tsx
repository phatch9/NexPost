    import { useQuery, useQueryClient } from "@tanstack/react-query";
    import axios from "axios";
    import { createContext, useContext, useEffect, useState, ReactNode } from "react";

    // Interface Definitions

    /** Defines the structure of the user object stored in state and localStorage. */
    interface User {
    id?: string | number;
    username?: string;
    // Add other user properties as needed, e.g., email, roles, etc.
    [key: string]: any; // Allow for flexible properties if the structure is unknown
    }

    /** Defines the shape of the context value exported by the useAuth hook. */
    interface AuthContextValue {
    isAuthenticated: boolean;
    user: User;
    login: (userInfo: User) => void;
    logout: () => void;
    }

    /** Defines the props for the AuthProvider component. */
    interface AuthProviderProps {
    children: ReactNode;
    }

    // Context Initialization

    // Define a default value for the context that matches the AuthContextValue interface
    const defaultAuthContextValue: AuthContextValue = {
    isAuthenticated: false,
    user: {},
    login: () => {},
    logout: () => {},
    };

    const AuthContext = createContext<AuthContextValue>(defaultAuthContextValue);

    // AuthProvider Component

    export function AuthProvider({ children }: AuthProviderProps) {
    const queryClient = useQueryClient();

    // Retrieve user data from localStorage
    const localData = localStorage.getItem("user");
    const initialUser: User = localData ? JSON.parse(localData) : {};

    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!localData);
    const [user, setUser] = useState<User>(initialUser);

    // useQuery to fetch user data and confirm session validity
    const { refetch } = useQuery({
        queryKey: ["user"],
        queryFn: async () => {
        try {
            const res = await axios.get<User>("/api/user");
            const userData = res.data;
            
            localStorage.setItem("user", JSON.stringify(userData));
            setUser(userData);
            setIsAuthenticated(true);
            
            return userData;
        } catch (error) {
            console.error("Authentication check failed:", error);
            setIsAuthenticated(false);
            setUser({});
            localStorage.removeItem("user");
            // Throwing the error prevents react-query from treating it as success
            throw error; 
        }
        },
        // Only attempt to fetch if we *think* we are authenticated based on localStorage
        enabled: isAuthenticated, 
        retry: 1,
    });

    // Effect to refetch on mount (initial check)
    useEffect(() => {
        // Only run refetch if the provider mounts and we have a token/flag indicating a potential session
        if (isAuthenticated) {
            refetch();
        }
    }, [refetch, isAuthenticated]);

    /**
     * Logs the user in by saving user info to localStorage and updating state.
     * @param userInfo The user data received after a successful login API call.
     */
    function login(userInfo: User) {
        localStorage.setItem("user", JSON.stringify(userInfo));
        setUser(userInfo);
        setIsAuthenticated(true);
        // Invalidate queries to fetch user-specific data after login
        queryClient.invalidateQueries();
    }

    /**
     * Logs the user out by clearing local data and redirecting.
     */
    function logout() {
        axios.get("api/user/logout")
        .finally(() => { // Use finally to ensure local state is cleared even if logout API fails
            localStorage.removeItem("user");
            
            // Reset state
            setUser({});
            setIsAuthenticated(false);

            // Invalidate ALL queries to force a complete data refetch for the new (logged out) state
            queryClient.clear();
        });
    }

    // Define the context value object
    const value: AuthContextValue = {
        isAuthenticated,
        login,
        logout,
        user
    };

    return (
        <AuthContext.Provider value={value}>
        {children}
        </AuthContext.Provider>
    );
    }

    // Custom Hook for Context Consumption
    /**
     * Hook to access the authentication context values and functions.
     * @returns {AuthContextValue} The authentication state and methods.
     */
    export default function useAuth(): AuthContextValue {
    return useContext(AuthContext);
    }
