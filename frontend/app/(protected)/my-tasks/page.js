"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { Loader2, ArrowUpRight, CheckCircle, Clock, FilterIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useGetMyTasksQuery } from "@/app/hooks/use-Tasks";


const MyTasks = () => {
    const searchParams = useSearchParams();
    const router = useRouter();

    const initialFilter = searchParams.get("filter") || "all";
    const initialSort = searchParams.get("sort") || "desc";
    const initialSearch = searchParams.get("search") || "";

    const [filter, setFilter] = useState(initialFilter);
    const [sortDirection, setSortDirection] = useState(
        initialSort === "asc" ? "asc" : "desc"
    );
    const [search, setSearch] = useState(initialSearch);

    useEffect(() => {
        const params = new URLSearchParams();

        params.set("filter", filter);
        params.set("sort", sortDirection);
        params.set("search", search);

        router.replace(`?${params.toString()}`);
    }, [filter, sortDirection, search, router]);

    const { data: myTasks, isLoading } = useGetMyTasksQuery();

    const filteredTasks =
        myTasks?.length > 0
            ? myTasks
                .filter((task) => {
                    if (filter === "all") return true;
                    if (filter === "todo") return task.status === "todo";
                    if (filter === "inprogress") return task.status === "in_progress";
                    if (filter === "done") return task.status === "done";
                    if (filter === "achieved") return task.is_archived === true;
                    if (filter === "high") return task.priority === "high";
                    return true;
                })
                .filter(
                    (task) =>
                        task.title.toLowerCase().includes(search.toLowerCase()) ||
                        task.description?.toLowerCase().includes(search.toLowerCase())
                )
            : [];

    const sortedTasks = [...filteredTasks].sort((a, b) => {
        if (a.due_date && b.due_date) {
            return sortDirection === "asc"
                ? new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
                : new Date(b.due_date).getTime() - new Date(a.due_date).getTime();
        }
        return 0;
    });

    const todoTasks = sortedTasks.filter((task) => task.status === "todo");
    const inProgressTasks = sortedTasks.filter(
        (task) => task.status === "in_progress"
    );
    const doneTasks = sortedTasks.filter((task) => task.status === "done");

    if (isLoading)
        return (
            <div className="flex items-center justify-center h-40">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start md:items-center justify-between">
                <h1 className="text-2xl font-bold">My Tasks</h1>

                <div className="flex flex-col md:flex-row gap-2">
                    <Button
                        variant="outline"
                        onClick={() =>
                            setSortDirection(sortDirection === "asc" ? "desc" : "asc")
                        }
                    >
                        {sortDirection === "asc" ? "Oldest First" : "Newest First"}
                    </Button>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline">
                                <FilterIcon className="w-4 h-4 mr-2" /> Filter
                            </Button>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent>
                            <DropdownMenuLabel>Filter Tasks</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => setFilter("all")}>
                                All Tasks
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setFilter("todo")}>
                                To Do
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setFilter("inprogress")}>
                                In Progress
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setFilter("done")}>
                                Done
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setFilter("achieved")}>
                                Achieved
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setFilter("high")}>
                                High
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Search */}
            <Input
                placeholder="Search tasks..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="max-w-md"
            />

            {/* Tabs */}
            <Tabs defaultValue="list">
                <TabsList>
                    <TabsTrigger value="list">List View</TabsTrigger>
                    <TabsTrigger value="board">Board View</TabsTrigger>
                </TabsList>

                {/* LIST VIEW */}
                <TabsContent value="list" className={'mb-3'}>
                    <Card>
                        <CardHeader>
                            <CardTitle>My Tasks</CardTitle>
                            <CardDescription>
                                {sortedTasks?.length} tasks assigned to you
                            </CardDescription>
                        </CardHeader>

                        <CardContent>
                            <div className="divide-y">
                                {sortedTasks?.map((task) => (
                                    <div key={task.id} className="p-4 hover:bg-muted/50">
                                        <div className="flex flex-col md:flex-row md:items-center justify-between mb-2 gap-3">
                                            <div className="flex">
                                                <div className="flex gap-2 mr-2">
                                                    {task.status === "done" ? (
                                                        <CheckCircle className="size-4 text-green-500" />
                                                    ) : (
                                                        <Clock className="size-4 text-yellow-500" />
                                                    )}
                                                </div>

                                                <div>
                                                    <Link
                                                        href={`/workspaces/${task.project?.workspace}/projects/${task.project?.id}/tasks/${task.id}`}
                                                        className="font-medium hover:text-primary hover:underline transition-colors flex items-center"
                                                    >
                                                        {task.title}
                                                        <ArrowUpRight className="size-4 ml-1" />
                                                    </Link>

                                                    <div className="flex items-center space-x-2 mt-1">
                                                        <Badge
                                                            variant={
                                                                task.status === "done" ? "default" : "outline"
                                                            }
                                                        >
                                                            {task.status}
                                                        </Badge>

                                                        {task.priority && (
                                                            <Badge
                                                                variant={
                                                                    task.priority === "high"
                                                                        ? "destructive"
                                                                        : "secondary"
                                                                }
                                                            >
                                                                {task.priority}
                                                            </Badge>
                                                        )}

                                                        {task.is_archived && (
                                                            <Badge variant="outline">Archived</Badge>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="text-sm text-muted-foreground space-y-1">
                                                {task.due_date && (
                                                    <div>Due: {format(new Date(task.due_date), "PPPP")}</div>
                                                )}
                                                {task.project?.title && (
                                                    <div>
                                                        Project:{" "}
                                                        <span className="font-medium">
                                                            {task.project.title}
                                                        </span>
                                                    </div>
                                                )}

                                                {task.project?.workspace && (
                                                    <div>
                                                        Workspace:{" "}
                                                        <span className="font-medium">
                                                            {task.project.workspace}
                                                        </span>
                                                    </div>
                                                )}
                                                <div>
                                                    Modified on: {format(new Date(task.updated_at), "PPPP")}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {sortedTasks?.length === 0 && (
                                    <div className="p-4 text-center text-sm text-muted-foreground">
                                        No tasks found
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* BOARD VIEW */}
                <TabsContent value="board" className={'mb-4̥̥'}>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* To Do */}
                        <TaskColumn title="To Do" tasks={todoTasks} />
                        {/* In Progress */}
                        <TaskColumn title="In Progress" tasks={inProgressTasks} />
                        {/* Done */}
                        <TaskColumn title="Done" tasks={doneTasks} />
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default MyTasks;

const TaskColumn = ({ title, tasks }) => (
    <Card className={'mb-3'}>
        <CardHeader>
            <CardTitle className="flex items-center justify-between">
                {title}
                <Badge variant="outline">{tasks?.length}</Badge>
            </CardTitle>
        </CardHeader>

        <CardContent className="p-3 space-y-3 max-h-[600px] overflow-y-auto text-center">
            {tasks?.map((task) => (
                <Card key={task.id} className="flex flex-col p-3 hover:shadow-md transition-shadow">
                    <Link
                        href={`/workspaces/${task.project?.workspace}/projects/${task.project?.id}/tasks/${task.id}`}
                        className="flex flex-col h-full"
                    >
                        <h3 className="font-medium">{task.title}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-3 flex-grow">
                            {task.description || "No description"}
                        </p>

                        <div className="flex items-center mt-3 gap-2 flex-wrap">
                            <Badge
                                variant={
                                    task.priority === "high" ? "destructive" : "secondary"
                                }
                            >
                                {task.priority}
                            </Badge>

                            {task.is_archived && (
                                <Badge variant="outline">Archived</Badge>
                            )}

                            {task.due_date && (
                                <span className="text-sm text-muted-foreground ml-auto">
                                    {format(new Date(task.due_date), "PPPP")}
                                </span>
                            )}
                        </div>
                    </Link>
                </Card>
            ))}

            {tasks?.length === 0 && (
                <div className="p-4 text-center text-sm text-muted-foreground">
                    No tasks found
                </div>
            )}
        </CardContent>
    </Card>
);
