import React from "react";
import { PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

const COLORS = ["#10b981", "#f59e0b", "#3b82f6", "#6b7280"];

const ProjectStatusChart = ({ projects }) => {
    const data = [
        { name: "Completed", value: projects.filter(p => p.status === "completed").length },
        { name: "In Progress", value: projects.filter(p => p.status === "in_progress").length },
        { name: "Planning", value: projects.filter(p => p.status === "planning").length },
        { name: "Archived", value: projects.filter(p => p.is_archived).length },
    ];

    return (
        <Card className="shadow-lg">
            <CardHeader>
                <CardTitle>Project Status</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col items-center justify-center">
                    <PieChart
                        width={350}
                        height={350}
                        className="w-44 h-44 sm:w-56 sm:h-56 md:w-72 md:h-72 lg:w-96 lg:h-96"
                    >
                        <Pie
                            data={data}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius="70%"
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
                            wrapperStyle={{ marginTop: "2rem" }} // more space between chart & legend
                        />
                    </PieChart>
                </div>
            </CardContent>
        </Card>
    );
};

export default ProjectStatusChart;
