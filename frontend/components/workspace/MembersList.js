import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MoreVertical } from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar"

const roleLabels = {
    owner: "Owner",
    admin: "Admin",
    member: "Member",
}

const MembersList = ({ members, currentRole, onRoleChange, onRemove }) => {
    return (
        <Card className="p-4 w-fit">
            {/* ✅ auto width based on content + bottom margin */}
            <h2 className="text-lg font-semibold">Workspace Members</h2>

            <div className="flex flex-wrap gap-4">
                {members.map((m) => {
                    const availableRoles = ["owner", "admin", "member"].filter(
                        (r) => r !== m.role
                    )

                    return (
                        <div
                            key={m.user_id}
                            className="flex items-center justify-between border p-4 rounded-lg w-[280px]"
                        >
                            {/* ✅ fixed card width */}
                            <div className="flex items-center gap-3">
                                <Avatar>
                                    <AvatarImage src={m.user.profilePicture} />
                                    <AvatarFallback>
                                        {m.user.name.charAt(0).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="font-medium">{m.user.name}</p>
                                    <p className="text-sm text-muted-foreground">
                                        {m.user.email}
                                    </p>
                                    <p className="text-xs mt-1 px-2 py-0.5 rounded bg-muted w-fit">
                                        {roleLabels[m.role] || m.role}
                                    </p>
                                </div>
                            </div>

                            {/* ✅ hide 3-dots for Owner */}
                            {(currentRole === "owner" || currentRole === "admin") &&
                                m.role !== "owner" && (
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon">
                                                <MoreVertical className="w-4 h-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent>
                                            {availableRoles.map((role) => (
                                                <DropdownMenuItem
                                                    key={role}
                                                    onClick={() =>
                                                        onRoleChange(m.user_id, role)
                                                    }
                                                >
                                                    Make {roleLabels[role]}
                                                </DropdownMenuItem>
                                            ))}
                                            <DropdownMenuItem
                                                className="text-red-600"
                                                onClick={() => onRemove(m.user_id)}
                                            >
                                                Remove
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                )}
                        </div>
                    )
                })}
            </div>
        </Card>
    )
}

export default MembersList
