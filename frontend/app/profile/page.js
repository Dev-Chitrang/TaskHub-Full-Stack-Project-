'use client'

import { useUserProfileQuery, useUpdateProfile, useDeleteProfile } from "@/app/hooks/use-user";
import { useAuth } from "@/app/provider/AuthContext";
import BackButton from "@/components/BackButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Trash } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { Form } from "@/components/ui/form";
import { toast } from "sonner";
import { z } from "zod";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

const profileSchema = z.object({
    name: z.string().min(1, { message: "Name is required" }),
    profilePicture: z.string().optional(),
});

const Profile = () => {
    const { data: user, isPending } = useUserProfileQuery();
    const { logout } = useAuth();
    const router = useRouter();
    const [openDeleteConfirm, setOpenDeleteConfirm] = useState(false);

    const profileForm = useForm({
        resolver: zodResolver(profileSchema),
        defaultValues: { name: '', profilePicture: '' }
    });

    useEffect(() => {
        if (user) {
            profileForm.reset({
                name: user.name || '',
                profilePicture: user.profilePicture || ''
            });
        }
    }, [user]);

    const { mutate: updateUserProfile, isPending: isUpdatingProfile } = useUpdateProfile();
    const { mutate: deleteProfile, isPending: isDeleting } = useDeleteProfile();

    const handleProfileSubmit = (values) => {
        updateUserProfile(
            { name: values.name, profilePicture: values.profilePicture || '' },
            {
                onSuccess: () => toast.success("Profile updated successfully"),
                onError: (error) => {
                    const errorMessage = error?.response?.data?.error || error?.data?.message || "Failed to update profile";
                    toast.error(errorMessage);
                }
            }
        );
    };

    const handleAvatarUpload = (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
        if (!validTypes.includes(file.type)) {
            toast.error("Invalid file type. Please upload an image.");
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => profileForm.setValue("profilePicture", reader.result);
        reader.readAsDataURL(file);
    };

    const confirmDelete = () => {
        deleteProfile({}, {
            onSuccess: () => {
                toast.success("Account deleted. Redirecting...");
                setTimeout(() => {
                    logout();
                    router.push("/auth/sign-up");
                }, 3000);
            },
            onError: (error) => {
                const errorMessage = error?.response?.data?.error || error?.data?.message || "Failed to delete account";
                toast.error(errorMessage);
            }
        });
    };

    if (isPending) {
        return (
            <div className="flex justify-center items-center h-screen">
                <Loader2 className="w-10 h-10 animate-spin" />
            </div>
        );
    }

    return (
        <div className="container mx-auto max-w-5xl space-y-4">
            <div className="px-4 md:px-0 flex items-center justify-between mb-2">
                <BackButton />
                <Button
                    variant="destructive"
                    onClick={() => setOpenDeleteConfirm(true)}
                    disabled={isDeleting}
                >
                    <Trash className="mr-2 h-4 w-4" />
                    {isDeleting ? "Deleting..." : "Delete Account"}
                </Button>
            </div>

            <h3 className="text-2xl font-semibold px-4 md:px-0">Profile Information</h3>
            <p className="text-sm text-muted-foreground px-4 md:px-0">
                Manage your personal information.
            </p>

            <Card className="shadow-md rounded-2xl">
                <CardHeader>
                    <CardTitle>Personal Information</CardTitle>
                    <CardDescription>Update your personal details.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...profileForm}>
                        <form className="grid gap-4" onSubmit={profileForm.handleSubmit(handleProfileSubmit)}>
                            <div className="flex items-center space-x-4 mb-6">
                                <motion.div
                                    className="relative h-20 w-20 flex-shrink-0 cursor-pointer"
                                    whileHover={{ rotateY: 180 }}
                                    transition={{ duration: 0.6 }}
                                    style={{ transformStyle: "preserve-3d" }}
                                >
                                    <motion.img
                                        src={profileForm.watch("profilePicture") || user?.profilePicture || null}
                                        alt="Profile"
                                        className="w-full h-full object-cover rounded-full border shadow"
                                        style={{ backfaceVisibility: "hidden", position: "relative" }}
                                    />
                                    <motion.div
                                        className="absolute inset-0 flex items-center justify-center text-xl font-bold rounded-full border"
                                        style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
                                    >
                                        {user?.name?.charAt(0)?.toUpperCase() || "U"}
                                    </motion.div>
                                </motion.div>

                                <div>
                                    <input
                                        id="avatar-upload"
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={handleAvatarUpload}
                                    />
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        onClick={() => document.getElementById("avatar-upload")?.click()}
                                    >
                                        Change Avatar
                                    </Button>
                                </div>
                            </div>

                            <FormField
                                control={profileForm.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Full Name</FormLabel>
                                        <FormControl><Input {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="grid gap-2">
                                <Label htmlFor="email">Email Address</Label>
                                <Input id="email" type="email" defaultValue={user?.email} disabled />
                                <p className="text-xs text-muted-foreground">Your email address cannot be changed.</p>
                            </div>

                            <Button type="submit" disabled={isUpdatingProfile} className="w-fit">
                                {isUpdatingProfile ? "Saving..." : "Save Changes"}
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>

            {/* Delete Confirmation Dialog */}
            <Dialog open={openDeleteConfirm} onOpenChange={setOpenDeleteConfirm}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Account</DialogTitle>
                        <DialogDescription>Are you sure? This action cannot be undone.</DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setOpenDeleteConfirm(false)}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={confirmDelete} disabled={isDeleting}>
                            {isDeleting ? "Deleting..." : "Delete"}
                        </Button>
                        <Button variant="outline" onClick={() => logout()}>
                            LogOut
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

export default Profile;
