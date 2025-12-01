import React, { useState, useEffect, Suspense, createContext, useContext } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Navigate, RouterProvider, createBrowserRouter, Outlet, useLocation } from "react-router-dom";

// TYPE DEFINITIONS - Pulled from app.types.ts Canvas
/** Defines the structure for an authenticated user object. */
export interface User {
    username: string;
    id: string;
}

/** Defines the structure and methods provided by the AuthContext. */
export interface AuthContextType {
    isAuthenticated: boolean;
    user: User | null;
    login: () => void;
    logout: () => void;
}

/** Props for a generic page component (MOCK: SimplePage). */
export interface SimplePageProps {
    title: string;
    route: string;
}

/** Props for wrapper components that accept children (MOCK: RequireAuth, AuthProvider). */
export interface WrapperProps {
    children: React.ReactNode;
}


// Mocked Components and Contexts for demonstration purposes
/** MOCK: Loader */
const Loader: React.FC = () => (
    <div className="flex justify-center items-center h-screen bg-gray-100">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500"></div>
        <p className="ml-4 text-lg text-gray-600">Loading...</p>
    </div>
);

/** MOCK: Error Page */
const Error: React.FC = () => {
    const error: { statusText: string, message: string } = { 
        statusText: "Not Found", 
        message: "The page you requested does not exist." 
    };
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-red-50 p-4">
            <h1 className="text-4xl font-bold text-red-700 mb-4">Oops!</h1>
            <p className="text-xl text-red-600 mb-2">Error: {error.statusText || 'Unknown Error'}</p>
            <p className="text-md text-red-500">{error.message}</p>
            <a href="/" className="mt-6 text-blue-500 hover:underline">Go Home</a>
        </div>
    );
};

/** MOCK: AuthContext and AuthProvider */
const initialAuthContext: AuthContextType = {
    isAuthenticated: false,
    user: null,
    login: () => console.log('Login mock called'),
    logout: () => console.log('Logout mock called'),
};
const AuthContext = createContext<AuthContextType>(initialAuthContext);

export const AuthProvider: React.FC<WrapperProps> = ({ children }) => {
    // Mock authentication state (Assume authenticated for routing tests)
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);
    const [user, setUser] = useState<User | null>({ username: 'mockuser', id: '123' });

    const login = () => {
        setIsAuthenticated(true);
        setUser({ username: 'testuser', id: '456' });
    };
    const logout = () => {
        setIsAuthenticated(false);
        setUser(null);
    };

    const value: AuthContextType = {
        isAuthenticated,
        user,
        login,
        logout,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/** MOCK: RequireAuth (PrivateRoute) */
const RequireAuth: React.FC<WrapperProps> = ({ children }) => {
    const auth = useContext(AuthContext);
    
    if (!auth.isAuthenticated) {
        return (
            <div className="p-8 bg-yellow-100 border border-yellow-300 rounded-lg text-center">
                Please <a href="/login" className="text-blue-600 font-medium hover:underline">log in</a> to view this page.
            </div>
        );
    }
    return <>{children}</>;
};

/* AppLayout (Main structure that wraps the primary routes) */
const AppLayout: React.FC = () => {
    const { isAuthenticated, user } = useContext(AuthContext);
    const location = useLocation();

    // Determine current path for simple navigation display
    const path = location.pathname.split('/')[1] || 'Home (All)';
    
    return (
        <div className="min-h-screen bg-gray-100 flex flex-col">
            <header className="bg-white shadow p-4 flex justify-between items-center sticky top-0 z-10">
                <h1 className="text-2xl font-bold text-blue-600">Threaddit <span className="text-sm text-gray-500">({path.toUpperCase()})</span></h1>
                <nav className="space-x-4 text-sm font-medium">
                    <a href="/all" className="text-gray-600 hover:text-blue-500">Home</a>
                    {isAuthenticated && user ? (
                        <>
                            <a href="/saved" className="text-gray-600 hover:text-blue-500">Saved</a>
                            <a href={`/u/${user.username}`} className="text-gray-600 hover:text-blue-500">Profile</a>
                            <a href="/inbox" className="text-gray-600 hover:text-blue-500">Inbox</a>
                        </>
                    ) : (
                        <a href="/login" className="text-blue-600 border border-blue-600 px-3 py-1 rounded hover:bg-blue-50">Login</a>
                    )}
                </nav>
            </header>
            <main className="flex-grow p-4">
                <Outlet /> {/* Renders the current child route */}
            </main>
        </div>
    );
};

/** MOCK: FeedLayout (Layout for the main feed) */
const FeedLayout: React.FC = () => (
    <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-white rounded-xl shadow p-4 min-h-[50vh]">
            <h2 className="text-xl font-semibold mb-4 border-b pb-2">Feed Content Area</h2>
            <Outlet />
        </div>
        <aside className="md:col-span-1 bg-white rounded-xl shadow p-4">
            <h3 className="font-semibold text-lg mb-3 text-gray-700">Sidebar (MOCK)</h3>
            <p className="text-sm text-gray-500">This area is for widgets and navigation.</p>
        </aside>
    </div>
);

// PAGE MOCKS
const SimplePage: React.FC<SimplePageProps> = ({ title, route }) => (
    <div className="p-6 bg-white rounded-lg shadow-md border border-l-4 border-blue-500">
        <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
        <p className="mt-2 text-gray-600">This is the mock component for the <code className="bg-gray-200 p-1 rounded text-sm">{route}</code> route.</p>
    </div>
);

// Defined all the lazy components as simple functional components
const Feed: React.FC = () => <SimplePage title="Main Feed" route="/:feedName" />;
const Profile: React.FC = () => <SimplePage title="User Profile" route="/u/:username" />;
const FullPost: React.FC = () => <SimplePage title="Full Post View" route="/post/:postId" />;
const Inbox: React.FC = () => <SimplePage title="User Inbox" route="/inbox" />;
const SavedPosts: React.FC = () => <SimplePage title="Saved Posts" route="/saved" />;
const SubThread: React.FC = () => <SimplePage title="Sub-Thread Page" route="/t/:threadName" />;
const Login: React.FC = () => <SimplePage title="Login Page" route="/login" />;
const Register: React.FC = () => <SimplePage title="Register Page" route="/register" />;


