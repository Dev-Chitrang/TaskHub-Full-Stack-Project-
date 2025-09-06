import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const KpiCards = ({ stats, recentProjects }) => {
    const today = new Date();

    // Active Projects = totalProjects - totalArchivedProjects
    const activeProjects = stats.totalProjects - stats.totalArchivedProjects;

    // Completed Tasks = directly from stats
    const completedTasks = stats.totalTaskCompleted;

    // Overdue Tasks = tasks from recentProjects that are past due and not done
    const overdueTasks = useMemo(() => {
        if (!recentProjects) return 0;

        let count = 0;
        recentProjects.forEach((project) => {
            if (!project.tasks) return;
            project.tasks.forEach((t) => {
                if (
                    t.due_date &&
                    new Date(t.due_date) < today &&
                    t.status !== "done"
                ) {
                    count += 1;
                }
            });
        });
        return count;
    }, [recentProjects, today]);

    const workspaceHealth = useMemo(() => {
        let total = 0;
        let completed = 0;

        recentProjects.forEach(project => {
            project.tasks
                ?.filter(t => !t.is_archived) // ✅ exclude archived tasks
                .forEach(t => {
                    total++;
                    if (t.status === "done") completed++;
                });
        });

        return total ? (completed / total) : 0;
    }, [recentProjects]);

    // Avg Project Progress = average progress across non-archived projects (excluding archived tasks)
    const avgProjectProgress = useMemo(() => {
        const nonArchivedProjects = recentProjects.filter(p => !p.is_archived);

        const totalProgress = nonArchivedProjects.reduce((sum, p) => {
            const tasks = (p.tasks ?? []).filter(t => !t.is_archived); // ✅ exclude archived tasks
            if (!tasks.length) return sum;

            const completed = tasks.filter(t => t.status === "done").length;
            return sum + (completed / tasks.length) * 100;
        }, 0);

        return nonArchivedProjects.length
            ? Math.round(totalProgress / nonArchivedProjects.length)
            : 0;
    }, [recentProjects]);

    const cards = [
        { title: "Total Projects", value: stats.totalProjects },
        { title: "Active Projects", value: activeProjects },
        { title: "Completed Tasks", value: completedTasks },
        { title: "Overdue Tasks", value: overdueTasks },
        { title: "Workspace Health", value: `${(workspaceHealth * 100).toFixed(1)}%` },
        { title: "Avg Project Progress", value: `${avgProjectProgress}%` },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {cards.map((c) => (
                <Card key={c.title} className="shadow-lg">
                    <CardHeader>
                        <CardTitle>{c.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="text-2xl font-bold">{c.value}</CardContent>
                </Card>
            ))}
        </div>
    );
};

export default KpiCards;
