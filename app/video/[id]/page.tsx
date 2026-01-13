"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/utils/api-client";
import ModernLoader from "@/app/components/ModernLoader";
import { motion } from "framer-motion";
import { useParams, useRouter } from "next/navigation";
import { videoInterface } from "@/model/Vdeo";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import ShareModal from "@/app/components/ShareModal";

interface VideosResponse {
  videos: (videoInterface & { _id: string })[];
}

interface Comment {
  _id: string;
  userId: string;
  userName: string;
  text: string;
  createdAt: string;
}

export default function VideoDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const videoId = params.id as string;
  const queryClient = useQueryClient();

  const [likes, setLikes] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [comments, setComments] = useState<Comment[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [isBlocked, setIsBlocked] = useState(false);

  const { data, isLoading, error } = useQuery<VideosResponse>({
    queryKey: ["videos"],
    queryFn: async () => (await apiClient.getVideos()) as VideosResponse,
  });

  const video = data?.videos.find((v) => v._id === videoId);

  // Fetch like status
  useEffect(() => {

    if (video) {
      fetch(`/api/video/${videoId}/like`)
        .then((res) => res.json())
        .then((data) => {
          setLikes(data.likes);
          setIsLiked(data.isLiked);
        });
    }
  }, [videoId, video]);

  // Fetch comments
  useEffect(() => {
    if (video) {
      fetch(`/api/video/${videoId}/comment`)
        .then((res) => res.json())
        .then((data) => {
          setComments(data.comments || []);
        });
    }
  }, [videoId, video]);

  // Fetch follow and block status
  useEffect(() => {
    if (video?.userId) {
      fetch(`/api/user/${video.userId}/follow`)
        .then((res) => res.json())
        .then((data) => {
          setIsFollowing(data.isFollowing);
          setFollowerCount(data.followerCount);
        });

      if (session) {
        fetch(`/api/user/block?userId=${video.userId}`)
          .then(res => res.json())
          .then(data => setIsBlocked(data.isBlocked));
      }
    }
  }, [video?.userId, session]);

  useEffect(() => {
    if (data && !video && !isLoading) {
      router.push("/");
    }
  }, [data, video, isLoading, router]);

  const handleLike = async () => {
    if (!session) {
      router.push("/login");
      return;
    }

    const newIsLiked = !isLiked;
    setIsLiked(newIsLiked);
    setLikes(newIsLiked ? likes + 1 : likes - 1);

    try {
      const response = await fetch(`/api/video/${videoId}/like`, {
        method: "POST",
      });
      const data = await response.json();
      setLikes(data.likes);
      setIsLiked(data.isLiked);
    } catch (error) {
      setIsLiked(!newIsLiked);
      setLikes(newIsLiked ? likes - 1 : likes + 1);
    }
  };

  const handleFollow = async () => {
    if (!session) {
      router.push("/login");
      return;
    }

    if (!video?.userId) return;

    // Optimistic update
    const newIsFollowing = !isFollowing;
    setIsFollowing(newIsFollowing);
    setFollowerCount(newIsFollowing ? followerCount + 1 : followerCount - 1);

    try {
      const response = await fetch(`/api/user/${video.userId}/follow`, {
        method: "POST",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to follow");
      }

      const data = await response.json();
      setIsFollowing(data.isFollowing);
      setFollowerCount(data.followerCount);
    } catch (error) {
      // Revert on error
      console.error("Follow error:", error);
      setIsFollowing(!newIsFollowing);
      setFollowerCount(newIsFollowing ? followerCount - 1 : followerCount + 1);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) {
      router.push("/login");
      return;
    }

    if (!commentText.trim()) return;

    try {
      const response = await fetch(`/api/video/${videoId}/comment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: commentText }),
      });

      const data = await response.json();
      setComments([...comments, data.comment]);
      setCommentText("");
    } catch (error) {
      console.error("Error adding comment:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0B1121]">
        <ModernLoader />
      </div>
    );
  }

  if (error || !video) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-gray-900">
        <div className="text-center p-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Video not found
          </h2>
          <button
            onClick={() => router.push("/")}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-all shadow-lg"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Video Player */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-black rounded-2xl overflow-hidden shadow-2xl"
            >
              <div className="relative aspect-video">
                <video
                  src={video.videoUrl}
                  controls
                  autoPlay
                  className="w-full h-full"
                  poster={video.thumbnailUrl}
                />
              </div>
            </motion.div>

            {/* Video Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg"
            >
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-4">
                {video.title}
              </h1>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 mb-6">
                {/* Like Button */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleLike}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all shadow-md ${isLiked
                    ? "bg-red-500 text-white"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                    }`}
                >
                  <svg
                    className="w-6 h-6"
                    fill={isLiked ? "currentColor" : "none"}
                    stroke="currentColor"
                    strokeWidth={2}
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                    />
                  </svg>
                  <span>{likes}</span>
                </motion.button>

                {/* Share Button */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsShareModalOpen(true)}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all shadow-md"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                    />
                  </svg>
                  <span>Share</span>
                </motion.button>

                {/* Desktop Follow Button (Hidden on Mobile) */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleFollow}
                  className={`lg:hidden ml-auto flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all shadow-md ${isFollowing
                    ? "bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-white"
                    : "bg-gradient-to-r from-blue-600 to-cyan-600 text-white hover:from-blue-700 hover:to-cyan-700"
                    }`}
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d={isFollowing ? "M5 13l4 4L19 7" : "M12 4v16m8-8H4"}
                    />
                  </svg>
                  <span>{isFollowing ? "Following" : "Follow"}</span>
                </motion.button>
              </div>

              {/* Description */}
              <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4">
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                  {video.description}
                </p>
                {video.createdAt && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
                    {new Date(video.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                )}
              </div>
            </motion.div>

            {/* Comments Section */}
            <motion.div
              id="comments"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg"
            >
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                {comments.length} Comments
              </h2>

              {/* Add Comment */}
              {session ? (
                <form onSubmit={handleAddComment} className="mb-8">
                  <div className="flex gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold">
                      {session.user?.name?.[0] || session.user?.email?.[0] || "U"}
                    </div>
                    <div className="flex-1">
                      <input
                        type="text"
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        placeholder="Add a comment..."
                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                      <div className="flex justify-end gap-2 mt-2">
                        <button
                          type="button"
                          onClick={() => setCommentText("")}
                          className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={!commentText.trim()}
                          className="px-6 py-2 text-sm font-semibold bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:from-blue-700 hover:to-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                          Comment
                        </button>
                      </div>
                    </div>
                  </div>
                </form>
              ) : (
                <div className="mb-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-center">
                  <p className="text-gray-700 dark:text-gray-300 mb-3">
                    Sign in to leave a comment
                  </p>
                  <button
                    onClick={() => router.push("/login")}
                    className="px-6 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-all"
                  >
                    Sign In
                  </button>
                </div>
              )}

              {/* Comments List */}
              <div className="space-y-6">
                {comments.map((comment, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex gap-3 relative group"
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                      {comment.userName[0]}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {comment.userName}
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {new Date(comment.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-gray-700 dark:text-gray-300">
                        {comment.text}
                      </p>
                    </div>

                    {/* Delete Button */}
                    {(session?.user?.email === comment.userId || session?.user?.email === video.userId) && (
                      <button
                        onClick={async () => {
                          if (!confirm("Delete this comment?")) return;
                          try {
                            const res = await fetch(`/api/video/${videoId}/comment`, {
                              method: "DELETE",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ commentId: comment._id }),
                            });
                            if (res.ok) {
                              setComments(comments.filter((c) => c._id !== comment._id));
                            }
                          } catch (err) {
                            console.error("Failed to delete comment", err);
                          }
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-2 text-gray-400 hover:text-red-500"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Sidebar - Creator Info */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg sticky top-24"
            >
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                Creator
              </h3>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold text-xl">
                  {video.userName?.[0] || "C"}
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {video.userName || "Unknown Creator"}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {followerCount} followers
                  </p>
                </div>
              </div>
              <button
                onClick={handleFollow}
                className={`w-full px-4 py-3 rounded-xl font-semibold transition-all shadow-md ${isFollowing
                  ? "bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-white"
                  : "bg-gradient-to-r from-blue-600 to-cyan-600 text-white hover:from-blue-700 hover:to-cyan-700"
                  }`}
              >
                {isFollowing ? "Following" : "Follow"}
              </button>

              {session?.user?.email !== video.userId && (
                <button
                  onClick={async () => {
                    if (!session) {
                      router.push("/login");
                      return;
                    }
                    try {
                      const res = await fetch("/api/user/block", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ userIdToBlock: video.userId })
                      });
                      if (res.ok) {
                        const data = await res.json();
                        setIsBlocked(data.isBlocked);
                        // Optionally refresh or handle UI state
                      }
                    } catch (err) {
                      console.error("Block failed", err);
                    }
                  }}
                  className={`w-full mt-3 px-4 py-3 rounded-xl font-semibold transition-all shadow-md ${isBlocked
                    ? "bg-red-600 text-white hover:bg-red-700"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-red-100 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400"
                    }`}
                >
                  {isBlocked ? "Unblock User" : "Block User"}
                </button>
              )}
            </motion.div>
          </div>
        </div>
      </div>

      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        videoId={videoId}
        videoTitle={video.title}
      />
    </div>
  );
}
