import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog'
import { useForm } from 'react-hook-form'
import { InviteMemberSchema } from '@/lib/schema'
import { zodResolver } from '@hookform/resolvers/zod'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { Form, FormControl, FormField, FormItem, FormLabel } from '../ui/form'
import { Input } from '../ui/input'
import { cn } from '@/lib/utils'
import { Button } from '../ui/button'
import { Check, Copy, Mail } from 'lucide-react'
import { Label } from '../ui/label'
import { useInviteMemberMutation } from '@/app/hooks/use-Workspace'
import { toast } from 'sonner'

const ROLES = ['admin', 'member', 'viewer']

const InviteMember = ({ isOpen, onOpenChange, workspaceId, workspaceName, workspaceColor }) => {
    const [inviteTab, setInviteTab] = useState('email')
    const [linkCopied, setLinkCopied] = useState(false)
    const form = useForm({
        resolver: zodResolver(InviteMemberSchema),
        defaultValues: {
            email: '',
            role: 'member'
        }
    })

    const { mutate, isPending } = useInviteMemberMutation()

    const onSubmit = (data) => {
        if (!workspaceId) return
        mutate({ workspaceId, email: data.email, role: data.role }, {
            onSuccess: () => {
                toast.success("Member invited successfully")
                form.reset()
                onOpenChange(false)
                setInviteTab('email')
            },
            onError: (error) => {
                console.log(error)
                toast.error(error?.data?.message || "Something went wrong")
            }
        })
    }
    const handleCopyInviteLink = () => {
        const link = `${window.location.origin}/workspace/invite-user/?workspaceId=${workspaceId}&workspaceName=${encodeURIComponent(workspaceName)}&workspaceColor=${encodeURIComponent(workspaceColor)}`
        navigator.clipboard.writeText(link)
        setLinkCopied(true)
        setTimeout(() => setLinkCopied(false), 3000)
    }
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Invite Member to Workspace</DialogTitle>
                </DialogHeader>

                <Tabs defaultValue='email' value={inviteTab} onValueChange={setInviteTab}>
                    <TabsList>
                        <TabsTrigger value='email' disabled={isPending}>Send Email</TabsTrigger>
                        <TabsTrigger value='link' disabled={isPending}>Share Link</TabsTrigger>
                    </TabsList>

                    <TabsContent value='email'>
                        <div className='grid gap-4'>
                            <div className='grid gap-2'>
                                <Form {...form}>
                                    <form onSubmit={form.handleSubmit(onSubmit)}>
                                        <div className='flex flex-col space-y-6 w-full'>
                                            <FormField name='email' control={form.control} render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Email</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder='Enter Email' {...field} />
                                                    </FormControl>
                                                </FormItem>
                                            )} />

                                            <FormField name='role' control={form.control} render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Select Role</FormLabel>
                                                    <FormControl>
                                                        <div className='flex gap-3 flex-wrap'>
                                                            {
                                                                ROLES.map((role) => (
                                                                    <label key={role} className='flex items-center cursor-pointer gap-2'>
                                                                        <input type='radio' value={role} className='peer hidden' checked={field.value === role} onChange={() => field.onChange(role)} />
                                                                        <span className={cn('w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all duration-300 hover:shadow-lg', field.value === role && "ring-2 ring-emerald-500 ring-offset-2")}>
                                                                            {
                                                                                field.value === role && <span className='w-3 h-3 rounded-full bg-primary' />
                                                                            }
                                                                        </span>
                                                                        <span className='capitalize '>
                                                                            {
                                                                                role
                                                                            }
                                                                        </span>
                                                                    </label>
                                                                ))
                                                            }
                                                        </div>
                                                    </FormControl>
                                                </FormItem>
                                            )} />
                                        </div>

                                        <Button className={'mt-6 w-full'} size={'lg'} disabled={isPending}>
                                            <Mail className='w-4 h-4 mr-2' />
                                            Send
                                        </Button>
                                    </form>
                                </Form>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value='link'>
                        <div className='grid gap-4'>
                            <div className='grid gap-2'>
                                <Label>Share this link to invite people</Label>
                                <div className='flex items-center space-x-2'>
                                    <Input readOnly value={`${window.location.origin}/workspace/invite-user/?workspaceId=${workspaceId}&workspaceName=${workspaceName}&workspaceColor=${workspaceColor}`} />
                                    <Button onClick={handleCopyInviteLink} disabled={isPending}>
                                        {
                                            linkCopied ? (
                                                <>
                                                    <Check className='mr-2 h-4 w-4' />
                                                    Copied
                                                </>
                                            ) : (
                                                <>
                                                    <Copy className='mr-2 h-4 w-4' />
                                                    Copy
                                                </>
                                            )
                                        }
                                    </Button>
                                </div>
                            </div>
                            <p className='text-sm text-muted-foreground'>
                                Anyone with the link can join as a member in this workspace.
                            </p>
                        </div>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    )
}

export default InviteMember
