"use client";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";

export default function PageTransition({ children }) {
    const pathname = usePathname();

    if (pathname === "/") {
        return <>{children}</>;
    }

    return (
        <div className="relative min-h-screen overflow-hidden">
            <AnimatePresence mode="wait">
                <motion.div
                    key={pathname} // triggers exit + enter
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.5, ease: "easeInOut" }}
                    className="min-h-screen absolute inset-0"
                >
                    {children}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
