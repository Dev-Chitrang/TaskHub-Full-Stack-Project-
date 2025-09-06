import React from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

const StackedTaskChart = ({ projects }) => {
    // Transform data for the chart
    const data = projects.map((project) => {
        const totalTasks = project.tasks || [];
        const done = totalTasks.filter(t => t.status === "done").length;
        const inProgress = totalTasks.filter(t => t.status === "in_progress").length;
        const toDo = totalTasks.filter(t => t.status === "to_do" || t.status === "todo").length;

        return {
            name: project.title,
            Done: done,
            InProgress: inProgress,
            ToDo: toDo,
        };
    });

    const COLORS = {
        Done: "#10b981",       // Green
        InProgress: "#f59e0b", // Amber
        ToDo: "#3b82f6",       // Blue
    };

    return (
        <Card className="shadow-lg">
            <CardHeader>
                <CardTitle>Task Status per Project</CardTitle>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={data} margin={{ top: 20, right: 20, left: 0, bottom: 20 }}>
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend verticalAlign="bottom" />
                        <Bar dataKey="Done" stackId="a" fill={COLORS.Done} />
                        <Bar dataKey="InProgress" stackId="a" fill={COLORS.InProgress} />
                        <Bar dataKey="ToDo" stackId="a" fill={COLORS.ToDo} />
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
};

export default StackedTaskChart;
