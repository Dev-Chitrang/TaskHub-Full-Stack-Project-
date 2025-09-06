import React from "react";
import { PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

const COLORS = ["#ef4444", "#f59e0b", "#10b981", "#6b7280"];

const TaskPriorityChart = ({ projects }) => {
    let high = 0, medium = 0, low = 0, archived = 0;

    projects.forEach(p => {
        (p.tasks || []).forEach(t => {
            if (t.priority === "high") high++;
            else if (t.priority === "medium") medium++;
            else if (t.priority === "low") low++;
            if (t.is_archived) archived++;
        });
    });

    const data = [
        { name: "High", value: high },
        { name: "Medium", value: medium },
        { name: "Low", value: low },
        { name: "Archived", value: archived }
    ];

    return (
        <Card className="shadow-lg">
            <CardHeader>
                <CardTitle>Task Priority</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col items-center justify-center">
                    <PieChart
                        width={320}
                        height={320}
                        className="w-40 h-40 sm:w-52 sm:h-52 md:w-72 md:h-72 lg:w-96 lg:h-96"
                    >
                        <Pie
                            data={data}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius="65%"
                            label
                        >
                            {data.map((entry, index) => (
                                <Cell key={index} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip />
                        <Legend
                            verticalAlign="bottom"
                            align="center"
                            wrapperStyle={{ marginTop: "2rem" }} // better spacing
                        />
                    </PieChart>
                </div>
            </CardContent>
        </Card>
    );
};

export default TaskPriorityChart;
