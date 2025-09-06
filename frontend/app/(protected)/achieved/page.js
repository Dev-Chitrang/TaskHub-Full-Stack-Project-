"use client"

import React from "react"
import Link from "next/link"
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { format, formatDistanceToNow } from "date-fns"
import { Loader, CheckCircle, ArrowUpRight } from "lucide-react"
import BackButton from "@/components/BackButton"
import { UseGetAchievementsQuery } from "@/app/hooks/use-Project"

const ProjectColumn = ({ title, projects }) => (
    <Card>
        <CardHeader>
            <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
            {projects.length === 0 ? (
                <p className="text-sm text-muted-foreground">No projects</p>
            ) : (
                projects.map((p) => (
                    <div
                        key={p.id}
                        className="p-3 rounded-md border hover:bg-muted/50 transition"
                    >
                        <Link
                            href={`/workspaces/${p.workspace_id}/projects/${p.id}/`}
                            className="font-medium hover:text-primary hover:underline transition-colors flex items-center"
                        >
                            {p.title}
                            <ArrowUpRight className="size-4 ml-1" />
                        </Link>
                        <p className="text-xs text-muted-foreground mb-1">
                            {p.description || "No description"}
                        </p>
                        {/* Workspace tag with color */}
                        <div className="flex items-center gap-2 text-xs mb-1">
                            <span
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: p.workspace_color }}
                            />
                            <span className="font-medium">{p.workspace_name}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Completed{" "}
                            {formatDistanceToNow(new Date(p.completed_at), { addSuffix: true })}
                        </p>
                    </div>
                ))
            )}
        </CardContent>
    </Card>
)

const AchievementsPage = () => {
    const { data, isLoading, error } = UseGetAchievementsQuery()

    if (isLoading)
        return (
            <div className="text-center py-10">
                <Loader className="w-10 h-10 animate-spin mx-auto" />
            </div>
        )

    if (error) {
        console.log(error)
        return (
            <div className="text-center py-10 text-red-500">
                Failed to load achievements
            </div>
        )
    }

    const { projects = [], tasks = [] } = data || {}

    return (
        <div className="max-w-6xl mx-auto py-8 px-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <BackButton />
                <h1 className="text-2xl font-semibold text-center flex-1">
                    Achievements
                </h1>
                <div className="w-10" />
            </div>

            {/* Tabs for switching between tasks/projects */}
            <Tabs defaultValue="list">
                <TabsList>
                    <TabsTrigger value="list">Tasks</TabsTrigger>
                    <TabsTrigger value="board">Projects</TabsTrigger>
                </TabsList>

                {/* TASKS LIST VIEW */}
                <TabsContent value="list">
                    <Card>
                        <CardHeader>
                            <CardTitle>Completed Tasks</CardTitle>
                            <CardDescription>{tasks.length} tasks completed</CardDescription>
                        </CardHeader>

                        <CardContent>
                            <div className="divide-y">
                                {tasks.map((task) => (
                                    <div
                                        key={task.id}
                                        className="p-4 hover:bg-muted/50 transition"
                                    >
                                        <div className="flex flex-col md:flex-row md:items-center justify-between mb-2 gap-3">
                                            <div className="flex">
                                                <CheckCircle className="size-4 text-green-500 mr-2 mt-1" />
                                                <div>
                                                    <Link
                                                        href={`/workspaces/${task.workspace_id}/projects/${task.project_id}/tasks/${task.id}`}
                                                        className="font-medium hover:text-primary hover:underline transition-colors flex items-center"
                                                    >
                                                        {task.title}
                                                        <ArrowUpRight className="size-4 ml-1" />
                                                    </Link>
                                                    <div className="mt-1 text-xs text-muted-foreground">
                                                        Project:{" "}
                                                        <span className="font-medium">{task.project}</span>
                                                    </div>
                                                    {/* Workspace name + color */}
                                                    <div className="flex items-center gap-2 text-xs mt-1">
                                                        <span
                                                            className="w-3 h-3 rounded-full"
                                                            style={{ backgroundColor: task.workspace_color }}
                                                        />
                                                        <span className="font-medium">{task.workspace}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                Completed on {format(new Date(task.completed_at), "PPPP")}
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {tasks.length === 0 && (
                                    <div className="p-4 text-center text-sm text-muted-foreground">
                                        No tasks found
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* PROJECTS BOARD VIEW */}
                <TabsContent value="board" className="mb-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <ProjectColumn title="Completed Projects" projects={projects} />
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    )
}

export default AchievementsPage
