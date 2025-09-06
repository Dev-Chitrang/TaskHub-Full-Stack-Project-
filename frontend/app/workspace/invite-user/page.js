'use client'

import {
    useAcceptGeneratedInviteMutation,
    useAcceptInviteByTokenMutation,
} from '@/app/hooks/use-Workspace'
import { useAuth } from '@/app/provider/AuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { WorkspaceAvatar } from '@/components/workspace/WorkspaceAvatar'
import { useRouter, useSearchParams } from 'next/navigation'
import React, { useEffect } from 'react'
import { toast } from 'sonner'

const InvitePage = () => {
    const searchParams = useSearchParams()
    const workspaceId = searchParams.get('workspaceId') // For link invite
    const workspaceName = searchParams.get('workspaceName') || 'Workspace'
    const workspaceColor = searchParams.get('workspaceColor') || 'blue'
    const token = searchParams.get('token') // For email/token invite

    const router = useRouter()
    const { isAuthenticated, isLoading } = useAuth()

    // Store invite link immediately
    useEffect(() => {
        if (typeof window === 'undefined') return
        localStorage.setItem("inviteLink", window.location.href)
    }, [])

    const { mutate: acceptInviteByToken, isLoading: isAcceptingByToken } = useAcceptInviteByTokenMutation()
    const { mutate: acceptGeneratedInvite, isPending: isAcceptingGenerated } = useAcceptGeneratedInviteMutation()

    const handleAcceptInvite = () => {
        if (!isAuthenticated) return

        // Token-based invite (email invite)
        if (token) {
            acceptInviteByToken({ token }, {
                onSuccess: (res) => {
                    toast.success(res.message || 'Invite accepted successfully')
                    if (localStorage.getItem('inviteLink')) localStorage.removeItem('inviteLink')
                    router.push(`/workspaces/${res.workspaceId}`)
                },
                onError: (error) => {
                    toast.error(error?.data?.message || 'Something went wrong')
                    if (localStorage.getItem('inviteLink')) localStorage.removeItem('inviteLink')
                },
            })

            // Link-based invite (search param workspaceId)
        } else if (workspaceId) {
            acceptGeneratedInvite({ workspaceId }, {
                onSuccess: () => {
                    toast.success('Invite accepted successfully')
                    if (localStorage.getItem('inviteLink')) localStorage.removeItem('inviteLink')
                    router.push(`/workspaces/${workspaceId}`)
                },
                onError: (error) => {
                    toast.error(error?.data?.message || 'Something went wrong')
                    if (localStorage.getItem('inviteLink')) localStorage.removeItem('inviteLink')
                },
            })
        } else {
            if (localStorage.getItem('inviteLink')) localStorage.removeItem('inviteLink')
            toast.error('Invalid invitation link')
        }
    }

    const handleDeclineInvite = () => {
        toast.info('Invitation declined')
        if (localStorage.getItem('inviteLink')) localStorage.removeItem('inviteLink')
        router.push('/workspaces')
    }

    if (isLoading) {
        return <div className="flex items-center justify-center h-screen text-muted-foreground">Loading invite...</div>
    }

    if (!isAuthenticated) {
        return <div className="flex items-center justify-center h-screen text-muted-foreground">Redirecting to sign-in...</div>
    }

    return (
        <div className="min-h-screen relative flex items-center justify-center bg-muted/10 p-4">
            {/* Go to Dashboard button at top-left */}
            <Button
                className="absolute top-4 left-4"
                onClick={() => router.push('/dashboard')}
            >
                Go to Dashboard
            </Button>

            <Card className="max-w-md w-full">
                <CardHeader>
                    <div className="flex items-center gap-3 mb-2">
                        <WorkspaceAvatar name={workspaceName} color={workspaceColor} />
                        <CardTitle>{workspaceName}</CardTitle>
                    </div>
                    <CardDescription>
                        You have been invited to join "<strong>{workspaceName}</strong>" workspace.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex gap-3">
                        <Button
                            variant="default"
                            className="flex-1"
                            onClick={handleAcceptInvite}
                            disabled={isAcceptingByToken || isAcceptingGenerated}
                        >
                            {isAcceptingByToken || isAcceptingGenerated
                                ? 'Joining...'
                                : 'Accept Invitation'}
                        </Button>
                        <Button
                            variant="outline"
                            className="flex-1"
                            onClick={handleDeclineInvite}
                            disabled={isAcceptingByToken || isAcceptingGenerated}
                        >
                            Decline
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

export default InvitePage
