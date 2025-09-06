'use client'

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    const queryClient = useQueryClient();

    useEffect(() => {
        if (typeof window === "undefined") return;

        const storedUser = localStorage.getItem("user");
        const storedToken = localStorage.getItem("token");

        if (storedUser && storedToken) {
            setUser(JSON.parse(storedUser));
            setToken(storedToken);
            setIsAuthenticated(true);
        }
        setIsLoading(false);
    }, []);

    // ✅ Global redirect for logged-out users
    useEffect(() => {
        if (isLoading) return;

        const currentPath = window.location.pathname;
        const inviteLink = localStorage.getItem("inviteLink");

        // Redirect only if not authenticated and not already on an /auth page
        if (!isAuthenticated && !currentPath.startsWith("/auth")) {
            if (inviteLink) {
                // Keep original behavior: maybe later used for deep-linking
                router.replace("/auth/sign-in");
            } else {
                // If no inviteLink, redirect to home page
                router.replace("/");
            }
        }
    }, [isLoading, isAuthenticated, router]);

    const login = (data) => {
        if (typeof window === "undefined") return;

        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));

        setUser(data.user);
        setToken(data.token);
        setIsAuthenticated(true);

        const inviteLink = localStorage.getItem("inviteLink");
        if (inviteLink) {
            router.replace("/dashboard");
            setTimeout(() => {
                router.push(inviteLink);
            }, 2000)
            localStorage.removeItem("inviteLink");
        } else {
            router.replace("/dashboard");
        }
    };

    const logout = () => {
        if (typeof window === "undefined") return;

        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("inviteLink");
        setUser(null);
        setToken(null);
        setIsAuthenticated(false);
        queryClient.clear();
        router.replace("/auth/sign-in");
    };

    return (
        <AuthContext.Provider value={{ user, token, isAuthenticated, isLoading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error("useAuth must be used within an AuthProvider");
    return context;
};
