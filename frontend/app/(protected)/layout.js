'use client'

import React, { useEffect, useState } from 'react'
import { useAuth } from '../provider/AuthContext'
import SidebarComponent from '@/components/layout/SidebarComponent'
import { useRouter } from 'next/navigation'
import { Loader } from 'lucide-react'
import Header from '@/components/layout/Header'
import CreateWorkspace from '@/components/workspace/CreateWorkspace'

const WorkSpaceLayout = ({ children }) => {
    const router = useRouter()
    const { isAuthenticated, isLoading } = useAuth()
    const [isCreatingWorkspace, setIsCreatingWorkspace] = useState(false)
    const [currentWorkspace, setCurrentWorkspace] = useState(null)

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push("/auth/sign-in");
        }
    }, [isLoading, isAuthenticated, router]);

    if (isLoading) {
        return (
            <div className='flex flex-col items-center justify-center h-screen '>
                <Loader className="w-10 h-10 animate-spin" />
                <h1>Loading...</h1>
            </div>
        );
    }

    const handleWorkspaceSelected = (workspace, shouldNavigate = true) => {
        setCurrentWorkspace(workspace)
        // redirect to workspace page (assuming /workspaces/[id])
        if (shouldNavigate) {
            router.push(`/workspaces/${workspace.id}`)
        }
    }

    return (
        <div className='flex h-screen w-full'>
            <SidebarComponent
                currentWorkspace={currentWorkspace}
            />

            <div className='flex flex-1 flex-col h-full'>
                <Header
                    onWorkspaceSelected={handleWorkspaceSelected}
                    selectedWorkspace={currentWorkspace}
                    onCreateWorkspace={() => setIsCreatingWorkspace(true)}
                />

                <main className='flex-1 overflow-y-auto h-full w-full'>
                    <div className='mx-auto container px-2 sm:px-6 lg:px-8 py-0 md:py-8 w-full h-full'>
                        {children}
                    </div>
                </main>
            </div>
            <CreateWorkspace
                isCreatingWorkspace={isCreatingWorkspace}
                setIsCreatingWorkspace={setIsCreatingWorkspace} />
        </div>
    )
}

export default WorkSpaceLayout
