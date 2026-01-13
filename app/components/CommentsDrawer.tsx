
"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import { formatDistanceToNow } from "date-fns";

interface Comment {
    _id: string;
    userId: string;
    userName: string;
    text: string;
    createdAt: string;
}

interface CommentsDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    videoId: string;
}

export default function CommentsDrawer({ isOpen, onClose, videoId }: CommentsDrawerProps) {
    const { data: session } = useSession();
    const [comments, setComments] = useState<Comment[]>([]);
    const [commentText, setCommentText] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Fetch comments when drawer opens
    useEffect(() => {
        if (isOpen && videoId) {
            setIsLoading(true);
            fetch(`/api/video/${videoId}/comment`)
                .then((res) => res.json())
                .then((data) => {
                    setComments(data.comments || []);
                    setIsLoading(false);
                })
                .catch((err) => {
                    console.error(err);
                    setIsLoading(false);
                });
        }
    }, [isOpen, videoId]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [comments]);

    const handleAddComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!session || !commentText.trim()) return;

        try {
            const response = await fetch(`/api/video/${videoId}/comment`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text: commentText }),
            });

            if (response.ok) {
                const data = await response.json();
                setComments([...comments, data.comment]);
                setCommentText("");
            }
        } catch (error) {
            console.error("Error adding comment:", error);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
                    />

                    {/* Drawer */}
                    <motion.div
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="fixed bottom-0 left-0 right-0 z-50 h-[75vh] bg-[#1a1a1a] rounded-t-3xl border-t border-gray-800 shadow-2xl flex flex-col md:max-w-md md:mx-auto"
                    >
                        {/* Handle Bar */}
                        <div className="w-full flex justify-center pt-3 pb-1" onClick={onClose}>
                            <div className="w-12 h-1.5 bg-gray-600 rounded-full cursor-pointer" />
                        </div>

                        {/* Header */}
                        <div className="px-4 py-3 border-b border-gray-800 flex justify-between items-center">
                            <h3 className="text-white font-semibold">Comments ({comments.length})</h3>
                            <button onClick={onClose} className="p-1 text-gray-400 hover:text-white">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Comments List */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {isLoading ? (
                                <div className="text-center text-gray-400 mt-10">Loading comments...</div>
                            ) : comments.length === 0 ? (
                                <div className="text-center text-gray-500 mt-10">
                                    No comments yet. Be the first to say something!
                                </div>
                            ) : (
                                comments.map((comment) => (
                                    <div key={comment._id} className="flex gap-3">
                                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white text-xs font-bold">
                                            {comment.userName?.[0]?.toUpperCase() || "U"}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-baseline gap-2">
                                                <span className="text-sm font-semibold text-white">
                                                    {comment.userName}
                                                </span>
                                                <span className="text-xs text-gray-500">
                                                    {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-300 mt-0.5 break-words">{comment.text}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className="p-4 border-t border-gray-800 bg-[#1a1a1a]">
                            <form onSubmit={handleAddComment} className="flex gap-2">
                                <div className="flex-1 relative">
                                    {/* Ideally user avatar here */}
                                    <input
                                        type="text"
                                        value={commentText}
                                        onChange={(e) => setCommentText(e.target.value)}
                                        placeholder={session ? "Add a comment..." : "Log in to comment"}
                                        disabled={!session}
                                        className="w-full bg-gray-800 text-white rounded-full px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 border border-transparent placeholder-gray-500"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={!session || !commentText.trim()}
                                    className="p-2.5 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <svg className="w-5 h-5 transform rotate-90" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                                    </svg>
                                </button>
                            </form>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
