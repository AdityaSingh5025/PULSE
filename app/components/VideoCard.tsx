"use client";

import { motion } from "framer-motion";
import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import ShareModal from "./ShareModal";
import DeleteConfirmationModal from "./DeleteConfirmationModal";
import { useSession } from "next-auth/react";
import { toast } from "react-hot-toast";

interface VideoCardProps {
    video: {
        _id: string;
        title: string;
        description: string;
        videoUrl: string;
        thumbnailUrl: string;
        likes?: string[];
        comments?: {
            userId: string;
            userName: string;
            text: string;
            createdAt: Date;
        }[];
        userId?: string;
        userName?: string;
    };
    index: number;
}

export default function VideoCard({ video, index }: VideoCardProps) {
    const { data: session } = useSession();
    const [isHovered, setIsHovered] = useState(false);
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [likes, setLikes] = useState(video.likes?.length || 0);
    const [isLiked, setIsLiked] = useState(false);
    const [comments, setComments] = useState(video.comments?.length || 0);
    const videoRef = useRef<HTMLVideoElement>(null);

    // Check if user has liked this video
    useEffect(() => {
        if (session?.user?.email && video.likes) {
            setIsLiked(video.likes.includes(session.user.email));
        }
    }, [session, video.likes]);

    const handleMouseEnter = () => {
        setIsHovered(true);
        if (videoRef.current) {
            videoRef.current.play().catch(() => { });
        }
    };

    const handleMouseLeave = () => {
        setIsHovered(false);
        if (videoRef.current) {
            videoRef.current.pause();
            videoRef.current.currentTime = 0;
        }
    };

    const handleLike = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!session) {
            window.location.href = "/login";
            return;
        }

        // Optimistic update
        const newIsLiked = !isLiked;
        setIsLiked(newIsLiked);
        setLikes(newIsLiked ? likes + 1 : likes - 1);

        try {
            const response = await fetch(`/api/video/${video._id}/like`, {
                method: "POST",
            });

            if (!response.ok) throw new Error("Failed to toggle like");

            const data = await response.json();
            setLikes(data.likes);
            setIsLiked(data.isLiked);
        } catch (error) {
            // Revert on error
            setIsLiked(!newIsLiked);
            setLikes(newIsLiked ? likes - 1 : likes + 1);
            console.error("Error toggling like:", error);
        }
    };

    const handleShare = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsShareModalOpen(true);
    };

    const handleComment = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        window.location.href = `/video/${video._id}#comments`;
    };

    const handleDeleteVideo = async () => {
        setIsDeleting(true);
        try {
            const res = await fetch(`/api/video/${video._id}`, {
                method: "DELETE"
            });
            if (res.ok) {
                toast.success("Video deleted successfully");
                window.location.reload();
            } else {
                toast.error("Failed to delete video");
                setIsDeleting(false);
            }
        } catch (err) {
            console.error("Failed to delete video", err);
            toast.error("An error occurred");
            setIsDeleting(false);
        }
    };

    return (
        <>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05, duration: 0.4 }}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                className="group relative"
            >
                <Link href={`/video/${video._id}`}>
                    <motion.div
                        whileHover={{ y: -8 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                        className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 dark:border-gray-700"
                    >
                        {/* Thumbnail/Video */}
                        <div className="relative aspect-video bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/20 dark:to-cyan-900/20 overflow-hidden">
                            {video.thumbnailUrl ? (
                                <Image
                                    src={video.thumbnailUrl}
                                    alt={video.title}
                                    fill
                                    className={`object-cover transition-all duration-500 ${isHovered ? "opacity-0 scale-110" : "opacity-100 scale-100"
                                        }`}
                                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                    priority={index < 6}
                                />
                            ) : null}

                            <video
                                ref={videoRef}
                                src={video.videoUrl}
                                muted
                                loop
                                playsInline
                                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${isHovered ? "opacity-100" : "opacity-0"
                                    }`}
                            />

                            <div
                                className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${isHovered ? "opacity-0" : "opacity-100"
                                    }`}
                            >
                                <motion.div
                                    whileHover={{ scale: 1.1 }}
                                    className="w-16 h-16 rounded-full bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm flex items-center justify-center shadow-xl"
                                >
                                    <svg
                                        className="w-8 h-8 text-blue-600 dark:text-blue-400 ml-1"
                                        fill="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path d="M8 5v14l11-7z" />
                                    </svg>
                                </motion.div>
                            </div>

                            <div
                                className={`absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent transition-opacity duration-300 ${isHovered ? "opacity-100" : "opacity-0"
                                    }`}
                            />
                        </div>

                        {/* Content */}
                        <div className="p-5">
                            <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                {video.title}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-4">
                                {video.description}
                            </p>

                            {/* Social Actions */}
                            <div className="flex items-center gap-4 pt-3 border-t border-gray-100 dark:border-gray-700">
                                {/* Like Button */}
                                <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={handleLike}
                                    className={`flex items-center gap-2 transition-colors ${isLiked
                                        ? "text-red-500"
                                        : "text-gray-600 dark:text-gray-400 hover:text-red-500"
                                        }`}
                                >
                                    <svg
                                        className="w-5 h-5"
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
                                    <span className="text-sm font-semibold">{likes}</span>
                                </motion.button>

                                {/* Comment Button */}
                                <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={handleComment}
                                    className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-blue-500 transition-colors"
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
                                            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                                        />
                                    </svg>
                                    <span className="text-sm font-semibold">{comments}</span>
                                </motion.button>

                                {/* Share Button */}
                                <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={handleShare}
                                    className="ml-auto flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-cyan-500 transition-colors"
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
                                            d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                                        />
                                    </svg>
                                </motion.button>

                                {/* Edit Button (Owner Only) */}
                                {session?.user?.email && (video as any).userId === session.user.email && (
                                    <>
                                        <motion.button
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.9 }}
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                // Handle edit specific logic, ideally opening a modal
                                                // For now, we'll dispatch an event or use a callback if we refactor,
                                                // but to keep it simple, we can navigate to an edit page or show a modal.
                                                // Since an edit page wasn't explicitly requested as a new page, 
                                                // I will assume we should just allow editing title/description.
                                                // Navigating to /upload?edit=id could be an option, but let's try to keep it inline or simple.
                                                // Given the constraints, let's navigate to a dedicated edit page for simplicity if complex,
                                                // or just alert for now until we decide.
                                                // Actually, better to just navigate to /video/[id]/edit
                                                window.location.href = `/video/${video._id}/edit`;
                                            }}
                                            className="ml-auto flex items-center gap-2 text-gray-400 hover:text-blue-500 transition-colors"
                                        >
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                            </svg>
                                        </motion.button>
                                        <motion.button
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.9 }}
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                setIsDeleteModalOpen(true);
                                            }}
                                            className="ml-2 flex items-center gap-2 text-gray-400 hover:text-red-500 transition-colors"
                                        >
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </motion.button>
                                    </>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </Link>
            </motion.div>

            <ShareModal
                isOpen={isShareModalOpen}
                onClose={() => setIsShareModalOpen(false)}
                videoId={video._id}
                videoTitle={video.title}
            />

            <DeleteConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDeleteVideo}
                title="Delete Video"
                message="Are you sure you want to delete this video? This action cannot be undone."
                isDeleting={isDeleting}
            />
        </>
    );
}
