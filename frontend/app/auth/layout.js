'use client'
import React, { useEffect } from 'react'
import { useAuth } from '../provider/AuthContext'
import { useRouter } from 'next/navigation'
import { Loader } from 'lucide-react'

export default function AuthLayout({ children }) {
    const router = useRouter()
    const { isAuthenticated, isloading } = useAuth()
    // console.log(isAuthenticated, isloading)

    useEffect(() => {
        if (!isloading && isAuthenticated) {
            router.push("/dashboard")
        }
    }, [isloading, isAuthenticated, router])

    if (isloading) {
        <div className='flex flex-col items-center justify-center'>
            <Loader className="w-10 h-10 animate-spin" />
            <h1>Loading...</h1>
        </div>
    }

    return <div>{children}</div>
}
