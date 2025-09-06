import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

const statusLabels = {
    todo: "To Do",
    in_progress: "In Progress",
    completed: "Completed",
}

const UpcomingTasks = ({ upcomingTasks }) => {
    return (
        <Card className="shadow-lg">
            <CardHeader>
                <CardTitle>Upcoming Tasks</CardTitle>
            </CardHeader>
            <CardContent>
                <ul>
                    {upcomingTasks.map(task => (
                        <li key={task.id} className="border-b py-2">
                            <strong>{task.title}</strong> - {statusLabels[task.status] || task.status} ({task.priority})
                        </li>
                    ))}
                </ul>
            </CardContent>
        </Card>
    );
};

export default UpcomingTasks;
