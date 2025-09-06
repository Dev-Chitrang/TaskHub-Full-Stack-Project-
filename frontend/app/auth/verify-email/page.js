'use client'

import { useVerificationEmailMutation } from '@/app/hooks/use-Auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, CheckCircle, Loader, XCircle } from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import React, { useEffect, useState } from 'react'

const VerifyEmail = () => {
    const searchParams = useSearchParams()

    const [isSuccess, setIsSuccess] = useState(false)

    const { mutate, isPending: isVerifying } = useVerificationEmailMutation();

    useEffect(() => {
        const token = searchParams.get('token')
        if (!token) {
            setIsSuccess(false)
        } else {
            mutate({ token }, {
                onSuccess: () => setIsSuccess(true),
                onError: (error) => {
                    toast.error(error?.data?.message || "Something went wrong")
                    console.log(error)
                    setIsSuccess(false)
                }
            })
        }
    }, [searchParams])
    return (
        <div className='flex flex-co items-center justify-center h-screen'>
            <Card className='w-full max-w-md'>
                <CardHeader>
                    <CardTitle>Verify Email</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className='flex flex-col items-center justify-center py-6'>
                        {isVerifying ? (<>
                            <Loader className='w-10 h-10 animate-spin' />
                            <h3 className='text-lg font-semibold'>
                                Verifying...
                            </h3>
                            <p className='text-sm'>Please wait while we verify your email.</p>
                        </>) :
                            isSuccess ? (<>
                                <CheckCircle className='w-10 h-10 text-green-500' />
                                <h3 className='text-lg font-semibold'>
                                    Email Verified.
                                </h3>
                                <p className='text-sm'>Your email has been verified successfully.</p>
                                <Link href={'/auth/sign-in'} className='flex gap-2 items-center text-sm mt-6'>
                                    <ArrowLeft className='w-4 h-4 mr-2' />
                                    Back to sign in
                                </Link>
                            </>
                            ) : (<>
                                <XCircle className='w-10 h-10 text-red-500' />
                                <h3 className='text-lg font-semibold'>
                                    Email Verification Failed.
                                </h3>
                                <p className='text-sm'>Your email verification has failed.</p>
                                <Link href={'/auth/sign-in'} className='flex gap-2 items-center text-sm mt-6'>
                                    <ArrowLeft className='w-4 h-4 mr-2' />
                                    Back to sign in
                                </Link>
                            </>)
                        }
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

export default VerifyEmail
