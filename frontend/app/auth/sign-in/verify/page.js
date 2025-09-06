'use client'

import React, { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { useAuth } from '@/app/provider/AuthContext' // ✅ import AuthContext

const VerifyOtpPage = () => {
    const router = useRouter()
    const searchParams = useSearchParams()
    const token = searchParams.get("token")

    const [otp, setOtp] = useState("")
    const [loading, setLoading] = useState(false)
    const { login } = useAuth() // ✅ use login from AuthContext

    const handleVerify = async (e) => {
        e.preventDefault()
        setLoading(true)

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/auth/verify-2fa-otp`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ otp, token }),
            })

            const data = await res.json()
            if (!res.ok) {
                throw new Error(data.message || "OTP verification failed")
            }

            // ✅ Properly save using AuthContext
            login(data)

            toast.success("2FA verified successfully!")
            router.push("/dashboard")
        } catch (err) {
            toast.error(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-muted/40 p-4">
            <Card className="max-w-md w-full shadow-lg">
                <CardHeader>
                    <CardTitle className="text-xl font-bold text-center">
                        Two-Factor Authentication
                    </CardTitle>
                    <CardDescription className="text-center">
                        Enter the 6-digit code sent to your email.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleVerify} className="space-y-4">
                        <Input
                            type="text"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            placeholder="Enter OTP"
                            maxLength={6}
                        />
                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? "Verifying..." : "Verify OTP"}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}

export default VerifyOtpPage
