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
                "flex flex-col border-r transition-all duration-300 ease-in-out h-full",
                isCollapsed ? 'w-16 md:w-[105px]' : "w-16 md:w-[240px]"
            )}
        >
            {/* Top Section */}
            <div className="border-b">
                <div
                    className={cn(
                        "flex items-center px-6 py-4 transition-all duration-300 ease-in-out",
                        isCollapsed ? "justify-center px-3" : "justify-between"
                    )}
                >
                    {/* Logo + Title */}
                    <Link href="/dashboard" className="flex items-center gap-2">
                        <Wrench className="text-blue-600 transition-all duration-300" size={isCollapsed ? 22 : 20} />
                        <span
                            className={cn(
                                "hidden md:block font-semibold text-lg bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 transition-all duration-300",
                                isCollapsed
                                    ? "opacity-0 w-0 ml-0"
                                    : "opacity-100 w-auto ml-2"
                            )}
                        >
                            TaskHub
                        </span>
                    </Link>

                    {/* Toggle Button */}
                    <Button
                        variant="ghost"
                        size="icon"
                        className={cn(
                            "rounded-full hidden md:flex hover:bg-transparent transition-transform duration-300",
                            isCollapsed ? "rotate-180" : "rotate-0"
                        )}
                        onClick={() => setIsCollapsed(!isCollapsed)}
                    >
                        {isCollapsed ? <ChevronsRight size={16} /> : <ChevronsLeft size={16} />}
                    </Button>
                </div>
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
                    className="ml-auto transition-all duration-300"
                    onClick={logout}
                >
                    {
                        isCollapsed
                            ? (<LogOut size={16} />)
                            : (
                                <>
                                    <span className="hidden md:block">LogOut</span>
                                    <LogOut size={16} />
                                </>
                            )
                    }
                </Button>
            </div>
        </div>
    )
}

export default SidebarComponent
