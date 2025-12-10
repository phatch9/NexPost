import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { AnimatePresence } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AuthConsumer from "../../components/AuthContext";
import InfinitePostsLayout from "../../components/InfinitePosts";
import ManageMods from "../../components/ManageMods";
import Modal from "../../components/Modal";
import { NewThread } from "../../components/NewThread";
import Loader from "../../components/Loader";

interface ThreadData {
  id: number;
  name: string;
  logo?: string;
  description?: string;
  created_at: string;
  subscriberCount: number;
  PostsCount: number;
  CommentsCount: number;
  has_subscribed: boolean;
  modList: string[];
}

export function SubThread() {
  const listRef = useRef<HTMLSelectElement>(null);
  const navigate = useNavigate();
  const [modalData, setModalData] = useState<false | JSX.Element>(false);

  const queryClient = useQueryClient();

  const params = useParams<{ threadName: string }>();
  const { isAuthenticated, user } = AuthConsumer();

  // ---- Fetch thread info ----
  const { data, isFetching } = useQuery({
    queryKey: ["thread", params.threadName],
    queryFn: async () => {
      const res = await axios.get(`/api/threads/${params.threadName}`);
      return res.data as { threadData: ThreadData };
    },
    enabled: !!params.threadName,
  });

  const threadData = data?.threadData;

  // ---- Page Title ----
  useEffect(() => {
    document.title = "t/" + params.threadName;
    return () => {
      document.title = "Threaddit";
    };
  }, [params.threadName]);

  // ---- Subscribe/Unsubscribe ----
  const { mutate } = useMutation({
    mutationFn: async (hasSubscribed: boolean) => {
      if (!threadData) return;

      if (hasSubscribed) {
        await axios.delete(`/api/threads/subscription/${threadData.id}`);
        queryClient.setQueryData(["thread", params.threadName], (old: any) => ({
          threadData: { ...old.threadData, has_subscribed: false },
        }));
      } else {
        await axios.post(`/api/threads/subscription/${threadData.id}`);
        queryClient.setQueryData(["thread", params.threadName], (old: any) => ({
          threadData: { ...old.threadData, has_subscribed: true },
        }));
      }
    },
  });

  // ---- Dropdown handler ----
    function handleChange(value: string) {
    if (!threadData) return;

    switch (value) {
        case "more":
        break;

        case "edit":
        setModalData(
            <NewThread ogInfo={threadData} edit={true} setShowModal={setModalData} />
        );
        break;

      case "manage-mods":
        setModalData(
          <ManageMods mods={threadData.modList} threadId={threadData.id} />
        );
        break;

      case "logo":
        setModalData(
          <img
            src={threadData.logo}
            className="object-cover w-11/12 max-h-5/6 md:w-max md:max-h-screen"
            alt=""
          />
        );
        break;

      default:
        navigate(`/u/${value}`);
    }

    if (listRef.current) listRef.current.value = "more";
  }

  return (
    <div className="flex flex-col flex-1 items-center w-full bg-theme-cultured">
      <div className="flex flex-col p-5 space-y-1 w-full bg-white rounded-md md:pb-3 md:space-y-3">

        {isFetching ? (
          <Loader forPosts={true} />
        ) : (
          threadData && (
            <div
              className={`flex p-2 flex-col md:flex-row items-center rounded-md md:rounded-full bg-theme-cultured ${
                !threadData.logo && "py-5"
              }`}
            >
              {threadData.logo && (
                <img
                  src={threadData.logo}
                  className="object-cover w-32 h-32 rounded-full cursor-pointer md:w-36 md:h-36"
                  alt=""
                  onClick={() => handleChange("logo")}
                />
              )}

              <div className="flex flex-col flex-1 justify-around items-center p-2 space-y-1">
                <div className="flex items-center space-x-5">
                  <h1 className="text-xl font-semibold">{threadData.name}</h1>
                </div>

                <p className="text-xs">
                  Since: {new Date(threadData.created_at).toDateString()}
                </p>

                {threadData.description && (
                  <p
                    className={`text-center py-4 md:py-2 text-sm ${
                      threadData.description.length > 90 && "text-xs"
                    }`}
                  >
                    {threadData.description}
                    {threadData.description.length > 90 && "..."}
                  </p>
                )}

                <div className="flex justify-between mt-2 space-x-7 w-full md:w-11/12">
                  <p className="text-sm">{threadData.subscriberCount} subscribers</p>
                  <p className="text-sm">{threadData.PostsCount} posts</p>
                  <p className="text-sm">{threadData.CommentsCount} comments</p>
                </div>
              </div>
            </div>
          )
        )}

    