import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { getTaskStatusColor } from '@/lib'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { CalendarDays } from 'lucide-react'
import Link from 'next/link'
import React from 'react'

const ProjectCard = ({ project, progress, workspaceId }) => {
    return (
        <Link href={`/workspaces/${workspaceId}/projects/${project.id}`}>
            <Card className='transition-all duration-300 hover:shadow-md hover:-translate-y-1'>
                <CardHeader>
                    <div className='space-y-1'>
                        <div className='flex items-center justify-between'>
                            <CardTitle>{project.title}</CardTitle>
                            <span className={cn('px-2 py-0.5 text-xs rounded-full', getTaskStatusColor(project.status))}>
                                {project.status}
                            </span>
                        </div>

                        <CardDescription className={'line-clamp-2'}>{project.description}</CardDescription>
                    </div>
                </CardHeader>

                <CardContent>
                    <div className='space-y-4'>
                        {/* Progress Label + % in one row */}
                        <div className='space-y-1'>
                            <div className='flex justify-between text-xs'>
                                <span>Progress</span>
                                <span>{progress}%</span>
                            </div>
                            <Progress value={progress} className='h-2' />
                        </div>

                        <div className='flex items-center justify-between'>
                            <div className='flex items-center text-sm gap-2 text-muted-foreground'>
                                <span>
                                    {project.tasks.length} tasks
                                </span>
                            </div>
                            {
                                project.due_date && (
                                    <div className='flex items-center text-xs'>
                                        <CalendarDays className='w-4 h-4 mr-1' />
                                        <span>{format(project.due_date, "MMM d, yyyy")}</span>
                                    </div>
                                )
                            }
                        </div>
                    </div>
                </CardContent>
            </Card>
        </Link>
    )
}

export default ProjectCard
