
"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

interface UserListModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    userIds: string[]; // List of user IDs to display
    type: "followers" | "following";
    onUpdate: () => void; // Trigger refresh of parent data
}

interface UserSummary {
    _id: string;
    email: string;
}

export default function UserListModal({ isOpen, onClose, title, userIds, type, onUpdate }: UserListModalProps) {
    const { data: session } = useSession();
    const [users, setUsers] = useState<UserSummary[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (isOpen && userIds.length > 0) {
            setIsLoading(true);
            fetch("/api/users/batch", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ids: userIds }),
            })
                .then((res) => res.json())
                .then((data) => setUsers(data.users || []))
                .catch((err) => console.error(err))
                .finally(() => setIsLoading(false));
        } else {
            setUsers([]);
        }
    }, [isOpen, userIds]);

    const handleAction = async (targetUserId: string) => {
        if (!confirm(type === "following" ? "Unfollow this user?" : "Remove this follower?")) return;

        try {
            if (type === "following") {
                // Unfollow: classic follow/unfollow toggle
                await fetch(`/api/user/${targetUserId}/follow`, { method: "POST" });
            } else {
                // Remove follower: specific API (we might need to create this or reuse logic)
                // For now, let's assume we can call an endpoint. 
                // We'll use a new query param on the follow endpoint or a new endpoint.
                await fetch(`/api/user/${targetUserId}/remove-follower`, { method: "POST" });
            }
            onUpdate();
            setUsers(users.filter(u => u._id !== targetUserId));
        } catch (err) {
            console.error(err);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md max-h-[80vh] overflow-hidden shadow-2xl flex flex-col"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h2>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                        >
                            <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-4">
                        {isLoading ? (
                            <div className="text-center py-8 text-gray-500">Loading...</div>
                        ) : users.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">No users found.</div>
                        ) : (
                            users.map((user) => (
                                <div key={user._id} className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold">
                                            {user.email[0].toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-900 dark:text-white">
                                                {user.email.split("@")[0]}
                                            </p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                {user.email}
                                            </p>
                                        </div>
                                    </div>
                                    {session?.user?.email && (
                                        <button
                                            onClick={() => handleAction(user._id)}
                                            className="text-sm font-medium text-red-500 hover:text-red-600 transition-colors px-3 py-1 bg-red-50 dark:bg-red-900/10 rounded-lg"
                                        >
                                            {type === "following" ? "Unfollow" : "Remove"}
                                        </button>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
