import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

const statusLabels = {
    todo: "To Do",
    in_progress: "In Progress",
    completed: "Completed",
}


const TasksDueToday = ({ tasksDueToday }) => (
    <Card className="shadow-lg">
        <CardHeader>
            <CardTitle>Tasks Due Today</CardTitle>
        </CardHeader>
        <CardContent>
            <ul>
                {tasksDueToday.map(t => (
                    <li key={t.id} className="border-b py-2">
                        <strong>{t.title}</strong> - {statusLabels[t.status] || t.status} ({t.priority})
                    </li>
                ))}
            </ul>
        </CardContent>
    </Card>
);

export default TasksDueToday;
