'use client'

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { AuthProvider } from "./AuthContext";
import { useState } from "react";

const QueryProvider = ({ children }) => {
    const [queryClient] = useState(() => new QueryClient());

    return <QueryClientProvider client={queryClient}>
        <AuthProvider>
            {children}
            <Toaster position="top-center" richColors />
        </AuthProvider>
    </QueryClientProvider>;
};

export default QueryProvider;
