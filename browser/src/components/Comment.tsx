import { AnimatePresence, motion } from "framer-motion";
import Markdown from "markdown-to-jsx";
import { FC, useRef, useState, ChangeEvent } from "react";
import { Link } from "react-router-dom";
import useComment from "../hooks/useComment";
import { timeAgo } from "../pages/Post/utils";
import useAuth from "./../components/AuthContext";
import Svg from "./Svg";
import Vote from "./Vote";

const DEFAULT_AVATAR = "/default_avatar.png";

// Type Definitions
// ----------------------
// From AuthContext
// From AuthContext
interface UserType {
    username: string;
    avatar?: string;
    mod_in: string[];
    roles: string[];
}

// The shape of the comment info used by this component
interface CommentInfo {
    id: number;
    created_at: string; // ISO date string
    is_edited: boolean;
    content: string;
    comment_karma: number;
}

// The user info shape used by this component
interface UserInfoType {
    avatar?: string;
    username: string;
    }

// The current user shape used by Vote
interface CurrentUserType {
    has_upvoted?: boolean;
}

// This is the recursive node shape used by the Comment tree in this component
interface CommentNode {
    comment: {
        comment_info: CommentInfo;
        user_info: UserInfoType;
        current_user: CurrentUserType;
    };
    children: CommentNode[];
}


// Props for the main Comment component
interface CommentProps {
    children: CommentNode[];
    comment: CommentNode;
    threadID: string;
    commentIndex: number;
    parentDelete?: ((commentId: number) => void) | null;
}

// Props for the CommentMode component
interface CommentModeProps {
    user: UserType;
    colorSquence?: () => string;
    callBackSubmit: (data: string) => void;
    callBackCancel: () => void;
    defaultValue?: string | null;
}

// ----------------------
// Utility: clipboard copy
function copyToClipboard(text: string) {
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(
        () => {
            console.log("Link Copied to Clipboard");
        },
        (err) => {
            console.warn("Clipboard write failed, using fallback:", err);
            fallbackCopy(text);
        }
        );
    } else {
        fallbackCopy(text);
    }
}

function fallbackCopy(text: string) {
    const textArea = document.createElement("textarea");
    textArea.value = text;

    textArea.style.top = "0";
    textArea.style.left = "0";
    textArea.style.position = "fixed";

    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
        const successful = document.execCommand("copy");
        if (successful) {
        console.log("Link Copied to Clipboard (fallback)");
        } else {
        console.error("Fallback: Copying text was unsuccessful");
        }
    } catch (err) {
        console.error("Fallback: Oops, unable to copy", err);
    }

    document.body.removeChild(textArea);
}


// Main Comment Component
export const Comment: FC<CommentProps> = ({ children, comment, threadID, commentIndex, parentDelete = null }) => {
    const listRef = useRef<HTMLSelectElement>(null);
    const [isReply, setIsReply] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [expandChildren, setExpandChildren] = useState(true); // Default to expanded

  // Let TypeScript infer the return type from useComment to avoid mismatch with hook internals.
  // Casting the inputs to `any[]`/`any` is done here only to satisfy `useComment`'s own input expectations,
  // not to disable type-checking across the rest of this file.
    const {
        commentChildren,
        commentInfo,
        userInfo,
        currentUser,
        addComment,
        deleteComment,
        updateComment,
        colorSquence,
    } = useComment({
    children: children as any[],
    comment: comment as any,
  } as any);

    const { isAuthenticated, user } = useAuth();
    const timePassed = timeAgo(new Date(commentInfo.created_at));

  function handleSelect(value: string) {
    switch (value) {
      case "delete":
        if (parentDelete) {
          parentDelete(commentInfo.id as number);
        } else {
          deleteComment(commentInfo.id as number);
        }
        if (listRef.current) listRef.current.value = "more";
        break;
      case "edit":
        setEditMode(true);
        break;
      case "share":
        copyToClipboard(window.location.href);
        if (listRef.current) listRef.current.value = "more";
        break;
    }
  }

    return (
    <motion.li
        className={`py-3 pl-2 space-y-2 w-full bg-white rounded-xl md:text-base ${!parentDelete && "border"}`}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: commentIndex * 0.15 }}
        exit={{ opacity: 0, y: -10, transition: { duration: 0.1 } }}
    >
        {editMode ? (
            <CommentMode
            callBackSubmit={(data) => {
                updateComment(data);
                setEditMode(false);
                if (listRef.current) listRef.current.value = "more";
            }}
        callBackCancel={() => {
            setEditMode(false);
            if (listRef.current) listRef.current.value = "more";
            }}
            defaultValue={commentInfo.content}
            user={user as UserType}
        />
      ) : (
        <>
            <div className="flex items-center space-x-2 text-sm font-medium">
            <img
                loading="lazy"
                width="20"
                height="20"
                // src={userInfo.user_avatar ? userInfo.user_avatar : avatar}
                alt=""
                className="object-cover w-5 h-5 rounded-full"
            />
            <Link to={`/u/${userInfo.username}`} className="font-medium text-blue-600 hover:underline">
                {userInfo.username}
            </Link>
            <p>{timePassed}</p>
            {commentInfo.is_edited && <p>(Edited)</p>}
          </div>
          <div className="max-w-full text-black prose prose-sm md:prose-base prose-blue">
            <Markdown className="[&>*:first-child]:mt-0">{commentInfo.content}</Markdown>
          </div>
        </>
      )}
      <div className="flex justify-around items-center md:justify-between md:mx-10">
        {isAuthenticated && user && (user.username === userInfo.username || user.mod_in.includes(threadID) || user.roles.includes("admin")) ? (
        <select
            defaultValue={"more"}
            ref={listRef}
            name="more-options"
            title="More Options"
            id="more-options"
            className="text-sm bg-white md:px-2 md:text-base"
            onChange={(e: ChangeEvent<HTMLSelectElement>) => handleSelect(e.target.value)}
            >
            <option value="more">More</option>
            <option value="share">Share</option>
            {user.username === userInfo.username && <option value="edit">Edit</option>}
            <option value="delete">Delete</option>
          </select>
        ) : (
        <div className="flex items-center space-x-1 cursor-pointer" onClick={() => copyToClipboard(window.location.href)}>
            <Svg type="share" className="w-4 h-4" />
            <p className="text-sm md:text-base">Share</p>
        </div>
        )}
        <div
            className="flex items-center space-x-1 cursor-pointer"
            onClick={() => {
            if (!isAuthenticated) {
                console.error("User must be logged in to reply.");
            } else {
                setIsReply(!isReply);
            }
          }}
        >
          <Svg type="comment" className="w-4 h-4" />
          <p className="text-sm md:text-base">Reply</p>
        </div>
        <div
          className={`${!commentChildren.length && "invisible"} flex items-center space-x-1 cursor-pointer`}
          onClick={() => setExpandChildren(!expandChildren)}
        >
          <Svg type="down-arrow" className={`w-4 h-4 transition-transform ${expandChildren && "rotate-180"}`} />
          <p className="text-sm md:text-base">{expandChildren ? "Hide" : "Show"}</p>
        </div>
        <div className="flex items-center space-x-2 text-sm md:text-base">
          <Vote
            url="/api/reactions/comment"
            initialVote={currentUser?.has_upvoted}
            initialCount={commentInfo.comment_karma}
            contentID={commentInfo.id as number}
            type="mobile"
          />
        </div>
    </div>

    {isReply && (
        <CommentMode
            callBackSubmit={(data) => {
            if (listRef.current) listRef.current.value = "more";
            addComment(data);
            setIsReply(false);
            setExpandChildren(true);
          }}
          callBackCancel={() => {
            setIsReply(false);
            if (listRef.current) listRef.current.value = "more";
          }}
          colorSquence={colorSquence}
          user={user as UserType}
        />
      )}

     <AnimatePresence mode="wait">
        {expandChildren && (
            <ul className={commentChildren.length > 0 && expandChildren ? "border-l-2 " + colorSquence() : ""}>
            {commentChildren.map((child: any, index: number) => (
                <Comment
                key={child.comment.comment_info.id}
                children={child.children as CommentNode[]}
                comment={child as CommentNode}
                commentIndex={index}
                parentDelete={deleteComment}
                threadID={threadID}
                />
            ))}
            </ul>
            )}
        </AnimatePresence>
    </motion.li>
    );
};

// Comment Input Component
export const CommentMode: FC<CommentModeProps> = ({ user, colorSquence, callBackSubmit, callBackCancel, defaultValue = null }) => {
    const { isAuthenticated } = useAuth();
    const [preMD, setPreMD] = useState(false);
    const [content, setContent] = useState(defaultValue || "");

    return (
    <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10, transition: { duration: 0.15 } }}
        transition={{ duration: 0.25 }}
        className={`mr-4 space-y-2 bg-white md:text-base ${
        defaultValue !== null ? "" : `border-l-2 ${colorSquence ? colorSquence() : "border-gray-200"} py-3 pl-2 `
      }`}
    >
      <div className="flex items-center space-x-2 text-sm font-medium">
        <img src={user.avatar ? user.avatar : avatar} alt="" className="object-cover w-5 h-5 rounded-full" />
        <Link to={`/u/${user.username}`}>{user.username}</Link>
      </div>
      <form
        method="post"
        className="flex flex-col space-y-2"
        onSubmit={(e) => {
            e.preventDefault();
            if (isAuthenticated) {
                callBackSubmit(content);
          } else {
            console.error("User must be logged in to share the comment.");
          }
        }}
      >
        {preMD ? (
          <div className="overflow-auto p-2 max-w-full h-24 rounded-md border prose">
            <Markdown options={{ forceBlock: true }}>{content.replace(/\n/g, "<br />\n") || "This is markdown preview"}</Markdown>
          </div>
        ) : (
          <textarea
            autoFocus
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="p-2 w-full h-24 text-sm rounded-md border md:text-base focus:outline-none"
          />
        )}
        <div className="flex self-end space-x-2">
          <button type="submit" className="px-2 py-1 font-bold text-white bg-blue-600 rounded-md md:px-5 active:scale-95">
            Submit
            </button>
            <button
            onClick={() => setPreMD(!preMD)}
            type="button"
            className="px-2 py-1 font-bold text-white bg-green-600 rounded-md md:px-5 active:scale-95"
          >
            {preMD ? "Close Preview" : "Preview"}
        </button>
        <button
            onClick={() => callBackCancel()}
            type="button"
            className="px-2 py-1 font-bold text-white bg-red-600 rounded-md md:px-5 active:scale-95"
          >
            Cancel
          </button>
        </div>
      </form>
    </motion.div>
  );
};

export default Comment;