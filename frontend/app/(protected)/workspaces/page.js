'use client'

import { usegetWorkspacesQuery } from '@/app/hooks/use-Workspace'
import { Button } from '@/components/ui/button'
import CreateWorkspace from '@/components/workspace/CreateWorkspace'
import { Loader, PlusCircle, Users } from 'lucide-react'
import React, { useState } from 'react'
import NoDataFound from './NoDataFound'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { WorkspaceAvatar } from '@/components/workspace/WorkspaceAvatar'
import { format } from 'date-fns';

const Workspaces = () => {
    const [isCreatingWorkspace, setIsCreatingWorkspace] = useState(false)
    const { data, isLoading } = usegetWorkspacesQuery()

    if (isLoading) {
        return <Loader />
    }

    return (
        <>
            <div className='space-y-8'>
                <div className='flex items-center justify-between'>
                    <h2 className='text-xl md:text-3xl font-bold'>
                        Workspaces
                    </h2>
                    <Button onClick={() => setIsCreatingWorkspace(true)} className={'bg-emerald-500 hover:bg-emerald-500'}>
                        <PlusCircle className='size-4' />
                        New Workspace
                    </Button>
                </div>

                <div className='grid gap-6 sm:gird-cols-2 lg:grid-cols-3'>
                    {
                        data?.map((workspace) => (
                            <WorkspaceCard key={workspace.id} workspace={workspace} />
                        ))
                    }

                    {
                        data.length === 0 && <NoDataFound title={"No Workspaces found"} description={"You have no workspaces yet. Create a workspace to get started."} buttonText={"Create Workspace"} buttonAction={() => setIsCreatingWorkspace(true)} />
                    }
                </div>
            </div>

            <CreateWorkspace isCreatingWorkspace={isCreatingWorkspace} setIsCreatingWorkspace={setIsCreatingWorkspace} />
        </>
    )
}

const WorkspaceCard = ({ workspace }) => {
    return (
        <Link href={`/workspaces/${workspace.id}`}>
            <Card className={'transition-all hover:shadow-md hover:-translate-y-1'}>
                <CardHeader className={'pb-2'}>
                    <div className='flex items-center justify-between'>
                        <div className='flex gap-2'>
                            <WorkspaceAvatar name={workspace.name} color={workspace.color} />
                            <div>
                                <CardTitle>{workspace.name}</CardTitle>
                                <span className='text-xs text-muted-foreground'>Created at {format(new Date(workspace.created_at), 'dd/MM/yyyy HH:mm a')}</span>
                            </div>
                        </div>
                        <div className='flex items-center text-muted-foreground'>
                            <Users className='size-4 mr-1' />
                            <span className='text-xs'>
                                {workspace.members.length}
                            </span>
                        </div>
                    </div>
                    <CardDescription>
                        {workspace.description || "No description"}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className='text-sm text-muted-foreground'>
                        {"Projects: " + workspace.projects.length || "No projects"}
                    </div>
                    <div className='text-sm text-muted-foreground mt-2'>
                        View Workspace details and projects
                    </div>
                </CardContent>
            </Card>
        </Link>
    )
}

export default Workspaces