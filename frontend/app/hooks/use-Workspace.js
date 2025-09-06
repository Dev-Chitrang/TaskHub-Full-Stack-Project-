import { postData, getData, updateData } from "@/lib/fetch-utils"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

export const useCreateWorkspace = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async (data) => postData("/workspaces/", data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["workspaces"] })
        }
    })
}

export const usegetWorkspacesQuery = () => {
    return useQuery({
        queryKey: ["workspaces"],
        queryFn: async () => getData("/workspaces/"),
    })
}

export const usegetWorkspaceQuery = (workspaceId) => {
    return useQuery({
        queryKey: ["workspace", workspaceId],
        queryFn: async () => getData(`/workspaces/${workspaceId}/projects`),
        enabled: !!workspaceId,
    })
}

export const usegetWorkspaceStatsQuery = (workspaceId) => {
    return useQuery({
        queryKey: ["workspace", workspaceId, "stats"],
        queryFn: async () => getData(`/workspaces/${workspaceId}/stats`),
        enabled: !!workspaceId,
    })
}

export const useGetWorkspaceDetailsQuery = (workspaceId) => {
    return useQuery({
        queryKey: ["workspace", workspaceId, "details"],
        queryFn: async () => getData(`/workspaces/${workspaceId}`),
        enabled: !!workspaceId,
    })
}

export const useInviteMemberMutation = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async ({ workspaceId, ...data }) => postData(`/workspaces/${workspaceId}/invite-member`, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ["workspace", variables.workspaceId] })
        }
    })
}

export const useAcceptInviteByTokenMutation = () => {
    return useMutation({
        mutationFn: ({ token }) => postData(`/workspaces/accept-invite-token`, { token }),
    })
}

export const useAcceptGeneratedInviteMutation = () => {
    return useMutation({
        mutationFn: ({ workspaceId }) => postData(`/workspaces/${workspaceId}/accept-invite`, {}),
    })
}

export const useToggleWorkspaceMember = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async ({ workspaceId, userId, role }) => {
            return updateData(`/workspaces/${workspaceId}/members/${userId}`, { role })
        },
        onSuccess: (data) => {
            // invalidate the specific workspace query so UI updates
            queryClient.invalidateQueries({ queryKey: ["workspace", data.workspace.id] })
        },
    })
}
