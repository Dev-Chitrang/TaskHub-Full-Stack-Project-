import React from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { useUpdateTaskStatusMutation } from '@/app/hooks/use-Tasks'
import { toast } from 'sonner'

const TaskStatusSelector = ({ status, taskId }) => {
    const { mutate, isPending } = useUpdateTaskStatusMutation()
    const handleStatusChange = (value) => {
        console.log(value)
        mutate({ taskId, status: value },
            {
                onSuccess: () => {
                    toast.success("Status updated successfully")
                },
                onError: (error) => {
                    console.log(error)
                    toast.error(error.data.message)
                }
            }
        )
    }
    return (
        <Select value={status || ""} onValueChange={handleStatusChange}>
            <SelectTrigger className={'w-[180px]'} disabled={isPending}>
                <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="todo">To Do</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="done">Done</SelectItem>
            </SelectContent>
        </Select>
    )
}

export default TaskStatusSelector
