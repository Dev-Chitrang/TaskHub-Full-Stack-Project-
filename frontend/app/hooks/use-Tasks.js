import { deleteData, getData, postData, updateData } from "@/lib/fetch-utils"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

// Create Task
export const useCreateTaskMutation = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (data) =>
            postData(`/tasks/${data.projectId}/create-task`, data),
        onSuccess: (newTask, variables) => {
            queryClient.invalidateQueries({ queryKey: ['project', variables.projectId] })
        },
    })
}


// Single Task
export const useTaskByIdQuery = (taskId) => {
    return useQuery({
        queryKey: ['task', taskId],
        queryFn: () => getData(`/tasks/${taskId}`),
        enabled: !!taskId,
    })
}

// Update Title
export const useUpdateTaskTitleMutation = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (data) => updateData(`/tasks/${data.taskId}/title`, { title: data.title }),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['task', data.id] })
            queryClient.invalidateQueries({ queryKey: ['project', data.projectId] })
        }
    })
}

// Update Description
export const useUpdateTaskDescriptionMutation = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (data) => updateData(`/tasks/${data.taskId}/description`, { description: data.description }),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['task', data.id] })
            queryClient.invalidateQueries({ queryKey: ['project', data.projectId] })
        }
    })
}

// Update Status
export const useUpdateTaskStatusMutation = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (data) => updateData(`/tasks/${data.taskId}/status`, { status: data.status }),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['task', data.id] })
            queryClient.invalidateQueries({ queryKey: ['project', data.projectId] })
        }
    })
}

// Update Assignees
export const useUpdateTaskAssigneesMutation = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (data) => updateData(`/tasks/${data.taskId}/assignees`, { assignees: data.assignees }),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['task', data.id] })
            queryClient.invalidateQueries({ queryKey: ['project', data.projectId] })
        }
    })
}

// Update Priority
export const useUpdateTaskPriorityMutation = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (data) => updateData(`/tasks/${data.taskId}/priority`, { priority: data.priority }),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['task', data.id] })
            queryClient.invalidateQueries({ queryKey: ['project', data.projectId] })
        }
    })
}

// Add Subtask
export const useAddSubTaskMutation = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (data) => postData(`/tasks/${data.taskId}/create-subtask`, { title: data.title }),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['task', variables.taskId] })
            queryClient.invalidateQueries({ queryKey: ['project', variables.projectId] })
        }
    })
}

// Update Subtask
export const useUpdateSubTaskMutation = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (data) =>
            updateData(`/tasks/${data.taskId}/update-subtask`, {
                subtaskId: data.subtaskId,
                completed: data.completed,
            }),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['task', variables.taskId] })
            queryClient.invalidateQueries({ queryKey: ['project', variables.projectId] })
        },
    })
}

// Add Comment
export const useAddCommentMutation = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (data) => postData(`/tasks/${data.taskId}/add-comment`, { text: data.text }),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['comments', data.id] })
            queryClient.invalidateQueries({ queryKey: ['task', data.id] })
        }
    })
}

// Comments
export const useCommentByIdQuery = (taskId) => {
    return useQuery({
        queryKey: ['comments', taskId],
        queryFn: () => getData(`/tasks/${taskId}/comments`),
        enabled: !!taskId,
    })
}

// Watch Task
export const useWatchTaskMutation = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (data) => postData(`/tasks/${data.taskId}/watch`, {}),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['task', variables.taskId] })
            queryClient.invalidateQueries({ queryKey: ['project', variables.projectId] })
        }
    })
}

// Archive Task
export const useArchivedTaskMutation = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (data) => postData(`/tasks/${data.taskId}/archived`, {}),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['task', data.id] })
            queryClient.invalidateQueries({ queryKey: ['project', data.projectId] })
        }
    })
}

export const useGetMyTasksQuery = () => {
    return useQuery({
        queryKey: ['my-tasks', 'user'],
        queryFn: () => getData('/tasks/mytasks'),
    })
}

export const useAddAttachmentsMutation = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({ taskId, files }) => {
            const formData = new FormData()
            files.forEach((file) => {
                formData.append('files', file)
            });
            return postData(`/tasks/${taskId}/attachments`, formData)
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['task', variables.taskId] })
            queryClient.invalidateQueries({ queryKey: ['project', variables.projectId] })
        }
    })
}

export const useDeleteAttachmentsMutation = () => {
    return useMutation({
        mutationFn: ({ taskId, attachmentIds }) => {
            const query = attachmentIds.map(id => `attachment_ids=${id}`).join("&");
            return deleteData(`/tasks/${taskId}/attachments?${query}`);
        }
    })
}

export const useGetAttachmentsQuery = (taskId) => {
    return useQuery({
        queryKey: ['attachments', taskId],
        queryFn: () => getData(`/tasks/${taskId}/attachments`),
        enabled: !!taskId
    })
}
