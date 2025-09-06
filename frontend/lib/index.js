export const publicRoutes = [
    "/",
    "/auth/sign-in",
    "/auth/sign-up",
    "/auth/verify-email",
    "/auth/reset-password",
    "/auth/forgot-password",
    "/auth/sign-in/verify",
    // "/workspace/invite-user",
    // "/workspace/[WorkSpaceid]/invite-user",
    // "*"
];

export const getTaskStatusColor = (status) => {
    switch (status) {
        case "in_progress":
            return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
        case "completed":
            return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
        case "cancelled":
            return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
        case "on-hold":
            return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300";
        case "planning":
            return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300";
        default:
            return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
    }
};

export const getProjectProgress = (tasks) => {
    if (!tasks || tasks.length === 0) return 0;

    // Exclude archived tasks
    const activeTasks = tasks.filter((task) => task.is_archived !== true);

    if (activeTasks.length === 0) return 0;

    // Count completed tasks
    const completedTasks = activeTasks.filter(
        (task) => task.status?.toLowerCase() === "done"
    );

    // Calculate progress
    const progress = Math.round((completedTasks.length / activeTasks.length) * 100);

    return progress;
};
