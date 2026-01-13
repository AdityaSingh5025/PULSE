"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, useMotionValue, useSpring } from "framer-motion";
import apiClient from "@/utils/api-client";
import { upload } from "@imagekit/next";
import { useUploadStore } from "@/utils/upload-store";
import { toast } from "react-hot-toast";

export default function UploadPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const queryClient = useQueryClient();

  // Zustand store
  const {
    videoUrl,
    thumbnailUrl,
    videoProgress,
    thumbnailProgress,
    isVideoUploading,
    isThumbnailUploading,
    videoError,
    thumbnailError,
    title,
    description,
    setVideoUrl,
    setThumbnailUrl,
    setVideoProgress,
    setThumbnailProgress,
    setIsVideoUploading,
    setIsThumbnailUploading,
    setVideoError,
    setThumbnailError,
    setTitle,
    setDescription,
    resetVideoUpload,
    resetThumbnailUpload,
    resetAll,
  } = useUploadStore();


  const [isDraggingVideo, setIsDraggingVideo] = useState(false);
  const [isDraggingThumbnail, setIsDraggingThumbnail] = useState(false);

  // Mouse tracking for animations
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const smoothMouseX = useSpring(mouseX, { damping: 20, stiffness: 100 });
  const smoothMouseY = useSpring(mouseY, { damping: 20, stiffness: 100 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [mouseX, mouseY]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  const uploadMutation = useMutation({
    mutationFn: async (data: {
      title: string;
      description: string;
      videoUrl: string;
      thumbnailUrl?: string; // Optional
    }) => {
      // API client should handle the optional field correctly or we verify it
      return apiClient.createVideo(data as any);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["videos"] });
      resetAll();
      toast.success("Video published successfully!");
      router.push("/");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Something went wrong");
    },
  });

  const handleFileUpload = async (
    file: File,
    folder: string,
    isVideo: boolean
  ) => {
    try {
      if (isVideo) {
        setIsVideoUploading(true);
        setVideoError(null);
        setVideoProgress(0);
      } else {
        setIsThumbnailUploading(true);
        setThumbnailError(null);
        setThumbnailProgress(0);
      }

      // Get auth params from API
      const authResponse = await fetch("/api/imagekit-auth");
      if (!authResponse.ok) {
        const errorText = await authResponse.text();
        throw new Error(`Authentication failed: ${errorText}`);
      }
      const { signature, expire, token, publicKey } = await authResponse.json();

      // Upload file
      const uploadResponse = await upload({
        file,
        fileName: file.name,
        folder,
        signature,
        expire,
        token,
        publicKey,
        onProgress: (event) => {
          const progress = (event.loaded / event.total) * 100;
          if (isVideo) {
            setVideoProgress(progress);
          } else {
            setThumbnailProgress(progress);
          }
        },
      });

      if (uploadResponse && uploadResponse.url) {
        if (isVideo) {
          setVideoUrl(uploadResponse.url);
        } else {
          setThumbnailUrl(uploadResponse.url);
        }
      }

      if (isVideo) {
        setIsVideoUploading(false);
      } else {
        setIsThumbnailUploading(false);
      }
    } catch (error: any) {
      const errorMsg = error.message || "Upload failed";
      if (isVideo) {
        setVideoError(errorMsg);
        setIsVideoUploading(false);
        setVideoProgress(0);
      } else {
        setThumbnailError(errorMsg);
        setIsThumbnailUploading(false);
        setThumbnailProgress(0);
      }
    }
  };

  const handleVideoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 500 * 1024 * 1024) {
      setVideoError("Video file size should be less than 500MB");
      return;
    }

    await handleFileUpload(file, "/videos", true);
  };

  const handleThumbnailChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      setThumbnailError("Only JPEG, PNG, and WebP images are allowed");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setThumbnailError("Thumbnail file size should be less than 5MB");
      return;
    }

    await handleFileUpload(file, "/thumbnails", false);
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent, type: "video" | "thumbnail") => {
    e.preventDefault();
    if (type === "video") {
      setIsDraggingVideo(true);
    } else {
      setIsDraggingThumbnail(true);
    }
  };

  const handleDragLeave = (type: "video" | "thumbnail") => {
    if (type === "video") {
      setIsDraggingVideo(false);
    } else {
      setIsDraggingThumbnail(false);
    }
  };

  const handleDrop = async (
    e: React.DragEvent,
    type: "video" | "thumbnail"
  ) => {
    e.preventDefault();
    if (type === "video") {
      setIsDraggingVideo(false);
    } else {
      setIsDraggingThumbnail(false);
    }

    const file = e.dataTransfer.files[0];
    if (!file) return;

    if (type === "video") {
      if (file.size > 500 * 1024 * 1024) {
        setVideoError("Video file size should be less than 500MB");
        return;
      }
      await handleFileUpload(file, "/videos", true);
    } else {
      const validTypes = ["image/jpeg", "image/png", "image/webp"];
      if (!validTypes.includes(file.type)) {
        setThumbnailError("Only JPEG, PNG, and WebP images are allowed");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setThumbnailError("Thumbnail file size should be less than 5MB");
        return;
      }
      await handleFileUpload(file, "/thumbnails", false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate only videoUrl, thumbnail is optional now
    if (!title || !description || !videoUrl) {
      toast.error(
        "Please fill in all required fields (Title, Description, Video)"
      );
      return;
    }

    uploadMutation.mutate({
      title,
      description,
      videoUrl,
      thumbnailUrl: thumbnailUrl || "",
    });
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-richblack-900">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-400 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 bg-[#0B1121] relative overflow-hidden">
      {/* Background Shapes */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-blue-600/10 rounded-full blur-3xl opacity-50"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl opacity-50"></div>
      </div>

      <div className="max-w-4xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden border border-gray-700"
        >
          {/* Header */}
          <div className="relative bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-600 p-8 sm:p-12 overflow-hidden">
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="relative z-10 text-center"
            >
              <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
                Upload Video
              </h1>
              <p className="text-blue-100 text-lg">
                Share your creativity with the world
              </p>
            </motion.div>
          </div>

          <form onSubmit={handleSubmit} className="p-8 sm:p-12 space-y-8">
            {/* Title */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <label
                htmlFor="title"
                className="block text-sm font-semibold text-gray-300 mb-3"
              >
                Title *
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-5 py-4 rounded-xl border-2 border-gray-700 bg-gray-900 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-gray-500"
                placeholder="Give your video an awesome title..."
                required
              />
            </motion.div>

            {/* Description */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <label
                htmlFor="description"
                className="block text-sm font-semibold text-gray-300 mb-3"
              >
                Description *
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={6}
                className="w-full px-5 py-4 rounded-xl border-2 border-gray-700 bg-gray-900 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none placeholder:text-gray-500"
                placeholder="Tell viewers what your video is about..."
                required
              />
            </motion.div>

            {/* Video Upload */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <label className="block text-sm font-semibold text-gray-300 mb-3">
                Video File *
              </label>
              <div
                onDragOver={(e) => handleDragOver(e, "video")}
                onDragLeave={() => handleDragLeave("video")}
                onDrop={(e) => handleDrop(e, "video")}
                className={`relative border-3 border-dashed rounded-2xl p-8 text-center transition-all duration-300 ${isDraggingVideo
                  ? "border-blue-500 bg-blue-900/20 scale-105"
                  : videoUrl
                    ? "border-green-400 bg-green-900/20"
                    : "border-gray-700 hover:border-blue-600"
                  }`}
              >
                {videoUrl ? (
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="space-y-4"
                  >
                    <div className="flex items-center justify-center gap-2 text-green-400 font-semibold text-lg">
                      <svg
                        className="w-6 h-6"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Video uploaded successfully!
                    </div>
                    <div className="flex items-center justify-center gap-4">
                      <a
                        href={videoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-400 hover:underline font-medium"
                      >
                        Preview Video
                      </a>
                      <button
                        type="button"
                        onClick={resetVideoUpload}
                        className="text-sm px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-all shadow-md hover:shadow-lg"
                      >
                        Change Video
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <>
                    <input
                      type="file"
                      accept="video/*"
                      onChange={handleVideoChange}
                      className="hidden"
                      id="video-upload"
                      disabled={isVideoUploading}
                    />
                    <label
                      htmlFor="video-upload"
                      className="cursor-pointer block"
                    >
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="inline-flex flex-col items-center"
                      >
                        <div className="w-20 h-20 mb-4 rounded-full bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center shadow-lg">
                          <svg
                            className="w-10 h-10 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                            />
                          </svg>
                        </div>
                        <span className="text-lg font-semibold text-gray-300 mb-2">
                          {isVideoUploading
                            ? "Uploading..."
                            : "Click to upload or drag & drop"}
                        </span>
                        <span className="text-sm text-gray-400">
                          MP4, WebM, or OGG (max 500MB)
                        </span>
                      </motion.div>
                    </label>
                    {isVideoUploading && (
                      <div className="mt-6">
                        <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
                          <div
                            className="h-3 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-full transition-all duration-300 ease-out"
                            style={{ width: `${Math.round(videoProgress)}%` }}
                          />
                        </div>
                        <p className="text-sm text-gray-400 mt-2">
                          {Math.round(videoProgress)}% uploaded
                        </p>
                      </div>
                    )}
                    {videoError && (
                      <p className="text-sm text-red-400 mt-3">
                        {videoError}
                      </p>
                    )}
                  </>
                )}
              </div>
            </motion.div>

            {/* Thumbnail Upload (Optional) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              <label className="block text-sm font-semibold text-gray-300 mb-3">
                Thumbnail Image <span className="text-gray-500 font-normal">(Optional)</span>
              </label>
              <div
                onDragOver={(e) => handleDragOver(e, "thumbnail")}
                onDragLeave={() => handleDragLeave("thumbnail")}
                onDrop={(e) => handleDrop(e, "thumbnail")}
                className={`relative border-3 border-dashed rounded-2xl p-8 text-center transition-all duration-300 ${isDraggingThumbnail
                  ? "border-blue-500 bg-blue-900/20 scale-105"
                  : thumbnailUrl
                    ? "border-green-400 bg-green-900/20"
                    : "border-gray-700 hover:border-blue-600"
                  }`}
              >
                {thumbnailUrl ? (
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="space-y-4"
                  >
                    <div className="flex items-center justify-center gap-2 text-green-400 font-semibold text-lg">
                      <svg
                        className="w-6 h-6"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Thumbnail uploaded successfully!
                    </div>
                    <img
                      src={thumbnailUrl}
                      alt="Thumbnail preview"
                      className="max-w-full h-56 object-cover rounded-xl mx-auto shadow-lg"
                    />
                    <button
                      type="button"
                      onClick={resetThumbnailUpload}
                      className="text-sm px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-all shadow-md hover:shadow-lg"
                    >
                      Change Thumbnail
                    </button>
                  </motion.div>
                ) : (
                  <>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleThumbnailChange}
                      className="hidden"
                      id="thumbnail-upload"
                      disabled={isThumbnailUploading}
                    />
                    <label
                      htmlFor="thumbnail-upload"
                      className="cursor-pointer block"
                    >
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="inline-flex flex-col items-center"
                      >
                        <div className="w-20 h-20 mb-4 rounded-full bg-gradient-to-br from-cyan-600 to-blue-600 flex items-center justify-center shadow-lg">
                          <svg
                            className="w-10 h-10 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                        </div>
                        <span className="text-lg font-semibold text-gray-300 mb-2">
                          {isThumbnailUploading
                            ? "Uploading..."
                            : "Click to upload or drag & drop"}
                        </span>
                        <span className="text-sm text-gray-400">
                          JPEG, PNG, or WebP (max 5MB)
                        </span>
                      </motion.div>
                    </label>
                    {isThumbnailUploading && (
                      <div className="mt-6">
                        <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
                          <div
                            className="h-3 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-full transition-all duration-300 ease-out"
                            style={{ width: `${Math.round(thumbnailProgress)}%` }}
                          />
                        </div>
                        <p className="text-sm text-gray-400 mt-2">
                          {Math.round(thumbnailProgress)}% uploaded
                        </p>
                      </div>
                    )}
                    {thumbnailError && (
                      <p className="text-sm text-red-400 mt-3">
                        {thumbnailError}
                      </p>
                    )}
                  </>
                )}
              </div>
            </motion.div>


            {/* Submit Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="flex flex-col sm:flex-row gap-4 pt-4"
            >
              <motion.button
                type="button"
                onClick={() => {
                  resetAll();
                  router.push("/");
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex-1 px-8 py-4 border-2 border-gray-600 text-gray-300 rounded-xl hover:bg-gray-700 transition-all font-semibold"
              >
                Cancel
              </motion.button>
              <motion.button
                type="submit"
                disabled={
                  uploadMutation.isPending ||
                  !videoUrl ||
                  isVideoUploading ||
                  isThumbnailUploading
                }
                whileHover={{
                  scale:
                    uploadMutation.isPending ||
                      isVideoUploading ||
                      isThumbnailUploading
                      ? 1
                      : 1.02,
                }}
                whileTap={{
                  scale:
                    uploadMutation.isPending ||
                      isVideoUploading ||
                      isThumbnailUploading
                      ? 1
                      : 0.98,
                }}
                className="flex-1 px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl hover:from-blue-700 hover:to-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold shadow-lg hover:shadow-xl"
              >
                {uploadMutation.isPending
                  ? "Publishing..."
                  : isVideoUploading || isThumbnailUploading
                    ? "Uploading..."
                    : "Publish Video"}
              </motion.button>
            </motion.div>
          </form>
        </motion.div>

        {/* Upload Status Indicator */}
        {(isVideoUploading || isThumbnailUploading) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 p-6 bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-lg border border-cyan-900/50"
          >
            <div className="flex items-center gap-3 mb-4">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="w-6 h-6 border-3 border-blue-600 border-t-transparent rounded-full"
              />
              <p className="text-sm font-semibold text-gray-300">
                Upload in progress - You can navigate away, your upload will
                continue in the background
              </p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
