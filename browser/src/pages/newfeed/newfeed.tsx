import { useEffect, FC } from "react";
import { useNavigate, useParams } from "react-router-dom";
// Note: Assuming useAuth is a custom hook/consumer function that returns the auth context.
import useAuth from "../../components/AuthContext";
import InfinitePostsLayout from "../../components/InfinitePosts";

/**
 * Defines the structure of the route parameters expected by this component.
 * feedName is optional and will be 'all' for the default feed path.
 */
interface FeedParams {
    feedName?: string;
}

/**
 * The Feed component displays a list of posts based on the feedName parameter (e.g., 'popular', 'all', or 'home').
 * It handles redirection if an unauthenticated user attempts to access the 'home' feed.
 */
export const Feed: FC = () => {
  // Type the consumed context values. We explicitly state that isAuthenticated is a boolean.
    const { isAuthenticated }: { isAuthenticated: boolean } = useAuth();
    const navigate = useNavigate();

  // Use a type assertion to correctly type the parameters retrieved from the URL.
    const { feedName } = useParams<keyof FeedParams>() as FeedParams;

  // Immediate redirection check. If unauthenticated, they can't see the 'home' feed.
    if (feedName === "home" && !isAuthenticated) {
        navigate("/login");
        // Return null to prevent rendering the main content while the navigation is being processed.
        return null;
    }

  // Set the document title dynamically whenever the feed name changes.
    useEffect(() => {
    // Capitalize the first letter for display in the browser tab title, or default to 'All'
    const titleSegment = feedName
        ? feedName.charAt(0).toUpperCase() + feedName.slice(1)
        : 'All';

    document.title = `NexPost | ${titleSegment}`;
    }, [feedName]);

    // Determine the current feed name for the API calls, defaulting to 'all'.
    const currentFeed = feedName || "all";

    return (
    <InfinitePostsLayout
      linkUrl={`posts/${currentFeed}`} // API endpoint URL
      apiQueryKey={currentFeed} // Key for caching with React Query
    />
    );
};

export default Feed;
