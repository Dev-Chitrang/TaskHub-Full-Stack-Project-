import { useCreateTaskMutation } from '@/app/hooks/use-Tasks'
import { createTaskSchema } from '@/lib/schema'
import { zodResolver } from '@hookform/resolvers/zod'
import React from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { Button } from '../ui/button'
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '../ui/dialog'
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '../ui/form'
import { Input } from '../ui/input'
import { Textarea } from '../ui/textarea'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '../ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover'
import { CalendarIcon } from 'lucide-react'
import { format } from 'date-fns'
import { Calendar } from '../ui/calendar'
import { Checkbox } from '../ui/checkbox'
import { useRouter } from 'next/navigation'

const CreateTaskDialog = ({ open, onOpenChange, projectId, projectMembers }) => {
    const router = useRouter()
    const form = useForm({
        resolver: zodResolver(createTaskSchema),
        defaultValues: {
            title: '',
            description: '',
            priority: 'medium',
            status: 'todo',
            due_date: new Date(),
            assignees: [],
        },
    })

    const { mutate, isPending } = useCreateTaskMutation()

    const onSubmit = (values) => {
        mutate(
            {
                projectId,
                values,
            },
            {
                onSuccess: (newTask) => {
                    form.reset()
                    onOpenChange(false)

                    toast.success("Task created successfully!", {
                        action: {
                            label: "View Task",
                            onClick: () => {
                                router.push(
                                    `/workspaces/${newTask.workspaceId}/projects/${newTask.projectId}/tasks/${newTask.id}`
                                )
                            },
                        },
                        cancel: {
                            label: "Stay on page",
                            onClick: () => {
                                router.refresh()
                            },
                        },
                    })
                },
                onError: (error) => {
                    console.error(error)
                    toast.error(error.data?.message || "Something went wrong")
                },
            }
        )
    }


    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Create Task</DialogTitle>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                {/* Title */}
                                <FormField
                                    control={form.control}
                                    name="title"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Title</FormLabel>
                                            <FormControl>
                                                <Input {...field} placeholder="Enter task title" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {/* Description */}
                                <FormField
                                    control={form.control}
                                    name="description"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Description</FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    {...field}
                                                    placeholder="Enter task description"
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {/* Status + Priority */}
                                <div className="grid gap-4 md:grid-cols-2">
                                    <FormField
                                        control={form.control}
                                        name="status"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Status</FormLabel>
                                                <FormControl>
                                                    <Select
                                                        onValueChange={field.onChange}
                                                        defaultValue={field.value}
                                                    >
                                                        <SelectTrigger className="w-full">
                                                            <SelectValue placeholder="Select status" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="todo">To Do</SelectItem>
                                                            <SelectItem value="in_progress">
                                                                In Progress
                                                            </SelectItem>
                                                            <SelectItem value="done">Done</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="priority"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Priority</FormLabel>
                                                <FormControl>
                                                    <Select
                                                        value={field.value}
                                                        onValueChange={field.onChange}
                                                    >
                                                        <SelectTrigger className="w-full">
                                                            <SelectValue placeholder="Select priority" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="low">Low</SelectItem>
                                                            <SelectItem value="medium">Medium</SelectItem>
                                                            <SelectItem value="high">High</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                </div>

                                {/* Due Date */}
                                <FormField
                                    control={form.control}
                                    name="due_date"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Due Date</FormLabel>
                                            <FormControl>
                                                <Popover modal={true}>
                                                    <PopoverTrigger asChild>
                                                        <Button
                                                            variant={'outline'}
                                                            className={
                                                                'w-full justify-start text-left font-normal ' +
                                                                (!field.value ? 'text-muted-foreground' : '')
                                                            }
                                                        >
                                                            <CalendarIcon className="size-4 mr-2" />
                                                            {field.value ? (
                                                                format(new Date(field.value), 'PPPP')
                                                            ) : (
                                                                <span>Pick a date</span>
                                                            )}
                                                        </Button>
                                                    </PopoverTrigger>

                                                    <PopoverContent>
                                                        <Calendar
                                                            mode="single"
                                                            selected={
                                                                field.value ? new Date(field.value) : undefined
                                                            }
                                                            onSelect={(date) => {
                                                                field.onChange(date || undefined)
                                                            }}
                                                        />
                                                    </PopoverContent>
                                                </Popover>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {/* Assignees */}
                                <FormField
                                    control={form.control}
                                    name="assignees"
                                    render={({ field }) => {
                                        const selectedMembers = field.value || []

                                        return (
                                            <FormItem>
                                                <FormLabel>Assignees</FormLabel>
                                                <FormControl>
                                                    <Popover>
                                                        <PopoverTrigger asChild>
                                                            <Button
                                                                variant="outline"
                                                                className="w-full justify-start text-left font-normal min-h-11"
                                                            >
                                                                {selectedMembers.length === 0 ? (
                                                                    <span className="text-muted-foreground">
                                                                        Select assignees
                                                                    </span>
                                                                ) : (
                                                                    `${selectedMembers.length} assignee(s) selected`
                                                                )}
                                                            </Button>
                                                        </PopoverTrigger>

                                                        <PopoverContent
                                                            className="w-sm max-h-60 overflow-y-auto p-2"
                                                            align="start"
                                                        >
                                                            <div className="flex flex-col gap-2">
                                                                {projectMembers.map((member) => {
                                                                    console.log(member)
                                                                    const selectedMember = selectedMembers.includes(member.user_id)

                                                                    return (
                                                                        <div
                                                                            key={member.user_id}
                                                                            className="flex items-center gap-2 p-2 border rounded"
                                                                        >
                                                                            <Checkbox
                                                                                checked={selectedMember}
                                                                                onCheckedChange={(checked) => {
                                                                                    if (checked) {
                                                                                        field.onChange([
                                                                                            ...selectedMembers,
                                                                                            member.user_id, // ✅ store ID
                                                                                        ])
                                                                                    } else {
                                                                                        field.onChange(
                                                                                            selectedMembers.filter(
                                                                                                (m) => m !== member.user_id
                                                                                            )
                                                                                        )
                                                                                    }
                                                                                }}
                                                                                id={`member-${member.user_id}`}
                                                                            />
                                                                            <span className="truncate flex-1">
                                                                                {member.name} {/* ✅ display name */}
                                                                            </span>
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
                                    }}
                                />

                            </div>
                        </div>

                        <DialogFooter>
                            <Button type="submit" disabled={isPending}>
                                {isPending ? 'Creating...' : 'Create Task'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}

export default CreateTaskDialog
