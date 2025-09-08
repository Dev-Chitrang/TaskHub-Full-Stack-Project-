"use client";

import React, { useMemo } from "react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    CartesianGrid,
    Legend,
    LineChart,
    Line,
} from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

const TaskTrendsChart = ({ taskTrends }) => {
    const data = taskTrends || [];

    // Totals across the week
    const totals = useMemo(() => {
        return data.reduce(
            (acc, day) => {
                acc.completed += day.completed;
                acc.inProgress += day.inProgress;
                acc.toDo += day.toDo;
                acc.archived += day.archived;
                return acc;
            },
            { completed: 0, inProgress: 0, toDo: 0, archived: 0 }
        );
    }, [data]);

    // Weekly summary
    const summary = useMemo(() => {
        if (!data.length) return "No task activity in the last 7 days.";

        const maxDay = data.reduce(
            (max, d) =>
                d.completed > max.completed ? { name: d.name, completed: d.completed } : max,
            { name: "", completed: 0 }
        );

        const totalTasks =
            totals.completed + totals.inProgress + totals.toDo + totals.archived;
        const completionRate = totalTasks
            ? Math.round((totals.completed / totalTasks) * 100)
            : 0;

        return `This week, most tasks were completed on ${maxDay.name}. Overall completion rate is ${completionRate}%.`;
    }, [data, totals]);

    // Task velocity: approximate "created" = toDo + inProgress that day
    const velocityData = useMemo(() => {
        return data.map((d) => ({
            name: d.name,
            created: d.toDo + d.inProgress,
            completed: d.completed,
        }));
    }, [data]);

    return (
        <Card className="shadow-lg">
            <CardHeader>
                <CardTitle>Task Trends & Velocity (Last 7 Days)</CardTitle>
            </CardHeader>
            <CardContent>
                {/* Task Trends Chart (Stacked Bar for clarity) */}
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="toDo" stackId="a" fill="#3b82f6" />
                            <Bar dataKey="inProgress" stackId="a" fill="#f59e0b" />
                            <Bar dataKey="completed" stackId="a" fill="#10b981" />
                            <Bar dataKey="archived" stackId="a" fill="#6b7280" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Legend Summary */}
                <div className="flex justify-around mt-4 text-sm">
                    <span className="flex items-center gap-1">
                        <span className="w-3 h-3 bg-green-400 rounded-sm"></span>
                        Completed: {totals.completed}
                    </span>
                    <span className="flex items-center gap-1">
                        <span className="w-3 h-3 bg-yellow-400 rounded-sm"></span>
                        In Progress: {totals.inProgress}
                    </span>
                    <span className="flex items-center gap-1">
                        <span className="w-3 h-3 bg-blue-400 rounded-sm"></span>
                        To Do: {totals.toDo}
                    </span>
                    <span className="flex items-center gap-1">
                        <span className="w-3 h-3 bg-gray-400 rounded-sm"></span>
                        Archived: {totals.archived}
                    </span>
                </div>

                {/* Weekly summary */}
                <div className="mt-4 p-3 rounded-md text-gray-700 text-sm">
                    {summary}
                </div>

                {/* Task Velocity Chart */}
                <div className="h-64 mt-6">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={velocityData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Line type="monotone" dataKey="created" stroke="#3b82f6" />
                            <Line type="monotone" dataKey="completed" stroke="#10b981" />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
};

export default TaskTrendsChart;
