import { useEffect } from "react";
import InfinitePosts from "../../components/InfinitePosts";

export default function SavedPosts() {
    useEffect(() => {
        document.title = "NexPost | saved";
        return () => {
            document.title = "NexPost";
        };
    }, []);

    return (
        <div className="flex flex-col items-center p-2 w-full">
            <h2 className="text-3xl font-bold text-gray-800 mb-6 w-full max-w-2xl mx-auto">
                Saved Posts
            </h2>

            <InfinitePosts
                apiQueryKey="saved"
                linkUrl="posts/saved"
                forSaved={true}
            />
        </div>
    );
}
