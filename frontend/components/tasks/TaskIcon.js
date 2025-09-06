import {
    Building2,
    CheckCircle,
    CheckCircle2,
    CheckSquare,
    Eye,
    EyeOff,
    FileEdit,
    FolderEdit,
    FolderPlus,
    LogIn,
    MessageSquare,
    Trash,
    Upload,
    UserMinus,
    UserPlus,
} from "lucide-react";

export const getActivityIcon = (action) => {
    switch (action) {
        case "created_task":
            return (
                <div className="bg-green-600/10 p-2 rounded-md">
                    <CheckSquare className="h-5 w-5 text-green-600 rounded-full" />
                </div>
            );
        case "created_subtask":
            return (
                <div className="bg-emerald-600/10 p-2 rounded-md">
                    <CheckSquare className="h-5 w-5 text-emerald-600 rounded-full" />
                </div>
            );
        case "updated_task":
        case "updated_subtask":
            return (
                <div className="bg-blue-600/10 p-2 rounded-md">
                    <FileEdit className="h-5 w-5 text-blue-600 rounded-full" />
                </div>
            );
        case "completed_task":
            return (
                <div className="bg-green-600/10 p-2 rounded-md">
                    <CheckCircle className="h-5 w-5 text-green-600 rounded-full" />
                </div>
            );
        case "added_comment":
            return (
                <div className="bg-blue-600/10 p-2 rounded-md">
                    <MessageSquare className="h-5 w-5 text-blue-600 rounded-full" />
                </div>
            );
        case "added_member":
            return (
                <div className="bg-blue-600/10 p-2 rounded-md">
                    <UserPlus className="h-5 w-5 text-blue-600 rounded-full" />
                </div>
            );
        case "removed_member":
            return (
                <div className="bg-red-600/10 p-2 rounded-md">
                    <UserMinus className="h-5 w-5 text-red-600 rounded-full" />
                </div>
            );
        case "added_attachment":
            return (
                <div className="bg-blue-600/10 p-2 rounded-md">
                    <Upload className="h-5 w-5 text-blue-600 rounded-full" />
                </div>
            );
        case "removed_attachment":
            return (
                <div className="bg-red-600/10 p-2 rounded-md">
                    <Trash className="h-5 w-5 text-red-600 rounded-full" />
                </div>
            )
        default:
            return null;
    }
};
