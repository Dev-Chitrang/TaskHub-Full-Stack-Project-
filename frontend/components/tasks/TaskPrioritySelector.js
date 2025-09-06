import React from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { useUpdateTaskPriorityMutation } from '@/app/hooks/use-Tasks'
import { toast } from 'sonner'

const TaskPrioritySelector = ({ priority, taskId }) => {
    const { mutate, isPending } = useUpdateTaskPriorityMutation()
    const handlePriorityChange = (value) => {
        mutate({ taskId, priority: value },
            {
                onSuccess: () => {
                    toast.success("Status updated successfully")
                },
                onError: (error) => {
                    console.log(error)
                    toast.error("Something went wrong")
                }
            }
        )
    }
    return (
        <Select value={priority || ""} onValueChange={handlePriorityChange}>
            <SelectTrigger className={'w-[180px]'} disabled={isPending}>
                <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
            </SelectContent>
        </Select>
    )
}

export default TaskPrioritySelector