'use client'

import { useEffect, useState } from "react"
import { SunIcon, MoonIcon } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

export default function ThemeProvider({ children }) {
    const [theme, setTheme] = useState('light')

    useEffect(() => {
        const savedTheme = localStorage.getItem('theme')
        if (savedTheme) {
            setTheme(savedTheme)
            document.documentElement.classList.toggle('dark', savedTheme === 'dark')
        } else {
            const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
            setTheme(prefersDark ? 'dark' : 'light')
            document.documentElement.classList.toggle('dark', prefersDark)
        }
    }, [])

    const toggleTheme = () => {
        const newTheme = theme === 'light' ? 'dark' : 'light'
        setTheme(newTheme)
        localStorage.setItem('theme', newTheme)
        document.documentElement.classList.toggle('dark', newTheme === 'dark')
    }

    return (
        <>
            <button
                onClick={toggleTheme}
                className="fixed bottom-4 right-4 z-50 w-10 h-10 flex items-center justify-center rounded-full bg-primary text-primary-foreground shadow overflow-hidden"
            >
                <AnimatePresence mode="wait" initial={false}>
                    {theme === "light" ? (
                        <motion.div
                            key="moon"
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: -20, opacity: 0 }}
                            transition={{ duration: 0.25 }}
                            className="flex items-center justify-center w-full h-full"
                        >
                            <MoonIcon className="w-5 h-5" />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="sun"
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: -20, opacity: 0 }}
                            transition={{ duration: 0.25 }}
                            className="flex items-center justify-center w-full h-full"
                        >
                            <SunIcon className="w-5 h-5" />
                        </motion.div>
                    )}
                </AnimatePresence>
            </button>
            {children}
        </>
    )
}
