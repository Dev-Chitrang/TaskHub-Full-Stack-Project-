'use client'

import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { signInSchema } from '@/lib/schema'
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { useLoginMutation } from '@/app/hooks/use-Auth'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/app/provider/AuthContext'

const SignIn = () => {
    const router = useRouter()

    const form = useForm({
        resolver: zodResolver(signInSchema),
        defaultValues: {
            email: '',
            password: '',
        },
    })

    const { login } = useAuth()
    const { mutate, isPending } = useLoginMutation()

    const handleOnSubmit = (data) => {
        mutate(data, {
            onSuccess: (res) => {
                if (res.twoFactorAuth) {
                    toast.info('Enter the OTP sent to your email')
                    router.push(`/auth/sign-in/verify?token=${res.token}`)
                } else {
                    login(res)
                    toast.success('Login successful')
                }
            },
            onError: (error) => {
                toast.error(error?.data?.message || 'Invalid email or password')
            },
        })
    }



    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-muted/40 p-4">
            <Card className="max-w-md w-full shadow-xl gap-4 text-center">
                <CardHeader>
                    <CardTitle className="text-2xl font-bold">Sign In</CardTitle>
                </CardHeader>
                <CardDescription className="text-sm text-muted-foreground">
                    Enter your credentials to continue
                </CardDescription>
                <CardContent>
                    <Form {...form}>
                        <form
                            onSubmit={form.handleSubmit(handleOnSubmit)}
                            className="space-y-6"
                        >
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Email</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="email"
                                                placeholder="Enter your email"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="password"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Password</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="password"
                                                placeholder="Enter your password"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <Button
                                type="submit"
                                className="w-full bg-blue-600"
                                disabled={isPending}
                            >
                                {isPending ? 'Signing In...' : 'Sign In'}
                            </Button>
                        </form>
                    </Form>

                    <CardFooter className="flex justify-center mt-4">
                        <div>
                            <p className="text-sm text-muted-foreground">
                                Don’t have an account?{' '}
                                <a
                                    href="/auth/sign-up"
                                    className="text-primary underline"
                                >
                                    Sign Up
                                </a>
                            </p>
                        </div>
                    </CardFooter>
                </CardContent>
            </Card>
        </div>
    )
}

export default SignIn
