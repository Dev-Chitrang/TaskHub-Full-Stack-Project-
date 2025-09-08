'use client'

import {
  UseProjectQuery,
  UseArchiveProject,
  UseChangeProjectStatus,
  UseUpdateProjectTitle,
  UseUpdateProjectDescription,
  UseToggleProjectMember
} from '@/app/hooks/use-Project'
import BackButton from '@/components/BackButton'
import CreateTaskDialog from '@/components/tasks/CreateTaskDialog'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { getProjectProgress } from '@/lib'
import { AlertCircle, CheckCircle, Clock, Loader, Calendar, Archive, Edit, Trash2 } from 'lucide-react'
import { useParams, useRouter } from 'next/navigation'
import React, { useState } from 'react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { useGetWorkspaceDetailsQuery } from '@/app/hooks/use-Workspace'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'

const ProjectDetails = () => {
  const { Projectid, WorkSpaceid } = useParams()
  const router = useRouter()

  const [isCreateTask, setIsCreateTask] = useState(false)
  const [TaskFilter, setTaskFilter] = useState('all')
  const [sortBy, setSortBy] = useState("due_date")
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [isEditingDesc, setIsEditingDesc] = useState(false)
  const [newTitle, setNewTitle] = useState("")
  const [newDescription, setNewDescription] = useState("")
  const [showOwnerRemoveWarning, setShowOwnerRemoveWarning] = useState(false)
  const [pendingRemoveUserId, setPendingRemoveUserId] = useState(null)
  const [selectedRole, setSelectedRole] = useState("contributor")

  const { data, isLoading } = UseProjectQuery(Projectid)

  const archiveMutation = UseArchiveProject()
  const statusMutation = UseChangeProjectStatus()
  const updateTitleMutation = UseUpdateProjectTitle()
  const updateDescMutation = UseUpdateProjectDescription()
  const toggleMemberMutation = UseToggleProjectMember()

  const { data: workspace } = useGetWorkspaceDetailsQuery(WorkSpaceid, {
    enabled: !!WorkSpaceid,
  })

  if (!data?.project) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] px-4">
        <Card className="w-full max-w-lg shadow-lg">
          <CardHeader className="text-center space-y-2">
            <h2 className="text-xl font-semibold">Project not found</h2>
            <p className="text-sm text-muted-foreground">
              Either this project doesn’t exist or you don’t have access.
            </p>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button variant="outline" onClick={() => router.push(`/workspaces/${WorkSpaceid}`)}>
              Back to Workspace
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-40">
        <Loader className="w-10 h-10 animate-spin" />
      </div>
    )
  }

  const { project, tasks } = data
  const projectProgress = getProjectProgress(tasks)

  const handleTaskClick = (taskId) => {
    try {
      router.push(`/workspaces/${WorkSpaceid}/projects/${Projectid}/tasks/${taskId}`)
    }
    catch (error) {
      console.log(error)
    }
  }

  const handleArchiveToggle = () => {
    archiveMutation.mutate({ projectId: Projectid }, {
      onSuccess: () => {
        toast.success("Project Archived")
        router.push(`/workspaces/${WorkSpaceid}`)
      },
      onError: (error) => {
        toast.error(error.data?.message)
      },
    })
  }

  const handleStatusChange = (val) => {
    statusMutation.mutate({ projectId: Projectid, status: val }, {
      onSuccess: () => {
        toast.success("Project Status Updated")
      },
      onError: (error) => {
        toast.error(error.data?.message)
      },
    })
  }

  const sortTasks = (taskList) => {
    return [...taskList].sort((a, b) => {
      if (sortBy === "due_date") {
        if (!a.due_date) return 1
        if (!b.due_date) return -1
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })
  }

  const handleUpdateTitle = () => {
    updateTitleMutation.mutate({ projectId: Projectid, title: newTitle }, {
      onSuccess: () => {
        setIsEditingTitle(false)
        toast.success("Title updated successfully")
      },
      onError: (error) => {
        toast.error(error?.data?.message || "Something went wrong")
      },
    })
  }

  const handleUpdateDescription = () => {
    updateDescMutation.mutate({ projectId: Projectid, description: newDescription }, {
      onSuccess: () => {
        setIsEditingDesc(false)
        toast.success("Description updated successfully")
      },
      onError: (error) => {
        toast.error(error?.data?.message || "Something went wrong")
      },
    })
  }

  // ✅ Updated handleToggleMember to handle missing user key safely
  const handleToggleMember = (userId, role) => {
    const member = project.members.find((m) => (m.user?.id ?? m.id) == userId)
    const isRemovingOwner = member?.role === "manager" && role === null
    const otherOwners = project.members.filter((m) => m.role === "manager" && (m.user?.id ?? m.id) !== userId)

    if (isRemovingOwner && otherOwners.length === 0) {
      setPendingRemoveUserId(userId)
      setShowOwnerRemoveWarning(true)
      return
    }

    toggleMemberMutation.mutate(
      { projectId: Projectid, userId, role },
      {
        onSuccess: (res) => {
          if (role === null) {
            toast.success("Member removed successfully")
          } else if (!member) {
            toast.success("Member added successfully")
          } else {
            toast.success("Member role updated successfully")
          }
        },
        onError: (error) => {
          toast.error(error?.data?.message || "Error updating member")
        },
      }
    )
  }

  const handleConfirmRemoveOwner = () => {
    toast.error("Please assign another owner before leaving.")
    setShowOwnerRemoveWarning(false)
  }

  // ✅ Fixed workspaceMembersToAdd filter (handles both `wm.user` and `wm.id`)
  const workspaceMembersToAdd = workspace?.members.filter(
    (wm) => !project.members.some((pm) => pm.user_id === wm.user.id)
  ) || []

  const projectMembers = project.members

  return (
    <div className="flex flex-col h-full space-y-8 px-4 md:px-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className='mb-2'><BackButton /></div>
          <div className="flex items-center gap-3 flex-wrap">
            {isEditingTitle ? (
              <>
                <Input
                  className="text-xl! font-semibold w-full min-w-3xl"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  disabled={updateTitleMutation.isLoading}
                />
                <Button size="sm" className="py-0" onClick={handleUpdateTitle} disabled={updateTitleMutation.isLoading}>Save</Button>
              </>
            ) : (
              <>
                <h2 className='text-xl flex-1 font-semibold'>{project.title}</h2>
                <Edit className='size-3 cursor-pointer' onClick={() => { setIsEditingTitle(true); setNewTitle(project.title) }} />
              </>
            )}

            <Button
              size="sm"
              variant="ghost"
              onClick={handleArchiveToggle}
              disabled={archiveMutation.isLoading}
            >
              <Archive className="size-4 mr-1" />
              {project.is_archived ? "Unarchive" : "Archive"}
            </Button>
          </div>

          {/* Description Editing */}
          <div className="flex items-center gap-3 flex-wrap mt-2">
            {isEditingDesc ? (
              <>
                <Input
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  disabled={updateDescMutation.isLoading}
                />
                <Button size="sm" className="mt-2" onClick={handleUpdateDescription} disabled={updateDescMutation.isLoading}>
                  Save
                </Button>
              </>
            ) : (
              <>
                <p className='text-sm font-semibold'>{project.description}</p>
                <Edit className='size-3 cursor-pointer' onClick={() => { setIsEditingDesc(true); setNewDescription(project.description) }} />
              </>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-2 min-w-32">
            <div className="text-sm text-muted-foreground">Progress:</div>
            <div className="flex-1">
              <Progress value={projectProgress} className="h-2" />
            </div>
            <span className="text-sm text-muted-foreground">{projectProgress}%</span>
          </div>
          <Button onClick={() => setIsCreateTask(true)}>Add Task</Button>
        </div>
      </div>

      {/* Status Selector */}
      <div className="flex flex-wrap items-center gap-4">
        <span className="text-sm text-muted-foreground">Project Status:</span>
        <Select value={project.status} onValueChange={handleStatusChange}>
          <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="planning">Planning</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Project Members Add */}
      <div className="mt-4">
        <h3 className="font-semibold mb-2">Add Members</h3>
        <div className="flex flex-col gap-2">
          {workspaceMembersToAdd.length === 0 && (
            <div className="text-sm text-muted-foreground">No members to add</div>
          )}
          {workspaceMembersToAdd.map((wm) => {
            return (
              <div key={wm.user.id} className="flex items-center justify-between bg-muted/10 rounded-md p-2">
                <div className="flex items-center gap-2">
                  <Avatar className="size-8" title={wm.user.name}>
                    <AvatarImage src={wm.user.profilePicture} />
                    <AvatarFallback>{wm.user.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <span>{wm.user.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Select value={selectedRole} onValueChange={(val) => setSelectedRole(val)}>
                    <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manager">Owner</SelectItem>
                      <SelectItem value="contributor">Contributor</SelectItem>
                      <SelectItem value="viewer">Viewer</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button size="sm" onClick={() => handleToggleMember(wm.user.id, selectedRole)}>
                    Add
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Project Members Manage */}
      <div className="mt-4">
        <h3 className="font-semibold mb-2">Project Members</h3>
        <div className="flex flex-col gap-2">
          {projectMembers.map((member) => (
            <div key={member.user_id} className="flex items-center justify-between bg-muted/10 rounded-md p-2">
              <div className="flex items-center gap-2">
                <Avatar className="size-8" title={member.name}>
                  <AvatarImage src={member.profilePicture} />
                  <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <span>{member.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <Select value={member.role} onValueChange={(val) => handleToggleMember(member.user.id, val)}>
                  <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manager">Owner</SelectItem>
                    <SelectItem value="contributor">Contributor</SelectItem>
                    <SelectItem value="viewer">Viewer</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={() => handleToggleMember(member.user.id, null)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Warning Dialog */}
      <Dialog open={showOwnerRemoveWarning} onOpenChange={() => setShowOwnerRemoveWarning(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cannot Remove Owner</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            You are the last owner of this project. Please assign another owner before removing yourself.
          </p>
          <DialogFooter>
            <Button variant="destructive" onClick={handleConfirmRemoveOwner}>Ok</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Tabs & Tasks */}
      <div className="flex-1 flex flex-col min-h-0">
        <Tabs defaultValue="all" className="w-full flex-1 flex flex-col min-h-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <TabsList className="flex flex-wrap">
              <TabsTrigger value="all" onClick={() => setTaskFilter('all')}>All Tasks</TabsTrigger>
              <TabsTrigger value="todo" onClick={() => setTaskFilter('todo')}>To Do</TabsTrigger>
              <TabsTrigger value="in_progress" onClick={() => setTaskFilter('in_progress')}>In Progress</TabsTrigger>
              <TabsTrigger value="done" onClick={() => setTaskFilter('done')}>Done</TabsTrigger>
              <TabsTrigger value="archived" onClick={() => setTaskFilter('archived')}>
                Archived ({tasks.filter((t) => t.is_archived).length})
              </TabsTrigger>
            </TabsList>

            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center text-sm gap-2">
                <span className="text-muted-foreground">Status:</span>
                <Badge variant="outline" className="bg-background">{tasks.filter((task) => task.status === 'todo').length} To Do</Badge>
                <Badge variant="outline" className="bg-background">{tasks.filter((task) => task.status === 'in_progress').length} In Progress</Badge>
                <Badge variant="outline" className="bg-background">{tasks.filter((task) => task.status === 'done').length} Done</Badge>
              </div>

              <Select value={sortBy} onValueChange={(val) => setSortBy(val)}>
                <SelectTrigger className="w-[180px]"><SelectValue placeholder="Sort By" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="due_date">Due Date</SelectItem>
                  <SelectItem value="created_at">Recently Created</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Tasks content */}
          <TabsContent value="all" className="flex-1 m-0">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-full min-h-0">
              <TaskColumn title="To Do" tasks={sortTasks(tasks.filter((task) => task.status === "todo"))} onTaskClick={handleTaskClick} />
              <TaskColumn title="In Progress" tasks={sortTasks(tasks.filter((task) => task.status === "in_progress"))} onTaskClick={handleTaskClick} />
              <TaskColumn title="Done" tasks={sortTasks(tasks.filter((task) => task.status === "done"))} onTaskClick={handleTaskClick} />
            </div>
          </TabsContent>
          <TabsContent value="todo"><TaskColumn title="To Do" tasks={sortTasks(tasks.filter((t) => t.status === "todo"))} onTaskClick={handleTaskClick} isFullWidth /></TabsContent>
          <TabsContent value="in_progress"><TaskColumn title="In Progress" tasks={sortTasks(tasks.filter((t) => t.status === "in_progress"))} onTaskClick={handleTaskClick} isFullWidth /></TabsContent>
          <TabsContent value="done"><TaskColumn title="Done" tasks={sortTasks(tasks.filter((t) => t.status === "done"))} onTaskClick={handleTaskClick} isFullWidth /></TabsContent>
          <TabsContent value="archived"><TaskColumn title="Archived" tasks={sortTasks(tasks.filter((t) => t.is_archived))} onTaskClick={handleTaskClick} isFullWidth /></TabsContent>
        </Tabs>
      </div>

      <CreateTaskDialog open={isCreateTask} onOpenChange={setIsCreateTask} projectId={Projectid} projectMembers={project.members} />
    </div>
  )
}

export default ProjectDetails

// TaskColumn
const TaskColumn = ({ title, tasks, onTaskClick, isFullWidth = false }) => (
  <div className="flex flex-col bg-muted/10 rounded-lg p-3 mb-5 shadow">
    {!isFullWidth && (
      <div className="flex items-center justify-between mb-3 sticky top-0 z-10">
        <h1 className="font-medium">{title}</h1>
        <Badge variant="outline">{tasks.length}</Badge>
      </div>
    )}

    <div
      className={cn(
        "flex flex-col gap-3",
        isFullWidth && "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 overflow-visible"
      )}
    >
      {tasks.length === 0 ? (
        <div className="text-center text-sm text-muted-foreground">No tasks yet</div>
      ) : (
        tasks.map((task) => (
          <TaskCard key={task.id} task={task} onClick={() => onTaskClick(task.id)} />
        ))
      )}
    </div>
  </div>
)

// TaskCard
const TaskCard = ({ task, onClick }) => {
  return (
    <Card
      onClick={onClick}
      className="cursor-pointer transform-gpu will-change-transform transition-transform duration-200 hover:scale-[1.02] hover:shadow-lg origin-center"
    >
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-shrink-0">
            <Badge
              className={
                task.priority === "high"
                  ? "bg-red-500 text-white"
                  : task.priority === "medium"
                    ? "bg-orange-500 text-white"
                    : "bg-slate-500 text-white"
              }
            >
              {task.priority}
            </Badge>
            {task.is_archived && <Badge variant="outline">Archived</Badge>}
          </div>

          <div className="flex gap-1 flex-shrink-0">
            {task.status !== "todo" && (
              <Button variant="ghost" size="icon" className="size-6">
                <AlertCircle className="size-4" />
              </Button>
            )}
            {task.status !== "in_progress" && (
              <Button variant="ghost" size="icon" className="size-6">
                <Clock className="size-4" />
              </Button>
            )}
            {task.status !== "done" && (
              <Button variant="ghost" size="icon" className="size-6">
                <CheckCircle className="size-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <h4 className="font-medium mb-2">{task.title}</h4>
        {task.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
            {task.description}
          </p>
        )}

        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            {task.assignees && task.assignees.length > 0 && (
              <div className="flex -space-x-2">
                {task.assignees.slice(0, 5).map((member) => (
                  <Avatar
                    key={member.id}
                    className="relative size-8 bg-gray-700 rounded-full border-2 border-background overflow-hidden"
                    title={member.name}
                  >
                    <AvatarImage src={member.profilePicture} />
                    <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                ))}
                {task.assignees.length > 5 && (
                  <span className="text-xs text-muted-foreground">
                    + {task.assignees.length - 5}
                  </span>
                )}
              </div>
            )}
          </div>

          {task.due_date && (
            <div className="text-xs text-muted-foreground flex items-center">
              <Calendar className="size-3 mr-1" />
              {format(new Date(task.due_date), "MMM d, yyyy")}
            </div>
          )}
        </div>

        {task.subtasks && task.subtasks.length > 0 && (
          <div className="mt-2 text-xs text-muted-foreground">
            {task.subtasks.filter((subtask) => subtask.completed).length} /{" "}
            {task.subtasks.length} subtasks
          </div>
        )}
      </CardContent>
    </Card>
  )
}
