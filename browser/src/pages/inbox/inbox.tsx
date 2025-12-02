// Have mercy on this code
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import avatar from "../../assets/avatar.png";
import AuthConsumer from "../../components/AuthContext";
import Svg from "../../components/Svg";
import Loader from "../../components/Loader";
import { Link } from "react-router-dom";

// Types and definition
// -------------------------

export interface User {
  avatar?: string;
  name?: string;
  username: string;
}

export interface MessageType {
  message_id: number;
  sender: User;
  receiver: User;
  content: string;
  seen: boolean;
  latest_from_user: boolean;
  created_at: string;
}

interface ChatProps {
  sender: User;
  setCurChat: React.Dispatch<React.SetStateAction<User | false>>;
  newChat?: boolean;
}

interface MessageProps {
  message: MessageType;
  toUser: boolean;
  messageIndex: number;
}

// Inbox Component
// -------------------------

export function Inbox() {
  const [curChat, setCurChat] = useState<User | false>(false);

  const { data } = useQuery<MessageType[]>({
    queryKey: ["inbox"],
    queryFn: async () => {
      const res = await axios.get("/api/messages/inbox");
      return res.data;
    },
  });

  // Set tab title
  useEffect(() => {
    if (curChat) document.title = `Inbox | ${curChat.username}`;
    else document.title = "Reddot | Inbox";

    return () => {
      document.title = "Reddot";
    };
  }, [curChat]);

  return (
    <div className="flex flex-1">
      {/* Mobile list */}
      {!curChat && (
        <ul className="md:hidden p-4 m-2.5 space-y-2 list-none bg-white rounded-md w-full">
          <div className="flex justify-between items-center py-3 border-b-2">
            <h1 className="text-2xl font-semibold text-blue-600">Messages</h1>
          </div>

          {data?.map((message) => (
            <li
              key={message.message_id}
              onClick={() => setCurChat(message.sender)}
              className={`w-full flex items-center p-3 space-x-2 rounded-xl cursor-pointer ${
                curChat && curChat.username === message.sender.username
                  ? "bg-blue-200"
                  : "hover:bg-blue-200"
              }`}
            >
              <img
                src={message.sender.avatar || avatar}
                className="object-cover w-14 h-14 rounded-full"
                alt=""
              />
              <div className="flex flex-col space-y-1 w-full">
                <div className="flex justify-between items-center w-full">
                  <p className="font-medium">{message.sender.username}</p>
                  {!message.latest_from_user && !message.seen && (
                    <Svg type="mail" className="w-4 h-4 text-theme-orange" />
                  )}
                </div>

                <p className="text-sm">
                  {message.latest_from_user
                    ? "You: "
                    : `${message.receiver.username}: `}
                  {message.content.slice(0, 15)}
                  {message.content.length > 15 ? "..." : ""}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Desktop list */}
      <ul className="hidden md:block p-4 w-1/5 m-2.5 space-y-2 list-none bg-white rounded-md">
        <div className="flex justify-between items-center py-3 border-b-2">
          <h1 className="text-2xl font-semibold text-blue-600">Messages</h1>
        </div>

        {data?.map((message, index) => (
          <motion.li
            key={message.message_id}
            initial={{ opacity: 0, x: -100 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.25, delay: index * 0.25 }}
            onClick={() => setCurChat(message.sender)}
            className={`flex items-center w-full p-3 space-x-2 rounded-xl cursor-pointer ${
              curChat && curChat.username === message.sender.username
                ? "bg-blue-200"
                : "hover:bg-blue-200"
            }`}
          >
            <img
              src={message.sender.avatar || avatar}
              className="object-cover w-14 h-14 rounded-full"
              alt=""
            />

            <div className="flex flex-col space-y-1 w-full">
              <div className="flex justify-between items-center w-full">
                <p className="font-medium">{message.sender.username}</p>
                {!message.latest_from_user && !message.seen && (
                  <Svg type="mail" className="w-4 h-4 text-theme-orange" />
                )}
              </div>
              <p className="text-sm">
                {message.latest_from_user
                  ? "You: "
                  : `${message.receiver.username}: `}
                {message.content.slice(0, 15)}
                {message.content.length > 15 ? "..." : ""}
              </p>
            </div>
          </motion.li>
        ))}
      </ul>

      {/* Chat Window */}
      <AnimatePresence>
        {curChat && (
          <div className={`flex-1 m-2.5 bg-white rounded-md`}>
            <Chat sender={curChat} setCurChat={setCurChat} />
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Chat Component
// -------------------------

export function Chat({ sender, setCurChat, newChat = false }: ChatProps) {
  const myRef = useRef<HTMLLIElement | null>(null);
  const queryClient = useQueryClient();
  const { user } = AuthConsumer();
  const [message, setMessage] = useState("");

  const { data, isFetching } = useQuery<MessageType[]>({
    queryKey: ["chat", sender.username],
    queryFn: async () => {
      const res = await axios.get(`/api/messages/all/${sender.username}`);
      return res.data;
    },
    enabled: !!sender.username,
  });

  const { mutate } = useMutation({
    mutationFn: async (params: { message: string; sender: User }) => {
      const res = await axios.post("/api/messages", {
        content: params.message,
        receiver: params.sender.username,
      });
      return res.data;
    },

    onSuccess: (newMsg: MessageType) => {
      setMessage("");

      // Update chat history
      queryClient.setQueryData<MessageType[]>(
        ["chat", sender.username],
        (old = []) => [...old, newMsg]
      );

      // Update inbox
      queryClient.setQueryData<MessageType[]>(
        ["inbox"],
        (old = []) =>
          old.map((m) =>
            m.sender.username === sender.username
              ? {
                  ...m,
                  content: newMsg.content,
                  created_at: newMsg.created_at,
                  message_id: newMsg.message_id,
                }
              : m
          )
      );
    },
  });

  useEffect(() => {
    myRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [isFetching]);

  const animateWhen = (data?.length ?? 0) - 10;

  const AnimateChat = {
    hidden: { opacity: 0, x: 10 },
    visible: { opacity: 1, x: 0 },
  };

  return (
    <motion.div
      className={`flex flex-col justify-between w-full ${
        newChat && "bg-white w-10/12 md:w-1/2"
      }`}
      variants={AnimateChat}
      initial="hidden"
      animate="visible"
      exit={{ opacity: 0, x: 10, transition: { duration: 0.1 } }}
      transition={{ duration: 0.25 }}
    >
      {/* Header */}
      <div className="flex justify-between items-center p-3 mx-2 border-b-2">
        <div className="flex items-center space-x-4">
          <img
            src={sender.avatar || avatar}
            alt=""
            className="object-cover w-14 h-14 rounded-full"
          />
          <Link
            to={`/u/${sender.username}`}
            className="text-xl font-semibold text-blue-500"
          >
            {sender.username}
          </Link>
        </div>

        <button
          onClick={() => setCurChat(false)}
          className="p-2 ml-auto text-white bg-blue-600 rounded-md"
        >
          Close
        </button>
      </div>

      {/* Messages */}
      {isFetching ? (
        <div className="flex justify-center items-center md:h-[61vh] h-[70vh]">
          <Loader forPosts={true} />
        </div>
      ) : (
        <ul className="p-3 space-y-3 rounded-md overflow-auto md:h-[61vh] h-[70vh]">
          {data?.map((msg, index) => (
            <Message
              key={msg.message_id}
              message={msg}
              toUser={msg.sender.username === user.username}
              messageIndex={index < animateWhen ? 0 : index - animateWhen}
            />
          ))}
          <li className="invisible" ref={myRef} />
        </ul>
      )}

      {/* Send box */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          mutate({ message, sender });
        }}
        className="flex justify-between items-center p-4 w-full bg-blue-200"
      >
        <input
          type="text"
          className="p-2 px-4 mx-3 w-full font-medium rounded-full focus:outline-none"
          placeholder="Type a message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <Svg
          onClick={() => mutate({ message, sender })}
          type="send"
          className="w-8 h-8 text-white"
        />
      </form>
    </motion.div>
  );
}

// Message Bubble
// -------------------------

function Message({ message, toUser, messageIndex }: MessageProps) {
  const sentDate = new Date(message.created_at);

  return (
    <motion.li
      initial={{ opacity: 0, x: toUser ? 100 : -100 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25, delay: messageIndex * 0.1 }}
      className={`pl-2 py-1 w-fit rounded-md ${
        message.seen ? "bg-green-100" : "bg-blue-100"
      } ${toUser ? "ml-auto pr-2" : "pr-10"}`}
    >
      <p className={`break-all pt-1 font-medium ${toUser && "pl-1"}`}>
        {message.content}
      </p>
      <p className={`mt-0.5 text-xs font-light ${toUser && "text-right"}`}>
        {sentDate.toLocaleString()}
      </p>
    </motion.li>
  );
}

export default Inbox;
