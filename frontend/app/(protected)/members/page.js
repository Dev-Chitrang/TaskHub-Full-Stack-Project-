"use client";

import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { Loader2, ArrowUpRight, CheckCircle, Clock, FilterIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useGetWorkspaceDetailsQuery } from "@/app/hooks/use-Workspace";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";


const Members = () => {
    const searchParams = useSearchParams();
    const [workspaceId, setWorkspaceId] = useState(null);
    const [search, setSearch] = useState("");

    // Sync workspaceId from query params
    useEffect(() => {
        const id = searchParams.get("workspaceId");
        setWorkspaceId(id);
    }, [searchParams]);

    const { data: workspace, isLoading } = useGetWorkspaceDetailsQuery(workspaceId, {
        enabled: !!workspaceId,
    });

    console.log(workspace)

    const filteredMembers = useMemo(() => {
        if (!workspace?.members) return [];
        return workspace.members.filter(
            (m) =>
                m.user.name.toLowerCase().includes(search.toLowerCase()) ||
                m.user.email.toLowerCase().includes(search.toLowerCase()) ||
                m.role.toLowerCase().includes(search.toLowerCase())
        );
    }, [workspace?.members, search]);

    if (!workspaceId) {
        return (
            <div className="flex h-full flex-col items-center justify-center text-muted-foreground">
                <p className="text-lg">Select a workspace from the top dropdown to view members.</p>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="flex h-full items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!workspace) {
        return <div className="text-center text-muted-foreground text-lg">No workspace found</div>;
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start md:items-center justify-between">
                <h1 className="text-2xl font-bold">Members</h1>
            </div>

            {/* Search */}
            <Input
                placeholder="Search tasks..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="max-w-md"
            />

            {/* Tabs */}
            <Tabs defaultValue="list">
                <TabsList>
                    <TabsTrigger value="list">List View</TabsTrigger>
                    <TabsTrigger value="board">Grid View</TabsTrigger>
                </TabsList>

                {/* LIST VIEW */}
                <TabsContent value="list">
                    <Card>
                        <CardHeader>
                            <CardTitle>Members</CardTitle>
                            <CardDescription>
                                {filteredMembers?.length} Members in your workspace
                            </CardDescription>
                        </CardHeader>

                        <CardContent>
                            <div className="divide-y">
                                {
                                    filteredMembers.map((member) => (
                                        <div key={member.user.id} className='flex flex-col md:flex-row items-center justify-between p-4 gap-3'>
                                            <div className="flex items-center space-x-4">
                                                <Avatar>
                                                    <AvatarImage src={member.user.profilePicture} />
                                                    <AvatarFallback>{member.user.name.charAt(0).toUpperCase()}</AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="font-medium">{member.user.name}</p>
                                                    <p className="text-sm">{member.user.email}</p>
                                                </div>
                                            </div>

                                            <div className="flex items-center space-x-1 ml-11 md:ml-0">
                                                <Badge variant={['admin', 'owner'].includes(member.role) ? "destructive" : "secondary"} className={'capitalize'}>
                                                    {member.role}
                                                </Badge>
                                                <Badge variant={'outline'}>
                                                    {workspace.name}
                                                </Badge>
                                            </div>
                                        </div>
                                    ))
                                }
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* BOARD VIEW */}
                <TabsContent value='board'>
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {
                            filteredMembers.map((member) => (
                                <Card key={member.user.id}>
                                    <CardContent className={'p-6 flex flex-col items-center text-center'}>
                                        <Avatar className={'size-20 mb-4'}>
                                            <AvatarImage src={member.user.profilePicture} />
                                            <AvatarFallback>{member.user.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                                        </Avatar>

                                        <h3 className="text-lg font-medium mb-2">
                                            {member.user.name}
                                        </h3>
                                        <p className="text-sm mb-4">
                                            {member.user.email}
                                        </p>

                                        <Badge variant={['admin', 'owner'].includes(member.role) ? "destructive" : "secondary"}>
                                            {member.role}
                                        </Badge>
                                    </CardContent>
                                </Card>
                            ))
                        }
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default Members;


