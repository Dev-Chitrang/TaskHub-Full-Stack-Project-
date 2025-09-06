"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/app/provider/AuthContext";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, Trash2, ExternalLink } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import BackButton from "@/components/BackButton";
import { useRouter } from "next/navigation";

export default function NotificationsPage() {
    const { token } = useAuth();
    const router = useRouter();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchNotifications = async () => {
        const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/notifications/`, { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) setNotifications(await res.json());
        setLoading(false);
    };

    useEffect(() => {
        if (!token) return;
        fetchNotifications();
        const wsUrl = `${process.env.NEXT_PUBLIC_BASE_URL.replace(/^http/, 'ws')}/notifications/ws?token=${token}`;
        const ws = new WebSocket(wsUrl);
        ws.onmessage = (event) => {
            const newNotif = JSON.parse(event.data);
            setNotifications((prev) => [newNotif, ...prev]);
        };
        ws.onclose = () => console.log("WebSocket disconnected");
        return () => ws.close();
    }, [token]);

    const handleMarkAsRead = async (id) => {
        await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/notifications/${id}/mark-read`, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
        setNotifications((prev) => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    };

    const handleDelete = async (id) => {
        await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/notifications/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
        setNotifications((prev) => prev.filter(n => n.id !== id));
    };

    const handleClickNotification = (link) => { if (link) router.push(link); };

    if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /><span className="ml-2">Loading notifications...</span></div>;

    return (
        <div className="space-y-8">
            <div className="mb-4"><BackButton /></div>
            <h1 className="text-center text-2xl font-semibold">Notifications</h1>
            <div className="space-y-4">
                {!notifications.length ? (
                    <div className="text-center py-10 text-muted-foreground">No notifications yet</div>
                ) : notifications.map((notif) => (
                    <div key={notif.id} className={`p-4 rounded-lg border shadow-sm flex justify-between items-start cursor-pointer ${notif.is_read ? "bg-muted/30" : "bg-background"}`} onClick={() => handleClickNotification(notif.link)}>
                        <div>
                            <p className="font-medium">{notif.message}</p>
                            {notif.link && <p className="text-sm text-blue-600 flex items-center gap-1 hover:underline">View details <ExternalLink className="h-4 w-4" /></p>}
                            <p className="text-xs text-muted-foreground mt-1">{formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}</p>
                        </div>
                        <div className="flex items-center gap-2">
                            {!notif.is_read && <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleMarkAsRead(notif.id); }} title="Mark as read"><CheckCircle className="h-5 w-5 text-green-600" /></Button>}
                            <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleDelete(notif.id); }} title="Delete"><Trash2 className="h-5 w-5 text-red-600" /></Button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
