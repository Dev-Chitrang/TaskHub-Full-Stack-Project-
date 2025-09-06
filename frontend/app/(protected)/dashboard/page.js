'use client'

import { usegetWorkspaceStatsQuery } from '@/app/hooks/use-Workspace'
import KpiCards from '@/components/dashboard/KpiCards'
import ProjectStatusChart from '@/components/dashboard/ProjectStatusChart'
import RecentProjects from '@/components/dashboard/RecentProjects'
import StackedTaskChart from '@/components/dashboard/StackedTaskChart'
import TaskPriorityChart from '@/components/dashboard/TaskPriorityChart'
import TasksDueToday from '@/components/dashboard/TasksDueToday'
import TaskTrendsChart from '@/components/dashboard/TaskTrendsChart'
import UpcomingTasks from '@/components/dashboard/UpcomingTasks'
import { Loader } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import React, { useEffect, useMemo, useState } from 'react'
import Pagination from '@/components/dashboard/Pagination'

const Dashboard = () => {
  const searchParams = useSearchParams()
  const [workspaceId, setWorkspaceId] = useState(null) // 🔹 fixed variable name

  useEffect(() => {
    const id = searchParams.get('workspaceId')
    setWorkspaceId(id)
  }, [searchParams])

  const { data, isPending } = usegetWorkspaceStatsQuery(workspaceId, {
    enabled: !!workspaceId,
  })

  const [currentPage, setCurrentPage] = useState(1)
  const projectsPerPage = 5

  const tasksDueToday = useMemo(() => {
    if (!data?.recentProjects) return []

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    let tasks = []

    data.recentProjects.forEach(project => {
      (project.tasks || []).forEach(task => {
        if (task.is_archived) return
        const dueDate = new Date(task.due_date)
        dueDate.setHours(0, 0, 0, 0)

        if (dueDate.getTime() === today.getTime()) {
          tasks.push({ ...task, projectTitle: project.title })
        }
      })
    })

    return tasks
  }, [data?.recentProjects])

  const paginatedProjects = useMemo(() => {
    if (!data?.recentProjects) return []
    const start = (currentPage - 1) * projectsPerPage
    const end = start + projectsPerPage
    return data.recentProjects.slice(start, end)
  }, [data?.recentProjects, currentPage])

  const totalPages = data?.recentProjects
    ? Math.ceil(data.recentProjects.length / projectsPerPage)
    : 0

  // Conditional UI rendering
  if (!workspaceId) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-muted-foreground">
        <p className="text-lg">
          Select a workspace from the top dropdown to view your dashboard.
        </p>
      </div>
    )
  }

  if (isPending) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader className="h-10 w-10 animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-4 space-y-4">
      <KpiCards stats={data.stats} recentProjects={data.recentProjects} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ProjectStatusChart projects={data.recentProjects} />
        <TaskPriorityChart projects={data.recentProjects} />
        <StackedTaskChart projects={data.recentProjects} />
      </div>

      <TaskTrendsChart taskTrends={data.taskTrendsData} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <UpcomingTasks upcomingTasks={data.upcomingTasks} />
        <TasksDueToday tasksDueToday={tasksDueToday} />
      </div>

      <RecentProjects projects={paginatedProjects} />
      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}
    </div>
  )
}

export default Dashboard
