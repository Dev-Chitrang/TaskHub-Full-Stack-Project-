"use client"
import { motion } from "framer-motion";
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="w-full h-screen flex flex-col items-center justify-center bg-gradient-to-br">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-center max-w-2xl px-6"
      >
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600"
        >
          Welcome to TaskHub
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.8 }}
          className="text-gray-600 text-lg mb-8"
        >
          Organize your workspaces, manage projects, assign tasks, and collaborate in real-time.
          Stay productive with insights, notifications, and seamless teamwork.
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9, duration: 0.8 }}
          className="flex items-center justify-center gap-4"
        >
          <Link href="/auth/sign-in">
            <Button size="lg" className="hover:scale-105 transition-transform">Login</Button>
          </Link>
          <Link href="/auth/sign-up">
            <Button size="lg" variant="outline" className="hover:scale-105 transition-transform">Sign Up</Button>
          </Link>
        </motion.div>
      </motion.div>
    </div>
  )
}
