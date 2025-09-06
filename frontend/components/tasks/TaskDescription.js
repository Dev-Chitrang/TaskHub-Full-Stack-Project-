import React, { useState } from 'react'
import { Input } from '../ui/input'
import { Button } from '../ui/button'
import { Edit } from 'lucide-react'
import { useUpdateTaskDescriptionMutation } from '@/app/hooks/use-Tasks'
import { toast } from 'sonner'


const TaskDescription = ({ description, taskId }) => {
    const [isEditing, setIsEditing] = useState(false)
    const [newDescription, setNewDescription] = useState(description)
    const { mutate, isPending } = useUpdateTaskDescriptionMutation()

    const updateDescription = () => {
        mutate({ taskId, description: newDescription }, {
            onSuccess: () => {
                setIsEditing(false)
                toast.success("Title updated successfully")
            },
            onError: (error) => {
                console.log(error)
                toast.error("Something went wrong")
            }
        })
    }

    return (

        <div className='flex items-center gap-2'>
            {
                isEditing ? <Input className={'text-sm! font-semibold w-full min-w-3xl'} value={newDescription} onChange={e => setNewDescription(e.target.value)} disabled={isPending} /> : (<h4 className='text-sm flex-1 font-semibold'>{
                    description ? description : "No description"
                }</h4>)
            }
            {
                isEditing ? <Button className={'py-0'} size={'sm'} onClick={updateDescription} disabled={isPending}>
                    Save
                </Button> : <Edit className='size-3 cursor-pointer' onClick={() => setIsEditing(true)} />
            }
        </div >
    )
}

export default TaskDescription