'use client'

import React, { useState } from 'react'
import { forgotPasswordSchema } from '@/lib/schema'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, CheckCircle, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useForgotPasswordMutation } from '@/app/hooks/use-Auth'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

const ForgotPassword = () => {
    const [isSucess, setIsSucess] = useState(false)
    const form = useForm({
        resolver: zodResolver(forgotPasswordSchema),
        defaultValues: {
            email: ''
        }
    })

    const { mutate, isPending } = useForgotPasswordMutation()

    const onSubmit = (data) => {
        mutate(data, {
            onSuccess: (res) => {
                setIsSucess(true)
            },
            onError: (error) => {
                console.log(error);
                toast.error(error?.data?.message || "Something went wrong")
            }
        })
    }
    return (
        <div className='flex flex-col items-center justify-center h-screen'>
            <div className='w-full max-w-md space-y-6'>
                <div className='flex flex-col items-center justify-center space-y-2'>
                    <h1 className='text-2xl font-bold'>Forgot Password</h1>
                    <p className='text-muted-foreground'>Enter your email to reset password</p>
                </div>
                <Card>
                    <CardHeader>
                        <CardTitle>
                            <Link href='/auth/sign-in' className='flex items-center gap-2'>
                                <ArrowLeft className='w-4 h-4' />
                                <span>Back to sign in</span>
                            </Link>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {
                            isSucess ? (
                                <div className='flex flex-col items-center justify-center space-y-2'>
                                    <CheckCircle className='w-10 h-10 text-green-500' />
                                    <h1 className='text-2xl font-bold'>Password reset link sent</h1>
                                    <p className='text-muted-foreground'>Password reset link has been sent to your email</p>
                                </div>
                            ) : (
                                <>
                                    <Form {...form}>
                                        <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
                                            <FormField
                                                control={form.control}
                                                name='email'
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Email</FormLabel>
                                                        <FormControl>
                                                            <Input placeholder='Enter your email' {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <Button type='submit' className='w-full' disabled={isPending}>{
                                                isPending ? (<Loader2 className='w-4 h-4 mr-2 animate-spin' />) : ("Reset Password")
                                            }</Button>
                                        </form>
                                    </Form>
                                </>
                            )
                        }
                    </CardContent>
                </Card>
            </div>
        </div >
    )
}

export default ForgotPassword
