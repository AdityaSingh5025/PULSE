
"use client";

import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import ShareModal from "@/app/components/ShareModal";
import ModernLoader from "@/app/components/ModernLoader";
import { videoInterface } from "@/model/Vdeo";
import CommentsDrawer from "@/app/components/CommentsDrawer";

interface VideosResponse {
    videos: videoInterface[];
}

const apiClient = {
    getVideos: async () => {
        const response = await fetch("/api/video");
        if (!response.ok) {
            throw new Error("Failed to fetch videos");
        }
        return response.json();
    },
};

export default function ShortsPage() {
    const { data: session } = useSession();
    const router = useRouter();
    const [currentindex, setCurrentIndex] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);

    const { data, isLoading } = useQuery<VideosResponse>({
        queryKey: ["videos"],
        queryFn: () => apiClient.getVideos(),
    });

    const videos = data?.videos || [];

    // Handle intersection observer to update current index
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        const index = Number(entry.target.getAttribute("data-index"));
                        setCurrentIndex(index);
                    }
                });
            },
            {
                threshold: 0.6,
            }
        );

        const elements = container.querySelectorAll(".short-container");
        elements.forEach((el) => observer.observe(el));

        return () => observer.disconnect();
    }, [videos]);

    if (isLoading) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-[#0B1121]">
                <ModernLoader />
            </div>
        );
    }

    return (
        <div
            ref={containerRef}
            className="h-[calc(100vh-64px)] w-full overflow-y-scroll snap-y snap-mandatory bg-black no-scrollbar"
        >
            {videos.map((video, index) => (
                <ShortPlayer
                    key={String(video._id)}
                    video={video}
                    isActive={index === currentindex}
                    index={index}
                />
            ))}
        </div>
    );
}

function ShortPlayer({ video, isActive, index }: { video: videoInterface; isActive: boolean; index: number }) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isPlaying, setIsPlaying] = useState(false); // Start paused, let effect handle it
    const [isMuted, setIsMuted] = useState(true); // Default muted for better autoplay support
    const { data: session } = useSession();
    const [likes, setLikes] = useState(video.likes?.length || 0);
    const [isLiked, setIsLiked] = useState(false);
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [isCommentsOpen, setIsCommentsOpen] = useState(false);

    // Handle auto-play/pause based on active state
    useEffect(() => {
        if (isActive) {
            const playPromise = videoRef.current?.play();
            if (playPromise !== undefined) {
                playPromise
                    .then(() => setIsPlaying(true))
                    .catch(() => {
                        // Auto-play might be blocked
                        setIsPlaying(false);
                        setIsMuted(true); // Try muting if autoplay failed (browser policy)
                    });
            }
        } else {
            videoRef.current?.pause();
            if (videoRef.current) {
                videoRef.current.currentTime = 0;
            }
            setIsPlaying(false);
        }
    }, [isActive]);

    const togglePlay = () => {
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause();
            } else {
                videoRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    const handleLike = async () => {
        if (!session) return; // Or redirect to login

        // Toggle state locally
        const newIsLiked = !isLiked;
        setIsLiked(newIsLiked);
        setLikes(prev => newIsLiked ? prev + 1 : prev - 1);

        try {
            await fetch(`/api/video/${video._id}/like`, { method: "POST" });
        } catch (error) {
            // Revert on error
            setIsLiked(!newIsLiked);
            setLikes(prev => newIsLiked ? prev - 1 : prev + 1);
        }
    };

    // Check initial like status (mock check since we don't have isLiked in video object without user context)
    // In a real app we'd need to fetch this or include it in the video object for the user
    useEffect(() => {
        if (session?.user?.email && video.likes?.includes(session.user.email)) {
            setIsLiked(true);
        }
    }, [session, video.likes]);


    const handleFollow = async () => {
        if (!session || !video.userId) return;

        // Optimistic UI update could happen here if we tracked isFollowing state
        // For now, simple implementation
        try {
            const res = await fetch("/api/user/follow", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ targetUserId: video.userId }),
            });
            if (res.ok) {
                const data = await res.json();
                // Ideally show a toast or change button state
                alert(data.isFollowing ? "Followed!" : "Unfollowed!");
            }
        } catch (error) {
            console.error("Failed to follow", error);
        }
    };

    return (
        <div
            data-index={index}
            className="short-container relative h-full w-full max-w-md mx-auto snap-start flex items-center justify-center bg-[#050505]"
        >
            {/* Video */}
            <div
                onClick={togglePlay}
                className="relative w-full h-full cursor-pointer"
            >
                <video
                    ref={videoRef}
                    src={video.videoUrl}
                    className="w-full h-full object-cover"
                    poster={video.thumbnailUrl}
                    loop
                    playsInline
                    muted={isMuted}
                />

                {/* Play/Pause Overlay */}
                {!isPlaying && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                        <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                            <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M8 5v14l11-7z" />
                            </svg>
                        </div>
                    </div>
                )}
            </div>

            {/* Right Side Actions */}
            <div className="absolute right-4 bottom-24 flex flex-col gap-6 items-center z-10">
                <div className="flex flex-col items-center gap-1">
                    <button
                        onClick={handleLike}
                        className="p-3 bg-black/40 backdrop-blur-md rounded-full hover:bg-black/60 transition-all"
                    >
                        <svg className={`w-8 h-8 ${isLiked ? "text-red-500 fill-current" : "text-white"}`} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={isLiked ? 0 : 2} fill={isLiked ? "currentColor" : "none"}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                    </button>
                    <span className="text-white text-xs font-bold drop-shadow-md">{likes}</span>
                </div>

                <div className="flex flex-col items-center gap-1">
                    <button
                        onClick={() => setIsCommentsOpen(true)}
                        className="p-3 bg-black/40 backdrop-blur-md rounded-full hover:bg-black/60 transition-all"
                    >
                        <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                    </button>
                    <span className="text-white text-xs font-bold drop-shadow-md">{video.comments?.length || 0}</span>
                </div>

                <button
                    onClick={() => setIsShareModalOpen(true)}
                    className="p-3 bg-black/40 backdrop-blur-md rounded-full hover:bg-black/60 transition-all"
                >
                    <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                </button>
            </div>

            {/* Bottom Info */}
            <div className="absolute left-4 right-16 bottom-6 z-10 w-full px-4 text-left">
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold border-2 border-white">
                        {video.userName?.[0]?.toUpperCase() || "C"}
                    </div>
                    <span className="text-white font-bold text-shadow-sm truncate">{video.userName || "Creator"}</span>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleFollow();
                        }}
                        className="px-3 py-1 bg-white/20 backdrop-blur-md hover:bg-white/30 text-white text-xs font-bold rounded-full border border-white/40 transition-all"
                    >
                        Follow
                    </button>
                </div>
                <h3 className="text-white font-semibold mb-2 line-clamp-1 drop-shadow-md">{video.title}</h3>
                <p className="text-white/80 text-sm line-clamp-2 drop-shadow-md">{video.description}</p>
            </div>

            <ShareModal
                isOpen={isShareModalOpen}
                onClose={() => setIsShareModalOpen(false)}
                videoId={String(video._id)}
                videoTitle={video.title}
            />

            <CommentsDrawer
                isOpen={isCommentsOpen}
                onClose={() => setIsCommentsOpen(false)}
                videoId={String(video._id)}
            />
        </div>
    );
}
