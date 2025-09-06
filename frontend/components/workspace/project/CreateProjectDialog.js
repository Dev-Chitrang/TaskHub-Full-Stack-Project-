import { zodResolver } from '@hookform/resolvers/zod'
import React from 'react'
import { useForm } from 'react-hook-form'
import { createProjectSchema } from '@/lib/schema'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from '@/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { CalendarIcon } from 'lucide-react'
import { format } from 'date-fns'
import { Calendar } from '@/components/ui/calendar'
import { Checkbox } from '@/components/ui/checkbox'
import { UserCreateProject } from '@/app/hooks/use-Project'
import { toast } from 'sonner'

const ProjectStatus = ["planning", "in_progress"]

const CreateProjectDialog = ({ isOpen, onOpenChange, workspaceId, workspaceMembers }) => {
    const form = useForm({
        resolver: zodResolver(createProjectSchema),
        defaultValues: {
            title: "",
            description: "",
            status: "planning",
            start_date: undefined,
            due_date: undefined,
            members: [],
            tags: "",
        }
    })

    const { mutate, isPending } = UserCreateProject()

    const onSubmit = (values) => {
        if (!workspaceId) return;

        const payload = {
            ...values,
            start_date: values.start_date ? values.start_date.toISOString() : null,
            due_date: values.due_date ? values.due_date.toISOString() : null,
            workspaceId
        }

        mutate(payload, {
            onSuccess: () => {
                toast.success("Project created successfully")
                form.reset()
                onOpenChange(false)
            },
            onError: (error) => {
                console.log(error)
                toast.error(error?.data?.message || "Something went wrong")
            }
        })
    }

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[540px]">
                <DialogHeader>
                    <DialogTitle>Create Project</DialogTitle>
                    <DialogDescription>Create a new project to get started</DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
                        {/* Title */}
                        <FormField control={form.control} name="title" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Project Title</FormLabel>
                                <FormControl>
                                    <Input {...field} placeholder="Project Title" />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />

                        {/* Description */}
                        <FormField control={form.control} name="description" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Project Description</FormLabel>
                                <FormControl>
                                    <Textarea rows={3} {...field} placeholder="Project Description" />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />

                        {/* Status */}
                        <FormField control={form.control} name="status" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Project Status</FormLabel>
                                <FormControl>
                                    <Select value={field.value} onValueChange={field.onChange}>
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Project Status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {ProjectStatus.map(status => (
                                                <SelectItem key={status} value={status}>{status}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />

                        {/* Dates */}
                        <div className='grid grid-cols-2 gap-4'>
                            {["start_date", "due_date"].map((name) => (
                                <FormField key={name} control={form.control} name={name} render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{name === "start_date" ? "Start Date" : "Due Date"}</FormLabel>
                                        <FormControl>
                                            <Popover modal={true}>
                                                <PopoverTrigger asChild>
                                                    <Button variant="outline" className={"w-full justify-start text-left font-normal" + (field.value ? " text-muted-foreground" : "")}>
                                                        <CalendarIcon className='size-4 mr-2' />
                                                        {field.value ? format(field.value, "PPPP") : <span>Pick a date</span>}
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent>
                                                    <Calendar
                                                        mode="single"
                                                        selected={field.value ? new Date(field.value) : undefined}
                                                        onSelect={day => field.onChange(day || undefined)}
                                                    />
                                                </PopoverContent>
                                            </Popover>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                            ))}
                        </div>

                        {/* Tags */}
                        <FormField control={form.control} name="tags" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Tags</FormLabel>
                                <FormControl>
                                    <Input {...field} placeholder="Enter tags separated by comma" />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />

                        {/* Members */}
                        < FormField control={form.control} name="members" render={({ field }) => {
                            const selectedMembers = field.value || []

                            return (
                                <FormItem>
                                    <FormLabel>Members</FormLabel>
                                    <FormControl>
                                        <Popover modal={true}>
                                            <PopoverTrigger asChild>
                                                <Button variant="outline" className="w-full justify-start text-left font-normal min-h-11">
                                                    {selectedMembers.length === 0
                                                        ? <span className="text-muted-foreground">Select Members</span>
                                                        : selectedMembers.length <= 2
                                                            ? selectedMembers.map(m => {
                                                                const member = workspaceMembers.find(wm => wm.user.id === m.user_id)
                                                                return `${member?.user.name} (${m.role})`
                                                            }).join(", ")
                                                            : `${selectedMembers.length} members selected`
                                                    }
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-full max-w-60 overflow-y-auto" align="start">
                                                <div className="flex flex-col gap-2">
                                                    {workspaceMembers.map(member => {
                                                        const selectedMember = selectedMembers.find(m => m.user_id === member.user.id)
                                                        const isOwner = member.role === "owner"

                                                        return (
                                                            <div key={member.id} className="flex items-center gap-2 p-2 border rounded">
                                                                <Checkbox
                                                                    checked={!!selectedMember}
                                                                    onCheckedChange={(checked) => {
                                                                        if (checked) {
                                                                            if (isOwner) {
                                                                                field.onChange([
                                                                                    ...selectedMembers,
                                                                                    { user_id: member.user.id, role: "manager", name: member.user.name }
                                                                                ])
                                                                            } else {
                                                                                field.onChange([
                                                                                    ...selectedMembers,
                                                                                    { user_id: member.user.id, role: "contributor", name: member.user.name }
                                                                                ])
                                                                            }
                                                                        } else {
                                                                            field.onChange(
                                                                                selectedMembers.filter(m => m.user_id !== member.user.id)
                                                                            )
                                                                        }
                                                                    }}
                                                                    id={`member-${member.user.id}`}
                                                                />
                                                                <span className="truncate flex-1">{member.user.name}</span>

                                                                {/* Role selector for non-owner */}
                                                                {selectedMember && !isOwner && (
                                                                    <Select
                                                                        value={selectedMember.role}
                                                                        onValueChange={role => {
                                                                            field.onChange(
                                                                                selectedMembers.map(m =>
                                                                                    m.user_id === member.user.id
                                                                                        ? { ...m, role, name: member.user.name } // ✅ ensure name stays
                                                                                        : m
                                                                                )
                                                                            )
                                                                        }}
                                                                    >
                                                                        <SelectTrigger>
                                                                            <SelectValue placeholder="Select a role" />
                                                                        </SelectTrigger>
                                                                        <SelectContent>
                                                                            <SelectItem value="contributor">Contributor</SelectItem>
                                                                            <SelectItem value="manager">Manager</SelectItem>
                                                                            <SelectItem value="viewer">Viewer</SelectItem>
                                                                        </SelectContent>
                                                                    </Select>
                                                                )}

                                                                {/* Owner label → always Manager */}
                                                                {isOwner && selectedMember && (
                                                                    <span className="text-sm font-medium text-muted-foreground">(Manager)</span>
                                                                )}
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                            </PopoverContent>
                                        </Popover>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )
                        }} />

                        <DialogFooter>
                            <Button type="submit" disabled={isPending}>
                                {isPending ? "Creating..." : "Create Project"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}

export default CreateProjectDialog
