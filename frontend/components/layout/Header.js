import { useAuth } from '@/app/provider/AuthContext'
import React, { useEffect } from 'react'
import { Button } from '../ui/button'
import { Bell, PlusCircle } from 'lucide-react'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from '../ui/dropdown-menu'
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar'
import Link from 'next/link'
import { WorkspaceAvatar } from '../workspace/WorkspaceAvatar'
import useSWR from 'swr'
import { useSearchParams, usePathname, useRouter } from 'next/navigation'

async function fetcher(url, token) {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}${url}`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
    if (!res.ok) throw new Error("Failed to fetch");
    return res.json();
}

const Header = ({
    onWorkspaceSelected,
    selectedWorkspace,
    onCreateWorkspace
}) => {
    const { user, logout, token } = useAuth()
    console.log(user)

    const params = useSearchParams()
    const workspaceId = params.get("workspaceId")
    const router = useRouter()
    const pathname = usePathname()

    // Workspaces
    const { data: Workspaces, error, isLoading } = useSWR(
        token ? "/workspaces/" : null,
        (url) => fetcher(url, token),
        { revalidateOnFocus: false, revalidateOnReconnect: false }
    )

    // Notifications
    const { data: notifications } = useSWR(
        token ? "/notifications/" : null,
        (url) => fetcher(url, token),
        { refreshInterval: 10000 } // auto-refresh every 10s
    )
    const unreadCount = notifications?.filter((n) => !n.is_read).length || 0

    const handleWorkspaceChange = (workspace) => {
        onWorkspaceSelected(workspace, false)
        if (pathname.startsWith("/dashboard")) {
            router.push(`/dashboard?workspaceId=${workspace.id}`)
        }
        else if (pathname.startsWith("/workspaces")) {
            router.push(`/workspaces/${workspace.id}`)
        }
        else if (pathname.startsWith("/members")) {
            router.push(`/members/?workspaceId=${workspace.id}`)
        }
    }

    useEffect(() => {
        if (Workspaces) {
            if (workspaceId) {
                const ws = Workspaces.find((w) => w.id === workspaceId)
                if (ws && ws.id !== selectedWorkspace?.id) {
                    onWorkspaceSelected(ws, false)
                }
            } else {
                if (selectedWorkspace) {
                    onWorkspaceSelected(null, false)
                }
            }
        }
    }, [Workspaces, workspaceId, selectedWorkspace])

    if (error) return <div>Failed to load workspaces</div>
    if (isLoading) return <div>Loading workspaces...</div>

    return (
        <div className='bg-background sticky top-0 z-40 border-b'>
            <div className='flex items-center justify-between px-4 sm:px-6 lg:px-8 py-4'>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant='outline'>
                            {selectedWorkspace ? (
                                <>
                                    {selectedWorkspace.color && (
                                        <WorkspaceAvatar
                                            color={selectedWorkspace.color}
                                            name={selectedWorkspace.name}
                                        />
                                    )}
                                    <span className='font-medium'>{selectedWorkspace?.name}</span>
                                </>
                            ) : (
                                <span className='font-medium'>Select Workspace</span>
                            )}
                        </Button>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent>
                        <DropdownMenuLabel>Workspaces</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuGroup>
                            {Workspaces && Workspaces.map((workspace) => (
                                <DropdownMenuItem
                                    key={workspace.id}
                                    onClick={() => handleWorkspaceChange(workspace)}
                                >
                                    {workspace.color && (
                                        <WorkspaceAvatar
                                            color={workspace.color}
                                            name={workspace.name}
                                        />
                                    )}
                                    <span className='font-medium'>{workspace.name}</span>
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuGroup>
                        <DropdownMenuGroup>
                            <DropdownMenuItem onClick={onCreateWorkspace}>
                                <PlusCircle className='mr-2 w-4 h-4' />
                                Create Workspace
                            </DropdownMenuItem>
                        </DropdownMenuGroup>
                    </DropdownMenuContent>
                </DropdownMenu>

                <div className='flex items-center gap-2'>
                    <button
                        className='relative p-2 rounded-full hover:bg-muted transition'
                        onClick={() => router.push("/notifications")}
                    >
                        <Bell className='h-5 w-5' />
                        {unreadCount > 0 && (
                            <span className='absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center'>
                                {unreadCount > 9 ? "9+" : unreadCount}
                            </span>
                        )}
                    </button>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className='rounded-full border-0 w-8 h-8'>
                                <Avatar className={'w-8'}>
                                    <AvatarImage src={user?.profilePicture} alt={user?.name} />
                                    <AvatarFallback>
                                        {user?.name?.charAt(0).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                            </button>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent align='end'>
                            <DropdownMenuLabel>My Account</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                                <Link href={'/profile'}>Profile</Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={logout}>Log Out</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </div>
    )
}

export default Header
