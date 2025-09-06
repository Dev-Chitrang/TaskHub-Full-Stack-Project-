'use client'

import { usegetWorkspaceQuery } from '@/app/hooks/use-Workspace'
import { Loader, Plus, UserPlus } from 'lucide-react'
import { useParams } from 'next/navigation'
import React, { useState } from 'react'
import WorkspaceHeader from '@/components/workspace/WorkspaceHeader'
import ProjectList from '@/components/workspace/ProjectList'
import CreateProjectDialog from '@/components/workspace/project/CreateProjectDialog'
import InviteMember from '@/components/workspace/InviteMember'
import BackButton from '@/components/BackButton'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/app/provider/AuthContext'
import MembersList from '@/components/workspace/MembersList'
import { useToggleWorkspaceMember } from '@/app/hooks/use-Workspace'
import { toast } from 'sonner'

const WorkSpaceDetails = () => {
    const { WorkSpaceid } = useParams()
    const [isCreateProject, setIsCreateProject] = useState(false)
    const [isInviteMember, setIsInviteMember] = useState(false)
    const { user } = useAuth() // ✅ current logged-in user

    if (!WorkSpaceid) return <div>Workspace not found</div>

    const { data, isLoading } = usegetWorkspaceQuery(WorkSpaceid)

    const toggleMemberMutation = useToggleWorkspaceMember()

    const handleRoleChange = (userId, role) => {
        toggleMemberMutation.mutate(
            { workspaceId: WorkSpaceid, userId, role },
            {
                onSuccess: () => toast.success("Role updated successfully"),
                onError: (err) =>
                    toast.error(err.data.message || "Error updating member"),
            }
        )
    }

    const handleRemove = (userId) => {
        toggleMemberMutation.mutate(
            { workspaceId: WorkSpaceid, userId, role: null },
            {
                onSuccess: () => toast.success("Member removed successfully"),
                onError: (err) =>
                    toast.error(err.data.message || "Error removing member"),
            }
        )
    }

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-40">
                <Loader className="w-10 h-10 animate-spin" />
            </div>
        )
    }

    const workspace = data.workspace
    const projects = data.projects || []

    // ✅ Find current user role in this workspace
    const currentMember = workspace.members.find((m) => m.user_id === user.id)
    const currentRole = currentMember?.role

    // ✅ Projects where this user is a member
    const myProjects = projects.filter((p) =>
        p.members.some((pm) => pm.user_id === user.id)
    )

    return (
        <div className="space-y-8 pb-2">
            <BackButton />

            <WorkspaceHeader
                workspace={workspace}
                members={workspace.members}
                onCreateProject={() => setIsCreateProject(true)}
                onInviteMember={() => setIsInviteMember(true)}
                showActions={currentRole === 'owner' || currentRole === 'admin'}
            />

            {/* Owner/Admin View */}
            {(currentRole === 'owner' || currentRole === 'admin') && (
                <>
                    {projects.length > 0 ? (
                        <ProjectList
                            workspaceId={WorkSpaceid}
                            projects={projects}
                            onCreateProject={() => setIsCreateProject(true)}
                        />
                    ) : (
                        <div className="flex flex-col items-center justify-center h-60 border border-dashed rounded-lg p-6 text-center">
                            <h2 className="text-lg font-medium">No projects yet</h2>
                            <p className="text-sm text-muted-foreground mt-2">
                                Start by creating your first project.
                            </p>
                            <div className="flex gap-2 mt-4">
                                <Button onClick={() => setIsCreateProject(true)}>
                                    <Plus className="w-4 h-4 mr-2" /> Create Project
                                </Button>
                                <Button variant="outline" onClick={() => setIsInviteMember(true)}>
                                    <UserPlus className="w-4 h-4 mr-2" /> Invite Members
                                </Button>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Normal Member but NOT in any project */}
            {currentRole === 'member' && myProjects.length === 0 && (
                <div className="flex flex-col items-center justify-center h-60 border border-dashed rounded-lg p-6 text-center">
                    <h2 className="text-lg font-medium">No Projects Assigned</h2>
                    <p className="text-sm text-muted-foreground mt-2">
                        You are a member of this workspace, but you’re not part of any
                        project. Please wait until an admin adds you.
                    </p>
                </div>
            )}

            {/* Normal Member WITH projects */}
            {currentRole === 'member' && myProjects.length > 0 && (
                <ProjectList workspaceId={WorkSpaceid} projects={myProjects} />
            )}

            {/* Modals */}
            <CreateProjectDialog
                isOpen={isCreateProject}
                onOpenChange={setIsCreateProject}
                workspaceId={WorkSpaceid}
                workspaceMembers={workspace.members}
            />
            <InviteMember
                isOpen={isInviteMember}
                onOpenChange={setIsInviteMember}
                workspaceId={WorkSpaceid}
                workspaceName={data.workspace.name}
                workspaceColor={data.workspace.color}
            />
            {(currentRole === "owner" || currentRole === "admin") && (
                <MembersList
                    members={workspace.members}
                    currentRole={currentRole}
                    onRoleChange={handleRoleChange}
                    onRemove={handleRemove}
                />
            )}
        </div>
    )
}

export default WorkSpaceDetails
