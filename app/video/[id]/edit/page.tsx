"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/utils/api-client";

export default function EditVideoPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const params = useParams();
    const id = params?.id as string;
    const queryClient = useQueryClient();

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login");
        }
    }, [status, router]);

    const { data: video, isLoading } = useQuery({
        queryKey: ["video", id],
        queryFn: () => apiClient.getVideo(id),
        enabled: !!id,
    });

    useEffect(() => {
        if (video) {
            // Verify ownership
            if (session?.user?.email && video.userId !== session.user.email) {
                router.push("/");
                return;
            }
            setTitle(video.title);
            setDescription(video.description);
        }
    }, [video, session, router]);

    const updateMutation = useMutation({
        mutationFn: async (data: { title: string; description: string }) => {
            const res = await fetch(`/api/video/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            if (!res.ok) {
                throw new Error("Failed to update video");
            }
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["video", id] });
            queryClient.invalidateQueries({ queryKey: ["videos"] }); // Invalidating list as well
            router.push(`/video/${id}`);
        },
        onError: (err: Error) => {
            setError(err.message);
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title || !description) {
            setError("Title and description are required");
            return;
        }
        updateMutation.mutate({ title, description });
    };

    if (status === "loading" || isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#0B1121]">
                <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 bg-[#0B1121]">
            <div className="max-w-3xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gray-800/50 backdrop-blur-xl rounded-2xl p-8 border border-gray-700 shadow-xl"
                >
                    <h1 className="text-3xl font-bold text-white mb-8 border-l-4 border-blue-500 pl-4">
                        Edit Video
                    </h1>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-2">
                                Title
                            </label>
                            <input
                                type="text"
                                id="title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full px-4 py-3 bg-gray-900 border border-gray-600 rounded-xl text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-2">
                                Description
                            </label>
                            <textarea
                                id="description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={6}
                                className="w-full px-4 py-3 bg-gray-900 border border-gray-600 rounded-xl text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                                required
                            />
                        </div>

                        {error && (
                            <div className="p-4 bg-red-900/20 text-red-400 rounded-lg border border-red-800">
                                {error}
                            </div>
                        )}

                        <div className="flex gap-4 pt-4">
                            <button
                                type="button"
                                onClick={() => router.back()}
                                className="flex-1 py-3 px-6 bg-gray-700 text-white rounded-xl hover:bg-gray-600 transition-colors font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={updateMutation.isPending}
                                className="flex-1 py-3 px-6 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl hover:from-blue-700 hover:to-cyan-700 transition-all font-medium shadow-lg disabled:opacity-50"
                            >
                                {updateMutation.isPending ? "Saving..." : "Save Changes"}
                            </button>
                        </div>
                    </form>
                </motion.div>
            </div>
        </div>
    );
}
