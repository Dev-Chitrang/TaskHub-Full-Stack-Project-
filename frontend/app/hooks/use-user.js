import { deleteData, getData, updateData } from "@/lib/fetch-utils"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

const queryKey = ['user']

export const useUserProfileQuery = () => {
    return useQuery({
        queryKey,
        queryFn: () => getData('/users/profile'),
    })
}

export const useChangePassword = () => {
    return useMutation({
        mutationFn: (data) => updateData('/users/updatePassword', data),
    })
}

export const useUpdateProfile = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (data) => updateData('/users/updateProfile', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey })
        },
    })
}

export const useDeleteProfile = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: () => deleteData('/users/deleteProfile'),
        onSuccess: () => {
            queryClient.invalidateQueries(['user']);
        },
    });
};

export const useUpdate2FA = () => {
    return useMutation({
        mutationFn: (data) => updateData('/users/update2FA', data),
    })
}

