import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import React, { useMemo } from 'react'
import { cn } from '@/lib/utils'
import { Progress } from '../ui/progress'

// Local helpers (kept internal for portability)
const getProjectProgress = (tasks = []) => {
    const total = tasks.length || 0
    const done = tasks.filter((t) => (t.status || '').toLowerCase() === 'done').length
    return total > 0 ? Math.round((done / total) * 100) : 0
}

const getStatusBadgeClass = (status, isArchived) => {
    if (isArchived) return 'bg-gray-200 text-gray-900'
    const s = (status || '').toLowerCase()
    if (s === 'completed') return 'bg-emerald-100 text-emerald-700'
    if (s === 'in_progress') return 'bg-amber-100 text-amber-700'
    if (s === 'planning') return 'bg-blue-100 text-blue-700'
    return 'bg-muted text-foreground'
}

const prioritySplit = (tasks = []) => {
    const c = { high: 0, medium: 0, low: 0 }
    for (const t of tasks) {
        const p = (t.priority || '').toLowerCase()
        if (p === 'high' || p === 'medium' || p === 'low') c[p] += 1
    }
    const total = tasks.length || 0
    const pct = (n) => (total ? Math.round((n / total) * 100) : 0)
    return { total, high: pct(c.high), medium: pct(c.medium), low: pct(c.low) }
}

const dueStatusLabel = (due) => {
    if (!due) return null
    const now = new Date()
    const d = new Date(due)
    const diffDays = Math.floor((d.setHours(0, 0, 0, 0) - now.setHours(0, 0, 0, 0)) / (1000 * 60 * 60 * 24))
    if (diffDays < 0) return 'Overdue'
    if (diffDays === 0) return 'Due today'
    if (diffDays === 1) return 'Due tomorrow'
    return `Due in ${diffDays} days`
}

const RecentProjects = ({ projects = [] }) => {
    const searchParams = useSearchParams()
    const workspaceId = searchParams.get('workspaceId')

    const items = useMemo(() => projects || [], [projects])

    return (
        <Card className="lg:col-span-2 shadow-lg">
            <CardHeader>
                <CardTitle>Recent Projects</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {items.length === 0 ? (
                    <p className="py-8 text-center text-muted-foreground">No recent projects yet</p>
                ) : (
                    items.map((project) => {
                        const projectProgress = getProjectProgress(project.tasks)
                        const prio = prioritySplit(project.tasks)
                        const dueLabel = dueStatusLabel(project.due_date)

                        return (
                            <div key={project.id} className="rounded-lg border p-4">
                                <div className="mb-2 flex items-center justify-between">
                                    <Link href={`/workspaces/${workspaceId}/projects/${project.id}`}>
                                        <h3 className="font-medium transition-colors hover:text-primary">
                                            {project.title}
                                        </h3>
                                    </Link>
                                    <span className={cn('rounded-full px-2 py-1 text-xs', getStatusBadgeClass(project.status, project.is_archived))}>
                                        {project.is_archived ? 'Archived' : project.status}
                                    </span>
                                </div>

                                <p className="mb-3 line-clamp-3 text-sm text-muted-foreground">{project.description}</p>

                                {/* Progress */}
                                <div className="space-y-1">
                                    <div className="flex items-center justify-between text-xs">
                                        <span>Progress</span>
                                        <span>{projectProgress}%</span>
                                    </div>
                                    <Progress value={projectProgress} className="h-2" />
                                </div>

                                {/* Mini priority distribution */}
                                <div className="mt-3 space-y-1">
                                    <div className="flex items-center justify-between text-xs">
                                        <span>Priority Mix</span>
                                        <span>
                                            Low {prio.low}% • Medium {prio.medium}% • High {prio.high}%
                                        </span>
                                    </div>
                                    <div className="flex h-2 w-full overflow-hidden rounded-full">
                                        <div className="h-full bg-green-500" style={{ width: `${prio.low}%` }} />
                                        <div className="h-full bg-yellow-500" style={{ width: `${prio.medium}%` }} />
                                        <div className="h-full bg-red-500" style={{ width: `${prio.high}%` }} />
                                    </div>
                                </div>

                                {/* Due status */}
                                {dueLabel && (
                                    <div className="mt-3 text-xs text-muted-foreground">
                                        {dueLabel}
                                    </div>
                                )}

                                {/* Tags */}
                                {Array.isArray(project.tags) && project.tags.length > 0 && (
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        {project.tags.map((tag, i) => (
                                            <span key={i} className="rounded-full bg-muted px-2 py-1 text-xs text-muted-foreground">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )
                    })
                )}
            </CardContent>
        </Card>
    )
}

export default RecentProjects
