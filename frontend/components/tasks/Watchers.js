import React from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'

const Watchers = ({ watchers }) => {
    return (
        <div className='bg-card rounded-lg p-6 shadow-sm mb-6'>
            <h3 className='text-lg font-medium mb-4'>Watchers</h3>

            <div className='space-y-2'>
                {
                    watchers && watchers.length > 0 ? (
                        watchers.map((watcher) => (
                            <div key={watcher.id} className='flex items-center gap-2'>
                                <Avatar className={'size-6'}>
                                    <AvatarImage src={watcher.profilePicture} />
                                    <AvatarFallback>{watcher.name.chartAt(0).toUpperCase()}</AvatarFallback>
                                </Avatar>
                            </div>
                        ))
                    ) : (<p className='text-sm text-muted-foreground'>No watchers yet</p>)
                }
            </div>
        </div>
    )
}

export default Watchers