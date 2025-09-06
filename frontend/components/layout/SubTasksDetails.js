import React, { useState } from 'react'
import { Checkbox } from '../ui/checkbox'
import { cn } from '@/lib/utils'
import { Input } from '../ui/input'
import { Button } from '../ui/button'
import { useAddSubTaskMutation, useUpdateSubTaskMutation } from '@/app/hooks/use-Tasks'
import { toast } from 'sonner'

const SubTasksDetails = ({ subtasks, taskId }) => {
    const [newSubTask, setNewSubTask] = useState('')
    const { mutate: addSubTask, isPending: isAdding } = useAddSubTaskMutation()
    const { mutate: updateSubtask, isPending: isUpdating } = useUpdateSubTaskMutation()

    const handleToggleTask = (subtaskId, checked) => {
        updateSubtask(
            { taskId, subtaskId, completed: checked },
            {
                onSuccess: () => toast.success("Subtask updated successfully"),
                onError: (error) => {
                    console.error(error)
                    toast.error("Something went wrong")
                },
            }
        )
    }

    const handleAddSubTask = () => {
        if (!newSubTask.trim()) return
        addSubTask(
            { taskId, title: newSubTask },
            {
                onSuccess: () => {
                    setNewSubTask('')
                    toast.success("Subtask added successfully")
                },
                onError: (error) => {
                    console.error(error)
                    toast.error("Something went wrong")
                },
            }
        )
    }

    return (
        <div className="mt-6">
            <h3 className="text-sm font-medium text-muted-foreground mb-0">
                Subtasks
            </h3>
            <div className="space-y-2 mb-4">
                {subtasks.length > 0 ? (
                    subtasks.map((subtask) => (
                        <div key={String(subtask.id)} className="flex items-center space-x-2">
                            <Checkbox
                                checked={subtask.completed}
                                onCheckedChange={(checked) => handleToggleTask(subtask.id, !!checked)}
                                disabled={isUpdating || subtask.completed}
                            />
                            <label
                                className={cn(
                                    "text-sm",
                                    subtask.completed ? "line-through text-muted-foreground" : ""
                                )}
                            >
                                {subtask.title}
                            </label>
                        </div>
                    ))
                ) : (
                    <div className="text-sm text-muted-foreground">No subtasks</div>
                )}
            </div>

            <div className="flex">
                <Input
                    placeholder="Add subtask"
                    value={newSubTask}
                    onChange={(e) => setNewSubTask(e.target.value)}
                    className="mr-2"
                    disabled={isAdding}
                />
                <Button onClick={handleAddSubTask} disabled={isAdding}>
                    Add
                </Button>
            </div>
        </div>
    )
}

export default SubTasksDetails
