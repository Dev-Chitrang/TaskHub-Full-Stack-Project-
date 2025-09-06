import React from 'react'
import { cn } from '@/lib/utils'
import { Button } from '../ui/button'
import { usePathname } from 'next/navigation'
import { useRouter } from 'next/navigation'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip'

const SidebarNav = ({
    items, isCollapsed, className, currentWorkspace, ...props
}) => {
    const location = usePathname()
    const router = useRouter()
    return (
        <nav className={cn("flex flex-col gap-y-2", className)} {...props}>
            {
                items.map((element) => {
                    const Icon = element.icon
                    const isActive = location === element.href
                    const handleClick = () => {
                        if (element.href === "/workspacee") {
                            router.push(element.href)
                        }
                        else if (currentWorkspace && currentWorkspace._id) {
                            router.push(`${element.href}?workspaceId=${currentWorkspace._id}`)
                        }
                        else {
                            router.push(element.href)
                        }
                    }
                    return (
                        <TooltipProvider key={element.href}>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant={'ghost'} className={cn('justify-start', isActive && 'underline underline-offset-4 bg-blue-400')} onClick={handleClick}>
                                        <Icon className='mr-2 size-5' />
                                        {
                                            isCollapsed ? (<span className='sr-only hover:'>element.title</span>) : (element.title)
                                        }
                                    </Button>
                                </TooltipTrigger>
                                {
                                    isCollapsed && (
                                        <TooltipContent side='right'>
                                            {element.title}
                                        </TooltipContent>
                                    )
                                }
                            </Tooltip>
                        </TooltipProvider>
                    )
                })
            }
        </nav>
    )
}

export default SidebarNav