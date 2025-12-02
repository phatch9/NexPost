import React, { useRef, useState, useEffect } from 'react';
const Link = ({ to, children, className, onClick }: any) => <a href={to} className={className} onClick={onClick}>{children}</a>;
const ReactPlayer = ({ url }: any) => <div className="bg-black text-white p-4 text-center">Video: {url}</div>;
const Markdown = ({ children, className }: any) => <div className={className}>{children}</div>;
const Svg = ({ type, className, onClick }: any) => <span className={`inline-block ${className} text-gray-500`} onClick={onClick}>[{type}]</span>;
// small Vote stub
const Vote = ({ initialCount, type }: any) => (
    <div className={`flex items-center ${type === 'compact' ? 'space-x-1' : 'flex-col'}`}>
        <Svg type="upvote" className="w-5 h-5 text-gray-400" onClick={() => {}} />
        <span className="text-sm font-bold">{initialCount || 0}</span>
        <Svg type="downvote" className="w-5 h-5 text-gray-400" onClick={() => {}} />
    </div>
);

// Simple PostMoreOptions component that uses queryClient if available
const PostOptions = ({ creatorInfo, PostInfo, currentUser, postInfo, setShowModal, setModalData, handleShare }: any) => {
    // In this lightweight stub we don't use a query client; the real app provides caching via QueryClientProvider.
    const queryClient: any = null;

    const { isAuthenticated, user } = { isAuthenticated: true, user: { username: 'mockuser', roles: ['user'], mod_in: [] as any } };
    const [expand, setExpand] = useState(false);
    const isCreator = creatorInfo?.user_name === user.username;
    const shouldBeAbleToDelete = isCreator || (user.roles.includes("mod") && user.mod_in.includes(threadInfo?.thread_id as any));

    const handleSaved = () => {
        if (!isAuthenticated) { return setShowModal(true); }
        setExpand(false);
        if (queryClient) queryClient.invalidateQueries({ queryKey: ["savedPosts"] });
    };

    const confirmDelete = () => {
        setExpand(false);
        setShowModal(true);
        setModalData(<div className="p-4">Confirm Delete (auth required)</div>);
    };

    return (
        <div className="relative flex items-center p-1 cursor-pointer select-none">
            <Svg className="w-6 h-6 text-gray-500" type="more" onClick={() => setExpand(prev => !prev)} />
            {expand && (
                <ul className="absolute top-full right-0 z-20 p-2 mt-2 space-y-1 w-36 list-none bg-white rounded-lg shadow-xl border border-gray-200">
                    <li className="p-1 text-sm text-gray-700 hover:bg-gray-100" onClick={handleSaved}>{postInfo?.currentUser?.saved ? "Unsave" : "Save"}</li>
                    <li className="p-1 text-sm text-gray-700 hover:bg-gray-100" onClick={() => { handleShare(); setExpand(false); }}>Share</li>
                    {isCreator && <li className="p-1 text-sm text-gray-700 hover:bg-gray-100" onClick={() => setExpand(false)}>Edit</li>}
                    {shouldBeAbleToDelete && <li className="p-1 text-sm text-red-600 hover:bg-red-50" onClick={confirmDelete}>Delete</li>}
                </ul>
            )}
        </div>
    );
};

// Utility copy (fallback)
const copyToClipboard = (text: any) => {
    try {
        if (navigator && navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text);
            return true;
        }
    } catch (e) {
        // fallback
    }
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    try {
        document.execCommand('copy');
        document.body.removeChild(textarea);
        return true;
    } catch (err) {
        document.body.removeChild(textarea);
        return false;
    }
};

export function PostCurrent({ post = {} as any, isExpanded = false, postIndex = 0, setCommentMode = (prev: any) => {} }) {
    const { isAuthenticated } = { isAuthenticated: true };
    const vidRef = useRef(null);
    const [modalShow, setShowModal] = useState(false);
    const [modalData, setModalData] = useState<any>(null);
    
    const postTitle = (post as any)?.post_info?.title;

    useEffect(() => {
        if (isExpanded) {
            document.title = postTitle || "Reddot Post";
        }
        return () => {
            if (isExpanded) document.title = "Reddot";
        };
    }, [isExpanded, postTitle]);

    function onMediaClick(mediaType: any) {
        if (!(post as any)?.post_info?.media) return;
        setShowModal(true);
        if (mediaType === 'video') {
            setModalData(<ReactPlayer url={(post as any).post_info.media} />);
        } else {
            setModalData(<img src={(post as any).post_info.media} alt="post media" className="rounded" />);
        }
    }

    function onReplyClick() {
        if (isAuthenticated) {
            setCommentMode((prev: any) => !prev);
        } else {
            setShowModal(true);
            setModalData(<div className="p-6">Please log in to reply.</div>);
        }
    }

    async function handleShare() {
        const link = `${window.location.origin}/post/${(post as any)?.post_info?.id}`;
        const ok = copyToClipboard(link);
        setShowModal(true);
        setModalData(<div className={`p-4 rounded ${ok ? 'bg-green-100' : 'bg-red-100'}`}>{ok ? 'Copied link' : 'Could not copy link'}</div>);
        setTimeout(() => setShowModal(false), 2000);
    }

    const createdAt = new Date((post as any)?.post_info?.created_at || Date.now());

    return (
        <article className="p-4 mb-4 bg-white rounded shadow">
            <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                    <Vote initialCount={(post as any)?.post_info?.votes} type="compact" />
                </div>
                <div className="w-full">
                    <div className="flex justify-between items-center">
                        <h2 className="text-lg font-semibold">
                            <Link to={`/post/${(post as any)?.post_info?.id}`}>{(post as any)?.post_info?.title || 'Untitled'}</Link>
                        </h2>
                        <div className="flex items-center space-x-2">
                            <span className="text-xs text-gray-500">{createdAt.toLocaleString()}</span>
                            <PostOptions
                                creatorInfo={(post as any)?.creator}
                                threadInfo={(post as any)?.thread}
                                currentUser={{}}
                                postInfo={post}
                                setShowModal={setShowModal}
                                setModalData={setModalData}
                                handleShare={handleShare}
                            />
                        </div>
                    </div>

                    {(post as any)?.post_info?.media && (
                        <div className="mt-3">
                            {(post as any).post_info.media_type === 'video' ? (
                                <div className="cursor-pointer" onClick={() => onMediaClick('video')} ref={vidRef}>
                                    <ReactPlayer url={(post as any).post_info.media} />
                                </div>
                            ) : (
                                <img src={(post as any).post_info.media} alt="post media" className="w-full h-auto rounded-md cursor-pointer" onClick={() => onMediaClick('image')} />
                            )}
                        </div>
                    )}

                    {(post as any)?.post_info?.content && (
                        <div className="mt-3 text-sm text-gray-800">
                            <Markdown className="prose">{(post as any).post_info.content}</Markdown>
                        </div>
                    )}

                    <div className="mt-3 flex items-center space-x-4">
                        <button className="text-sm text-gray-600" onClick={onReplyClick}><Svg type="comment" className="inline mr-1" onClick={() => {}} /> Reply</button>
                        <button className="text-sm text-gray-600" onClick={handleShare}><Svg type="share" className="inline mr-1" onClick={() => {}} /> Share</button>
                    </div>
                </div>
            </div>

            {/* Modal area */}
            {modalShow && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={() => setShowModal(false)}>
                    <div className="bg-white p-4 rounded" onClick={e => e.stopPropagation()}>{modalData}</div>
                </div>
            )}
        </article>
    );
}

export default PostCurrent;