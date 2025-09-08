import { useRouter } from 'next/navigation'
import React from 'react'
import { Button } from './ui/button'
import { ArrowLeft } from 'lucide-react'

const BackButton = () => {
    const navigate = useRouter()
    return (
        <Button
            variant={'outline'}
            size={'sm'}
            onClick={() => navigate.back()}
            className={'p-4 mr-4'}
        >
            <ArrowLeft size={16} /> Back
        </Button>
    )
}

export default BackButton
