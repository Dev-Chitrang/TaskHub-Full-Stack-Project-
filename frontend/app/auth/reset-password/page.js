'use client'
import React, { useState } from 'react'
import { resetPasswordSchema } from '@/lib/schema'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, CheckCircle, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useResetPasswordMutation } from '@/app/hooks/use-Auth'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'


const ResetPassword = () => {
    const navigate = useRouter()
    const searchParams = useSearchParams()
    const token = searchParams.get('token')
    const { mutate, isPending } = useResetPasswordMutation()
    const [isSucess, setIsSucess] = useState(false)
    const form = useForm({
        resolver: zodResolver(resetPasswordSchema),
        defaultValues: {
            newPassword: '',
            confirmPassword: ''
        }
    })

    const onSubmit = (values) => {
        if (!token) {
            toast.error('Invalid token')
            return;
        }
        mutate({ ...values, token }, {
            onSuccess: (res) => {
                setIsSucess(true)
                toast.success("Password reset successful")
                navigate.push("/auth/sign-in")
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
                    <h1 className='text-2xl font-bold'>Reset Password</h1>
                    <p className='text-muted-foreground'>Enter your password below</p>
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
                                <div className='flex flex-col items-center justify-center'>
                                    <CheckCircle className='w-10 h-10 text-green-500' />
                                    <h1 className='text-2xl font-bold'>Password reset successful</h1>
                                </div>
                            ) : (
                                <Form {...form}>
                                    <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-7'>
                                        <FormField
                                            control={form.control}
                                            name='newPassword'
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Password</FormLabel>
                                                    <FormControl>
                                                        <Input type="password" placeholder='Enter your new password' {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name='confirmPassword'
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Confirm Password</FormLabel>
                                                    <FormControl>
                                                        <Input type="password" placeholder='Enter your new password' {...field} />
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
                            )
                        }
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

export default ResetPassword
