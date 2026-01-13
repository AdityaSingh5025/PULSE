"use client";

import { motion } from "framer-motion";

export default function ModernLoader() {
    return (
        <div className="flex items-center justify-center p-4">
            <div className="relative w-16 h-16">
                <motion.span
                    className="absolute top-0 left-0 w-full h-full border-4 border-blue-500 rounded-full opacity-20"
                    initial={{ scale: 0.8, opacity: 0.2 }}
                    animate={{ scale: 1.2, opacity: 0 }}
                    transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: "easeOut",
                    }}
                />
                <motion.span
                    className="absolute top-0 left-0 w-full h-full border-4 border-t-cyan-400 border-r-blue-500 border-b-purple-500 border-l-transparent rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{
                        duration: 1,
                        repeat: Infinity,
                        ease: "linear",
                    }}
                />
                <motion.div
                    className="absolute inset-0 m-auto w-3 h-3 bg-gradient-to-tr from-cyan-400 to-blue-600 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.8)]"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                />
            </div>
        </div>
    );
}
