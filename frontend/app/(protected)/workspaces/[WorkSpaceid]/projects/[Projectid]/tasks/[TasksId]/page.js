'use client'

import React, { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useArchivedTaskMutation, useTaskByIdQuery, useWatchTaskMutation, useAddAttachmentsMutation, useDeleteAttachmentsMutation, useGetAttachmentsQuery } from '@/app/hooks/use-Tasks'
import { Eye, EyeOff, Loader, Paperclip, Trash } from 'lucide-react'
import { useAuth } from '@/app/provider/AuthContext'
import BackButton from '@/components/BackButton'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import TaskTitle from '@/components/tasks/TaskTitle'
import { formatDistanceToNow } from 'date-fns'
import TaskStatusSelector from '@/components/tasks/TaskStatusSelector'
import TaskDescription from '@/components/tasks/TaskDescription'
import TaskAssigneesSelector from '@/components/tasks/TaskAssigneesSelector'
import TaskPrioritySelector from '@/components/tasks/TaskPrioritySelector'
import SubTasksDetails from '@/components/layout/SubTasksDetails'
import Watchers from '@/components/tasks/Watchers'
import TaskActivity from '@/components/tasks/TaskActivity'
import CommentSection from '@/components/tasks/CommentSection'
import { toast } from 'sonner'

const TaskDetails = () => {
    const { user } = useAuth()
    const { TasksId, Projectid } = useParams()
    const router = useRouter()
    const { data, isLoading } = useTaskByIdQuery(TasksId)
    const { mutate: watchTask, isPending: isWatching } = useWatchTaskMutation()
    const { mutate: archivedTask, isPending: isArchived } = useArchivedTaskMutation()

    // attachment state
    const [files, setFiles] = useState([])
    const { data: attachments = [], refetch } = useGetAttachmentsQuery(TasksId)
    const { mutate: addAttachments, isPending: isAdding } = useAddAttachmentsMutation()
    const { mutate: deleteAttachments, isPending: isDeleting } = useDeleteAttachmentsMutation()

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <Loader className="w-10 h-10 animate-spin" />
            </div>
        )
    }

    if (!data) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className='text-2xl font-bold'>Task not found</div>
            </div>
        )
    }

    const { task, project } = data
    const isUserWatching = task?.watchers?.some(
        (watcher) => watcher.toString() === user?.id.toString()
    )

    const handleWatchTask = () => {
        watchTask({ taskId: task.id }, {
            onSuccess: () => {
                toast.success("Task Watched")
            },
            onError: (error) => {
                console.log(error)
                toast.error(error?.data?.message || "Something went wrong")
            }
        })
    }

    const handleArchivTask = () => {
        archivedTask({ taskId: task.id }, {
            onSuccess: () => {
                toast.success("Task Archived")
            },
            onError: (error) => {
                console.log(error)
                toast.error(error?.data?.message || "Something went wrong")
            }
        })
    }

    const handleFileChange = (e) => {
        setFiles(Array.from(e.target.files))
    }

    const handleUpload = () => {
        if (!files.length) return
        addAttachments(
            { taskId: task.id, projectId: project.id, files },
            {
                onSuccess: () => {
                    toast.success("Attachments uploaded successfully")
                    setFiles([])
                    refetch()
                },
                onError: (error) => {
                    console.log(error)
                    toast.error(error?.data?.message || "Upload failed")
                }
            }
        )
    }

    const handleDelete = (attachmentId) => {
        deleteAttachments(
            { taskId: task.id, attachmentIds: [attachmentId] },
            {
                onSuccess: () => {
                    toast.success("Attachment deleted")
                    refetch()
                },
                onError: (error) => {
                    console.log(error)
                    toast.error(error?.data?.message || "Delete failed")
                }
            }
        )
    }

    return (
        <div className='container mx-auto p-0 py-y md:px-4'>
            <div className='flex flex-col md:flex-row items-center justify-between mb-6'>
                <div className='flex flex-col md:flex-row md:items-center'>
                    <BackButton />
                    <h1 className='text-xl md:text-2xl font-semibold'>
                        {task.title}
                    </h1>
                    {
                        task.is_archived && (<Badge className={'ml-2'} variant={'outline'}>Archived</Badge>)
                    }
                </div>
                <div className='flex space-x-2 mt-4 md:mt-0'>
                    <Button variant={'outline'} size={'sm'} onClick={handleWatchTask} className={'w-fit'} disabled={isWatching}>
                        {
                            isUserWatching ? (<>
                                <EyeOff className='mr-2 size-4' />
                                Unwatch
                            </>) : (<>
                                <Eye className='mr-2 size-4' />
                                Watch
                            </>)
                        }
                    </Button>
                    <Button variant={'outline'} size={'sm'} onClick={handleArchivTask} className={'w-fit'} disabled={isArchived}>
                        {
                            task.is_archived ? "Unarchive" : "Archive"
                        }
                    </Button>
                </div>
            </div>

            <div className='flex flex-col lg:flex-row gap-6'>
                <div className='flex-1'>
                    <div className='bg-card rounded-lg p-6 shadow-sm mb-6'>
                        <div className='flex flex-col md:flex-row justify-between items-start mb-4'>
                            <div>
                                <Badge variant={
                                    task.project === 'high' ? 'destructive' : task.priority === 'medium' ? 'default' : 'outline'
                                } className={'mb-2 capitalize'}>
                                    {task.priority} Priority
                                </Badge>
                                <TaskTitle title={task.title} taskId={task.id} />

                                <div className='text-md text-muted-foreground'>
                                    Created at: {" "}
                                    {
                                        formatDistanceToNow(new Date(task.created_at), { addSuffix: true })
                                    }
                                </div>
                            </div>
                            <div className='flex items-center gap-2 mt-4 md:mt-0'>
                                <TaskStatusSelector status={task.status} taskId={task.id} />

                                <Button variant='destructive' size={'sm'} onClick={() => { }} className={'hidden md:block'}>
                                    <Trash />
                                </Button>
                            </div>
                        </div>

                        <div className='mb-6'>
                            <h3 className='text-md font-medium text-muted-foreground mb-0'>
                                Description
                            </h3>
                            <TaskDescription description={task.description} taskId={task.id} />
                        </div>

                        <TaskAssigneesSelector task={task} assignees={task.assignees} projectMembers={project.members} />
                        <TaskPrioritySelector priority={task.priority} taskId={task.id} />

                        <SubTasksDetails subtasks={task.subtasks} taskId={task.id} />
                    </div>

                    {/* Attachments Section */}
                    <div className='bg-card rounded-lg p-6 shadow-sm mb-6'>
                        <h3 className='text-md font-medium text-muted-foreground mb-4 flex items-center'>
                            <Paperclip className="mr-2 h-4 w-4" /> Attachments
                        </h3>
                        <div className="space-y-2">
                            {attachments?.length > 0 ? (
                                attachments.map((att) => (
                                    <div
                                        key={att.id}
                                        className="flex items-center justify-between bg-muted/10 p-2 rounded"
                                    >
                                        <a
                                            href={`/api-v1/tasks/attachments/download/${att.file_url.split('/').slice(-1)[0]}`}
                                            download={att.fileName}
                                            className="text-blue-600 hover:underline"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                fetch(e.currentTarget.href)
                                                    .then((res) => res.blob())
                                                    .then((blob) => {
                                                        const url = window.URL.createObjectURL(blob);
                                                        const a = document.createElement("a");
                                                        a.href = url;
                                                        a.download = att.file_name; // original filename
                                                        document.body.appendChild(a);
                                                        a.click();
                                                        a.remove();
                                                        window.URL.revokeObjectURL(url);
                                                    });
                                            }}
                                        >
                                            {att.file_name}
                                        </a>

                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleDelete(att.id)}
                                            disabled={isDeleting}
                                        >
                                            <Trash className="h-4 w-4 text-red-500" />
                                        </Button>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-muted-foreground">No attachments</p>
                            )}
                        </div>

                        {/* File input + Upload button */}
                        <div className="mt-4 flex items-center gap-2">
                            <input
                                type="file"
                                id="file-upload"
                                multiple
                                onChange={handleFileChange}
                                className="block w-full text-sm
                 file:mr-4 file:py-2 file:px-4
                 file:rounded-md file:border
                 file:text-sm file:font-semibold"
                            />
                            <Button
                                onClick={handleUpload}
                                disabled={isAdding || !files.length}
                                className="shrink-0"
                            >
                                Upload
                            </Button>
                        </div>
                    </div>


                    <CommentSection taskId={task.id} members={project.members || []} />

                </div>

                {/* Right */}
                <div className='flex-1'>
                    <Watchers watchers={task.watchers} />
                    <TaskActivity resourceId={task.id} />
                </div>
            </div>
        </div >
    )
}

export default TaskDetails
