"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import VideoCard from "@/app/components/VideoCard";
import ModernLoader from "@/app/components/ModernLoader";
import UserListModal from "@/app/components/UserListModal";
import EditProfileModal from "@/app/components/EditProfileModal";
import { toast } from "react-hot-toast";
import { videoInterface } from "@/model/Vdeo";

interface User {
  _id: string;
  email: string;
  createdAt?: string;
  followersCount: number;
  followingCount: number;
}

interface ProfileResponse {
  user: User;
  videos: videoInterface[];
  stats: {
    totalVideos: number;
    totalViews: number;
    totalLikes: number;
  };
}

async function fetchProfile() {
  const response = await fetch("/api/profile");
  if (!response.ok) {
    throw new Error("Failed to fetch profile");
  }
  return response.json();
}

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const { data, isLoading, error } = useQuery<ProfileResponse>({
    queryKey: ["profile"],
    queryFn: fetchProfile,
    enabled: status === "authenticated",
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"followers" | "following">("followers");
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0B1121]">
        <ModernLoader />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-blue-50 dark:bg-[#050505]">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Error loading profile
          </h2>
          <button
            onClick={() => router.push("/")}
            className="mt-4 px-6 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-all"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  const { user, videos, stats } = data;

  const openModal = (type: "followers" | "following") => {
    setModalType(type);
    setModalOpen(true);
  };

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 bg-blue-50 dark:bg-[#050505]">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Profile Header Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden"
        >
          <div className="bg-gradient-to-r from-blue-600 to-cyan-600 p-8 sm:p-12 relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 left-0 w-full h-full opacity-10">
              <div className="absolute right-0 top-0 w-64 h-64 bg-white rounded-full translate-x-1/3 -translate-y-1/3 blur-3xl" />
              <div className="absolute left-0 bottom-0 w-64 h-64 bg-white rounded-full -translate-x-1/3 translate-y-1/3 blur-3xl" />
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-8"
            >
              {/* Avatar */}
              <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-4xl sm:text-5xl font-bold text-white border-4 border-white/30 shadow-2xl">
                {user.email.charAt(0).toUpperCase()}
              </div>

              {/* User Info */}
              <div className="flex-1 text-center sm:text-left text-white">
                <h1 className="text-3xl sm:text-4xl font-bold mb-2">
                  {user.email.split("@")[0]}
                </h1>
                <p className="text-blue-100 text-lg mb-4">{user.email}</p>

                {/* Follower Stats */}
                <div className="flex items-center justify-center sm:justify-start gap-6 text-sm font-medium">
                  <button
                    onClick={() => openModal("followers")}
                    className="bg-white/10 px-4 py-2 rounded-lg backdrop-blur-sm hover:bg-white/20 transition-colors text-left"
                  >
                    <span className="text-2xl font-bold block">{user.followersCount}</span>
                    <span className="text-blue-200">Followers</span>
                  </button>
                  <button
                    onClick={() => openModal("following")}
                    className="bg-white/10 px-4 py-2 rounded-lg backdrop-blur-sm hover:bg-white/20 transition-colors text-left"
                  >
                    <span className="text-2xl font-bold block">{user.followingCount}</span>
                    <span className="text-blue-200">Following</span>
                  </button>
                </div>

                {/* Sign Out Button */}
                <div className="mt-6 flex flex-wrap gap-4 justify-center sm:justify-start">
                  <button
                    onClick={() => setIsEditProfileOpen(true)}
                    className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all shadow-lg hover:shadow-blue-500/30"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    <span>Edit Profile</span>
                  </button>
                  <button
                    onClick={() => signOut({ callbackUrl: "/login" })}
                    className="flex items-center gap-2 px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg backdrop-blur-sm transition-all border border-white/20"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-blue-100 dark:border-gray-700"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-500 dark:text-gray-400 font-medium">Total Videos</h3>
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full text-blue-600 dark:text-blue-400">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">
              {stats.totalVideos}
            </div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-cyan-100 dark:border-gray-700"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-500 dark:text-gray-400 font-medium">Total Views</h3>
              <div className="p-3 bg-cyan-100 dark:bg-cyan-900/30 rounded-full text-cyan-600 dark:text-cyan-400">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">
              {stats.totalViews}
            </div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-indigo-100 dark:border-gray-700"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-500 dark:text-gray-400 font-medium">Total Likes</h3>
              <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-full text-indigo-600 dark:text-indigo-400">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">
              {stats.totalLikes}
            </div>
          </motion.div>
        </div>

        {/* My Videos Section */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            My Videos
            <span className="text-sm font-normal text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-full">
              {videos.length}
            </span>
          </h2>

          {videos.length === 0 ? (
            <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-dashed border-gray-300 dark:border-gray-700">
              <div className="mb-4 text-blue-500">
                <svg className="w-16 h-16 mx-auto opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-xl font-medium text-gray-900 dark:text-white mb-2">No videos yet</p>
              <p className="text-gray-500 dark:text-gray-400 mb-6">Upload your first video to get started!</p>
              <button
                onClick={() => router.push("/upload")}
                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-all shadow-md"
              >
                Upload Video
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {videos.map((video, index) => (
                <VideoCard key={String(video._id)} video={video as any} index={index} />
              ))}
            </div>
          )}
        </div>
        {/* Delete Account Section */}
        <div className="mt-16 border-t border-gray-800 pt-8 mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-center bg-red-900/10 border border-red-900/30 p-6 rounded-xl gap-4">
            <div>
              <h3 className="text-xl font-bold text-red-500 mb-2">Danger Zone</h3>
              <p className="text-gray-400">Permanently delete your account and all of your content.</p>
            </div>
            <button
              onClick={async () => {
                if (confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
                  try {
                    const res = await fetch("/api/user/delete", { method: "DELETE" });
                    if (res.ok) {
                      toast.success("Account deleted");
                      signOut({ callbackUrl: "/login" });
                    } else {
                      toast.error("Failed to delete account");
                    }
                  } catch (e) {
                    toast.error("Something went wrong");
                  }
                }
              }}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors whitespace-nowrap"
            >
              Delete Account
            </button>
          </div>
        </div>

      </div>

      {/* Social Modal */}
      {modalOpen && (
        <UserListModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title={modalType === "followers" ? "Followers" : "Following"}
          type={modalType}
          userIds={modalType === "followers" ? (user as any).followers || [] : (user as any).following || []}
          onUpdate={() => window.location.reload()}
        />
      )}

      {/* Edit Profile Modal */}
      {isEditProfileOpen && (
        <EditProfileModal
          isOpen={isEditProfileOpen}
          onClose={() => setIsEditProfileOpen(false)}
          user={user}
          onUpdate={() => window.location.reload()}
        />
      )}
    </div>
  );
}
