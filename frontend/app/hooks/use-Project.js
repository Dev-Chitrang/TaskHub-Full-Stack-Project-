import { getData, postData, deleteData, updateData } from '@/lib/fetch-utils'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'

/**
 * Create Project inside a workspace
 */
export const UserCreateProject = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async (data) =>
            postData(`/projects/${data.workspaceId}/create-project`, data),
        onSuccess: (data) => {
            queryClient.invalidateQueries({
                queryKey: ['workspace', data.workspace],
            })
        },
    })
}

/**
 * Archive / Unarchive a project
 */
export const UseArchiveProject = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async ({ projectId }) =>
            updateData(`/projects/${projectId}/archive`),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['project', data.id] })
        },
    })
}

/**
 * Change Project Status
 */
export const UseChangeProjectStatus = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async ({ projectId, status }) =>
            updateData(`/projects/${projectId}/status-change`, { status }),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['project', data.id] })
        },
    })
}

/**
 * Update Project Title
 */
export const UseUpdateProjectTitle = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async ({ projectId, title }) =>
            updateData(`/projects/${projectId}/title`, { title }),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['project', data.id] })
        },
    })
}

/**
 * Update Project Description
 */
export const UseUpdateProjectDescription = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async ({ projectId, description }) =>
            updateData(`/projects/${projectId}/description`, { description }),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['project', data.id] })
        },
    })
}

/**
 * Add or Remove Project Member
 */
// hooks/use-Project.ts
export const UseToggleProjectMember = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async ({ projectId, userId, role }) =>
            updateData(`/projects/${projectId}/members/${userId}`, { role }), // role can be "manager", "viewer", "contributor", or null
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['project', data.project.id] })
        },
    })
}

/**
 * Fetch tasks of a project
 */
export const UseProjectQuery = (projectId) => {
    return useQuery({
        queryKey: ['project', projectId],
        queryFn: async () => getData(`/projects/${projectId}/tasks`),
    })
}

/**
 * Fetch achievements
 */
export const UseGetAchievementsQuery = () => {
    return useQuery({
        queryKey: ['achievements'],
        queryFn: async () => getData(`/projects/achievements`),
        staleTime: 1000 * 60 * 2,
        refetchOnWindowFocus: false,
    })
}
