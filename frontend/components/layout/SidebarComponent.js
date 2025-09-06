import { useAuth } from '@/app/provider/AuthContext'
import React, { useState } from 'react'
import {
    CheckCircle2,
    ChevronsLeft,
    ChevronsRight,
    LayoutDashboard,
    ListCheck,
    LogOut,
    Settings,
    Users,
    Wrench,
    Folder
} from "lucide-react";
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { Button } from '../ui/button';
import { ScrollArea } from '../ui/scroll-area';
import SidebarNav from './SidebarNav';

const SidebarComponent = ({ currentWorkspace }) => {
    const { logout } = useAuth()
    const [isCollapsed, setIsCollapsed] = useState(false)

    const navItems = [
        { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
        { title: "Workspaces", href: "/workspaces", icon: Folder },
        { title: "My Tasks", href: "/my-tasks", icon: ListCheck },
        { title: "Members", href: `/members`, icon: Users },
        { title: "Achieved", href: `/achieved`, icon: CheckCircle2 },
        { title: "Settings", href: "/settings", icon: Settings },
    ];

    return (
        <div
            className={cn(
                "flex flex-col border-r bg-sidebar transition-all duration-300 ease-in-out h-full",
                isCollapsed ? 'w-16 md:w-[105px]' : "w-16 md:w-[240px]"
            )}
        >
            {/* Top Section */}
            <div className="border-b">
                {/* Expanded */}
                {!isCollapsed && (
                    <div className="flex items-center justify-between px-6 py-4">
                        <Link href="/dashboard" className="flex items-center gap-2">
                            <Wrench className="text-blue-600" size={20} />
                            <span className="font-semibold text-lg hidden md:block">TaskHub</span>
                        </Link>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="rounded-full hidden md:flex"
                            onClick={() => setIsCollapsed(true)}
                        >
                            <ChevronsLeft size={16} />
                        </Button>
                    </div>
                )}

                {/* Collapsed */}
                {isCollapsed && (
                    <div className="flex items-center justify-center py-4 px-3 gap-3 transition-all duration-300 ease-in-out">
                        {/* Wrench perfectly centered with icons below */}
                        <Link href="/dashboard">
                            <Wrench className="text-blue-600" size={22} />
                        </Link>

                        {/* ChevronsRight next to Wrench with gap */}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="rounded-full hidden md:flex hover:bg-transparent"
                            onClick={() => setIsCollapsed(false)}
                        >
                            <ChevronsRight size={16} />
                        </Button>
                    </div>
                )}
            </div>

            {/* Nav Items */}
            <ScrollArea className="flex-1 px-3 py-2">
                <SidebarNav
                    items={navItems}
                    isCollapsed={isCollapsed}
                    className={cn(isCollapsed && 'items-start space-y-2')}
                    currentWorkspace={currentWorkspace}
                />
            </ScrollArea>

            {/* Logout */}
            <div className='px-3 py-2 mt-auto'>
                <Button
                    variant="ghost"
                    size={isCollapsed ? 'icon' : 'default'}
                    className="ml-auto"
                    onClick={logout}
                >
                    <LogOut className={cn(isCollapsed && "mr-2")} size={16} />
                    <span className="hidden md:block">LogOut</span>
                </Button>
            </div>
        </div>
    )
}

export default SidebarComponent
