import React, { useState } from 'react'
import { ScrollArea } from '../ui/scroll-area'
import { Separator } from '../ui/separator'
import { Textarea } from '../ui/textarea'
import { Button } from '../ui/button'
import { useAddCommentMutation, useCommentByIdQuery } from '@/app/hooks/use-Tasks'
import { toast } from 'sonner'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { Loader } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

const CommentSection = ({ taskId, members }) => {
    const [newComment, setNewComment] = useState("")
    const { mutate: addComment, isPending: isAdding } = useAddCommentMutation()
    const { data: comments, isLoading } = useCommentByIdQuery(taskId)
    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <Loader className="w-10 h-10 animate-spin" />
            </div>
        )
    }
    const handleAddComment = () => {
        if (!newComment.trim()) return
        addComment({ taskId, text: newComment }, {
            onSuccess: () => {
                setNewComment("")
                toast.success("Comment added successfully")
            },
            onError: (error) => {
                console.log(error)
                toast.error("Something went wrong")
            }
        })
    }
    return (
        <div className='bg-card rounded-lg p-6 shadow-sm mb-5'>
            <h3 className='text-lg font-medium mb-4'>
                Comments
            </h3>

            <ScrollArea className={'h-[250px] mb-4'}>
                {
                    comments.length > 0 ? (
                        comments.map((comment) => (
                            <div key={comment.id} className='flex gap-4 py-2'>
                                <Avatar>
                                    <AvatarImage src={comment.author.profilePicture} />
                                    <AvatarFallback>{comment.author.name.charAt(0).toUpperCase()}</AvatarFallback>
                                </Avatar>
                                <div className='flex-1'>
                                    <div className='flex justify-between items-center mb-1'>
                                        <span className='text-sm font-medium'>{comment.author.name}</span>
                                        <span className='text-xs text-muted-foreground'>{formatDistanceToNow(comment.created_at, {
                                            addSuffix: true
                                        })}</span>
                                    </div>
                                    <p className='text-sm'>{comment.text}</p>
                                </div>
                            </div>
                        ))
                    ) : (<div className='flex items-center justify-center py-8'>
                        <p className='text-sm text-muted-foreground'>No comments yet</p>
                    </div>)
                }
            </ScrollArea>

            <Separator className='my-4' />

            <div className='mt-4'>
                <Textarea placeholder="Add a comment" value={newComment} onChange={(e) => setNewComment(e.target.value)} />
                <div className='flex justify-end mt-4'>
                    <Button disabled={!newComment.trim() || isAdding} onClick={handleAddComment}>
                        Post Comment
                    </Button>
                </div>
            </div>
        </div>
    )
}

export default CommentSection
