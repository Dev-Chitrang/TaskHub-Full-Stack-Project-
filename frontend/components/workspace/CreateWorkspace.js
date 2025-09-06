'use client'

import { zodResolver } from '@hookform/resolvers/zod';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { createWorkspaceSchema } from '@/lib/schema';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '../ui/form';
import { Textarea } from '../ui/textarea';
import { useForm } from 'react-hook-form';
import { Input } from '../ui/input';
import { cn } from '@/lib/utils';
import { Button } from '../ui/button';
import { useCreateWorkspace } from '@/app/hooks/use-Workspace';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export const colorOptions = [
    "#FF5733",
    "#33C1FF",
    "#28A745",
    "#FFC300",
    "#8E44AD",
    "#E67E22",
    "#2ECC71",
    "#34495E"
]

const CreateWorkspace = ({ isCreatingWorkspace, setIsCreatingWorkspace }) => {
    const navigate = useRouter()
    const form = useForm({
        resolver: zodResolver(createWorkspaceSchema),
        defaultValues: {
            name: '',
            color: colorOptions[0],
            description: ''
        }
    });
    const { mutate, isPending } = useCreateWorkspace()

    const onSubmit = (data) => {
        mutate(data, {
            onSuccess: (data) => {
                // console.log(data)
                form.reset()
                setIsCreatingWorkspace(false)
                toast.success("Workspace created successfully")
                navigate.push(`/workspaces/${data.id}`)
            },
            onError: (error) => {
                console.log(error);
                toast.error(error?.data?.message || "Something went wrong")
            }
        })
    }
    return (
        <Dialog open={isCreatingWorkspace} onOpenChange={setIsCreatingWorkspace} modal={true}>
            <DialogContent className={"max-h-[80vh] overflow-y-auto"}>
                <DialogHeader>
                    <DialogTitle>
                        Create Workspace
                    </DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)}>
                        <div className='space-y-4 py-4'>
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (<FormItem>
                                    <FormLabel>Workspace Name</FormLabel>
                                    <FormControl>
                                        <Input type="text" placeholder='Enter workspace name' {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>)}
                            />
                            <FormField
                                control={form.control}
                                name="description"
                                render={({ field }) => (<FormItem>
                                    <FormLabel>Workspace Description</FormLabel>
                                    <FormControl>
                                        <Textarea type="text" placeholder='Enter workspace description' rows={3} {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>)}
                            />
                            <FormField
                                control={form.control}
                                name="color"
                                render={({ field }) => (<FormItem>
                                    <FormLabel>Workspace Color</FormLabel>
                                    <FormControl>
                                        <div className='flex gap-3'>
                                            {
                                                colorOptions.map((color) => (
                                                    <div key={color} className={cn('w-6 h-6 rounded-full cursor-pointer hover:opacity-80 transition-all duration-300', field.value === color && 'ring-2 ring-offset-2 ring-blue-500')} style={{ backgroundColor: color }} onClick={() => field.onChange(color)}></div>
                                                ))
                                            }
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>)}
                            />
                        </div>
                        <DialogFooter>
                            <Button type="submit" disabled={isPending}>
                                {isPending ? "Creating Workspace..." : "Create Workspace"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}

export default CreateWorkspace
