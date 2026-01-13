"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useState } from "react";

export default function Navigation() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    router.push("/login");
  };

  const isActive = (path: string) => pathname === path;

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/upload", label: "Upload", requiresAuth: true },
    { href: "/profile", label: "Profile", requiresAuth: true },
  ];

  if (status === "loading") {
    return null;
  }

  return (
    <>
      <nav className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-gray-200 dark:bg-[#050505]/80 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent"
              >
                Pulse
              </motion.div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-1">
              <Link href="/">
                <div className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isActive("/") ? "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300" : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"}`}>Home</div>
              </Link>
              <Link href="/shorts">
                <div className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isActive("/shorts") ? "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300" : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"}`}>Shorts</div>
              </Link>
              {session && (
                <>
                  <Link href="/upload">
                    <div className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isActive("/upload") ? "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300" : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"}`}>Upload</div>
                  </Link>
                  <Link href="/profile">
                    <div className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isActive("/profile") ? "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300" : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"}`}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                      </svg>
                    </div>
                  </Link>
                </>
              )}
              {!session && (
                <>
                  <Link href="/login">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="ml-4 px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 transition-colors"
                    >
                      Login
                    </motion.button>
                  </Link>
                  <Link href="/register">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="ml-2 px-4 py-2 rounded-lg text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 transition-all"
                    >
                      Sign Up
                    </motion.button>
                  </Link>
                </>
              )}
            </div>

            {/* Mobile Header Actions (Just Sign Out if logged in, else Login) */}
            <div className="md:hidden flex items-center">
              {session ? (
                <button onClick={handleSignOut} className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-red-500">Sign Out</button>
              ) : (
                <Link href="/login" className="text-sm font-medium text-blue-600 dark:text-blue-400">Login</Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 w-full bg-white dark:bg-[#050505] border-t border-gray-200 dark:border-gray-800 z-50 pb-safe">
        <div className="grid grid-cols-4 h-16">
          <Link href="/" className="flex flex-col items-center justify-center space-y-1">
            <svg className={`w-6 h-6 ${isActive("/") ? "text-blue-600 dark:text-blue-400" : "text-gray-500 dark:text-gray-400"}`} fill={isActive("/") ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span className={`text-[10px] ${isActive("/") ? "text-blue-600 dark:text-blue-400 font-medium" : "text-gray-500 dark:text-gray-400"}`}>Home</span>
          </Link>

          <Link href="/shorts" className="flex flex-col items-center justify-center space-y-1">
            <svg className={`w-6 h-6 ${isActive("/shorts") ? "text-blue-600 dark:text-blue-400" : "text-gray-500 dark:text-gray-400"}`} fill={isActive("/shorts") ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
            </svg>
            <span className={`text-[10px] ${isActive("/shorts") ? "text-blue-600 dark:text-blue-400 font-medium" : "text-gray-500 dark:text-gray-400"}`}>Shorts</span>
          </Link>

          {session ? (
            <>
              <Link href="/upload" className="flex flex-col items-center justify-center space-y-1">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-full flex items-center justify-center text-white shadow-lg mb-1">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
              </Link>

              <Link href="/profile" className="flex flex-col items-center justify-center space-y-1">
                <svg className={`w-6 h-6 ${isActive("/profile") ? "text-blue-600 dark:text-blue-400" : "text-gray-500 dark:text-gray-400"}`} fill={isActive("/profile") ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className={`text-[10px] ${isActive("/profile") ? "text-blue-600 dark:text-blue-400 font-medium" : "text-gray-500 dark:text-gray-400"}`}>Profile</span>
              </Link>
            </>
          ) : (
            <Link href="/login" className="flex flex-col items-center justify-center space-y-1 col-span-2">
              <svg className="w-6 h-6 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
              <span className="text-[10px] text-gray-500 dark:text-gray-400">Login</span>
            </Link>
          )}
        </div>
      </div>
    </>
  );
}
