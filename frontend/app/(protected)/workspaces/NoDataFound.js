import { Button } from '@/components/ui/button'
import { CirclePlus, Folder } from 'lucide-react'
import React from 'react'

const NoDataFound = ({
    title,
    description,
    buttonText,
    buttonAction
}) => {
    return (
        <div className='col-span-full text-center py-12 2xl:py-24 bg-muted/40 rounded-lg'>
            <Folder className='size-12 mx-auto text-muted-foreground' />
            <h3 className='mt-4 text-lg font-semibold'>{title}</h3>
            <p className='mt-2 text-sm text-muted-foreground max-w-sm mx-auto'>
                {description}
            </p>
            <Button onClick={buttonAction} className='mt-4 bg-emerald-500 hover:bg-emerald-500'>
                <CirclePlus className='size-4 mr-2' />
                {buttonText}
            </Button>
        </div>
    )
}

export default NoDataFound