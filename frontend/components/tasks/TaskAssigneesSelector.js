import React, { useState } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { Checkbox } from '../ui/checkbox'
import { Button } from '../ui/button'
import { useUpdateTaskAssigneesMutation } from '@/app/hooks/use-Tasks'
import { toast } from 'sonner'

const TaskAssigneesSelector = ({
    task,
    assignees,
    projectMembers
}) => {
    const [selectedIds, setSelectedIds] = useState(
        assignees.map((assignee) => assignee.id)
    )
    const [dropDownOpen, setDropDownOpen] = useState(false)

    const { mutate, isPending } = useUpdateTaskAssigneesMutation()
    const handleSelectAll = () => {
        const allIds = projectMembers.map((member) => member.id)
        setSelectedIds(allIds)
    }

    const handleUnSelectAll = () => {
        setSelectedIds([])
    }

    const handleSelect = (id) => {
        let newSelected = []
        if (selectedIds.includes(id)) {
            newSelected = selectedIds.filter((sid) => sid != id)
        }
        else {
            newSelected = [...selectedIds, id]
        }
        setSelectedIds(newSelected)
    }

    const handleSave = () => {
        mutate({
            taskId: task.id,
            assignees: selectedIds,
        },
            {
                onSuccess: () => {
                    setDropDownOpen(false)
                    toast.success("Assignees updated successfully")
                },
                onError: (error) => {
                    console.log(error)
                    toast.error("Something went wrong")
                }
            }
        )
    }
    return (
        <div className='mb-6'>
            <h3 className='text-sm font-medium text-muted-foreground mb-2'>
                Assignees
            </h3>
            <div className='flex flex-wrap gap-2 mb-2'>
                {
                    selectedIds.length === 0 ? (<span className='text-sm text-muted-foreground'>Unassigned</span>) :
                        projectMembers.filter((member) => selectedIds.includes(member.id)).map((m) => (
                            <div key={m.id} className='flex items-center rounded px-2 py-1'>
                                <Avatar className={'size-6 mr-1'}>
                                    <AvatarImage src={m.profilePicture} />
                                    <AvatarFallback>
                                        {m.name.charAt(0).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                <span className='text-xs text-muted-foreground'>
                                    {m.name}
                                </span>
                            </div>
                        ))
                }
            </div>

            <div className='relative'>
                <button className='text-sm w-full border rounded px-3 py-2 text-left' onClick={() => setDropDownOpen(!dropDownOpen)}>
                    {
                        selectedIds.length === 0 ? "Select Assignees" : `${selectedIds.length} selected`
                    }
                </button>

                {
                    dropDownOpen && (
                        <div className='absolute z-10 mt-1 w-full border rounded shadow-lg max-h-60 overflow-y-auto'>
                            <div className='flex justify-between px-2 py-1 border-b'>
                                <button className='text-xs' onClick={handleSelectAll}>
                                    Select All
                                </button>
                                <button className='text-xs text-red-600' onClick={handleUnSelectAll}>
                                    UnSelect All
                                </button>
                            </div>
                            {
                                projectMembers.map((m) => (
                                    <label className='flex items-center px-3 py-2 cursor-pointer bg-accent' key={m.id}>
                                        <Checkbox checked={selectedIds.includes(m.id)} onCheckedChange={() => handleSelect(m.id)} className={'mr-2'} />
                                        <Avatar className={'size-6 mr-2'}>
                                            <AvatarImage src={m.profilePicture} />
                                            <AvatarFallback>{m.name.charAt(0).toUpperCase()}</AvatarFallback>
                                        </Avatar>
                                        <span>{m.name}</span>
                                    </label>
                                ))
                            }

                            <div className='flex justify-between px-2 py-1'>
                                <Button variant={'outline'} size={'sm'} className={'font-light'} onClickCapture={() => setDropDownOpen(false)} disable={isPending}>
                                    Cancel
                                </Button>

                                <Button size={'sm'} className={'font-light'} onClickCapture={() => handleSave()} disable={isPending}>
                                    Save
                                </Button>
                            </div>

                        </div>
                    )
                }
            </div>
        </div>
    )
}

export default TaskAssigneesSelector