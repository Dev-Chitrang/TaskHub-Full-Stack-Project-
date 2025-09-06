import { getData } from '@/lib/fetch-utils'
import { useQuery } from '@tanstack/react-query'
import { Loader } from 'lucide-react'
import React from 'react'
import { getActivityIcon } from './TaskIcon'

const TaskActivity = ({ resourceId }) => {
    const { data, isPending } = useQuery({
        queryKey: ['task-activity', resourceId],
        queryFn: () => getData(`/tasks/${resourceId}/activity`),
    })

    if (isPending) return <Loader className='animate-spin' />
    return (

        <div className='bg-card rounded-lg p-6 shadow-sm'>
            <h3 className='text-lg text-muted-foreground mb-4'>Activity</h3>

            <div className='space-y-4'>
                {
                    data.map((activity) => (
                        <div key={activity.id} className='flex gap-2'>
                            <div className='size-8 rounded-full flex items-center justify-center text-primary'>
                                {
                                    getActivityIcon(activity.action)
                                }
                            </div>
                            <div>
                                <p className='text-sm'>
                                    <span className='font-medium'>
                                        {activity.user.name}
                                    </span> {" "}
                                    {activity.details?.description}
                                </p>
                            </div>
                        </div>
                    ))
                }
            </div>
        </div>
    )
}

export default TaskActivity