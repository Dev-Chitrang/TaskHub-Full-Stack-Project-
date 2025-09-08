'use client'

import React from 'react'
import { WorkspaceAvatar } from './WorkspaceAvatar'
import { Button } from '../ui/button'
import { PlusCircle, UserPlus } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@radix-ui/react-avatar'

const WorkspaceHeader = ({
    workspace,
    members,
    onCreateProject,
    onInviteMember,
    showActions,
}) => {
    return (
        <div className='space-y-8'>
            <div className='space-y-3'>
                <div className='flex flex-col-reverse md:flex-row md:justify-between md:items-center gap-3'>
                    <div className='flex md:items-center gap-3'>
                        {
                            workspace.color && (
                                <WorkspaceAvatar color={workspace.color} name={workspace.name} />
                            )
                        }
                        <div className='flex flex-col'>
                            <h2 className='text-xl md:text-2xl font-semibold'>
                                {workspace.name}
                            </h2>
                            {
                                workspace.description && (
                                    <span className='text-sm text-muted-foreground mt-1'>
                                        {workspace.description}
                                    </span>
                                )
                            }
                        </div>
                    </div>
                    <div className='flex items-center gap-3 justify-between md:justify-start mb-4 md:mb-0'>
                        {
                            showActions && (
                                <>
                                    <Button onClick={onCreateProject} size='sm' className='gap-2 bg-emerald-500 hover:bg-emerald-500'>
                                        <PlusCircle size={16} />
                                        New Project
                                    </Button>
                                    <Button onClick={onInviteMember} size='sm' className='gap-2'>
                                        <UserPlus size={16} />
                                        Invite Member
                                    </Button>
                                </>
                            )
                        }
                    </div>
                </div>
            </div>
            {
                members.length > 0 && (
                    <div className='flex items-center gap-2'>
                        <span className='text-sm text-muted-foreground'>
                            Memebers
                        </span>
                        <div className='flex space-x-2'>
                            {
                                members.map((member) => (
                                    <Avatar key={member.id} className="w-8 h-8">
                                        <AvatarImage
                                            src={member.user.profilePicture}
                                            alt={member.user.name}
                                            className="relative h-8 w-8 rounded-full border-2 border-background overflow-hidden"
                                            title={member.user.name}
                                        />
                                        <AvatarFallback
                                            className="rounded-full w-8 h-8 border-2 border-background bg-slate-500 text-white flex items-center justify-center"
                                            title={member.user.name}
                                        >
                                            {member.user.name.charAt(0).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                ))
                            }
                        </div>
                    </div>
                )
            }
        </div>
    )
}

export default WorkspaceHeader
