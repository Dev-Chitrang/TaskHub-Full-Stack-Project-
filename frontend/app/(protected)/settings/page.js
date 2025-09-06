"use client"

import { useUpdate2FA, useChangePassword } from '@/app/hooks/use-user'
import { Switch } from '@/components/ui/switch'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { useAuth } from '@/app/provider/AuthContext'
import { toast } from "sonner"
import React, { useState, useEffect } from 'react'
import BackButton from '@/components/BackButton'
import { changePasswordSchema } from '@/lib/schema'

const Settings = () => {
    const { logout, token } = useAuth()
    const { mutate: update2FA, isLoading } = useUpdate2FA()
    const { mutate: changePassword, isPending: isChangingPassword } = useChangePassword()
    const [enabled, setEnabled] = useState(false)

    const passwordForm = useForm({
        resolver: zodResolver(changePasswordSchema),
        defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" }
    })

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/users/profile`, {
                    headers: { Authorization: `Bearer ${token}` },
                })
                if (res.ok) {
                    const data = await res.json()
                    setEnabled(data.is2FAEnabled ?? false)
                } else {
                    toast.error("Failed to fetch profile")
                }
            } catch (err) {
                console.error(err)
                toast.error("Error fetching profile")
            }
        }
        if (token) fetchProfile()
    }, [token])

    const toggle2FA = (value) => {
        setEnabled(value)
        update2FA(
            { is2FAEnabled: value },
            {
                onSuccess: () => {
                    toast.success(`2FA ${value ? "enabled" : "disabled"}. Please log in again.`)
                    logout()
                },
                onError: () => {
                    toast.error("Failed to update 2FA")
                    setEnabled(!value)
                }
            }
        )
    }

    const handlePasswordChange = (values) => {
        changePassword(values, {
            onSuccess: () => {
                toast.success("Password updated. You will be logged out.")
                passwordForm.reset()
                logout()
            },
            onError: (error) => {
                console.log(error)
                toast.error(error?.response?.data?.error || error?.data?.message || "Failed to update password")
            }
        })
    }

    return (
        <div className="container mx-auto max-w-5xl space-y-4">
            <BackButton />
            {/* Security Section */}
            <Card>
                <CardHeader>
                    <CardTitle>Security</CardTitle>
                    <CardDescription>Update your password.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...passwordForm}>
                        <form className="grid gap-4" onSubmit={passwordForm.handleSubmit(handlePasswordChange)}>
                            {["currentPassword", "newPassword", "confirmPassword"].map((fieldName) => (
                                <FormField
                                    key={fieldName}
                                    control={passwordForm.control}
                                    name={fieldName}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>
                                                {fieldName === "currentPassword"
                                                    ? "Current Password"
                                                    : fieldName === "newPassword"
                                                        ? "New Password"
                                                        : "Confirm Password"}
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="password"
                                                    {...field}
                                                    disabled={isChangingPassword}
                                                    placeholder={
                                                        fieldName === "currentPassword"
                                                            ? "Enter your current password"
                                                            : fieldName === "newPassword"
                                                                ? "Enter your new password"
                                                                : "Confirm password"
                                                    }
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            ))}
                            <Button type="submit" disabled={isChangingPassword} className="w-fit">
                                {isChangingPassword ? "Updating..." : "Update Password"}
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>

            {/* 2FA Section */}
            <Card>
                <CardHeader>
                    <CardTitle>Two-Factor Authentication</CardTitle>
                    <CardDescription>Increase account security by enabling 2FA.</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-between">
                    <span className="text-sm font-medium">Enable Two-Factor Authentication</span>
                    <Switch
                        checked={enabled}
                        onCheckedChange={toggle2FA}
                        disabled={isLoading}
                    />
                </CardContent>
            </Card>
        </div>
    )
}

export default Settings
