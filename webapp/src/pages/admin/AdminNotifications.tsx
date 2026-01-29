import { useState } from 'react';
import { Send, Bell, Clock, Users } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useAdminStore } from '@/store/useAdminStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { z } from 'zod';

const notificationSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(100, 'Title must be less than 100 characters'),
  body: z.string().trim().min(1, 'Body is required').max(500, 'Body must be less than 500 characters'),
  targetCategoryId: z.string().nullable(),
});

export default function AdminNotifications() {
  const { notifications, sendNotification, categories } = useAdminStore();

  const [formData, setFormData] = useState({
    title: '',
    body: '',
    targetCategoryId: 'all' as string,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSending, setIsSending] = useState(false);

  const allCategories = categories.flatMap((cat) => [
    { id: cat.id, name: cat.name },
    ...(cat.subcategories?.map((sub) => ({
      id: sub.id,
      name: `${cat.name} / ${sub.name}`,
    })) || []),
  ]);

  const getCategoryName = (id: string | null) => {
    if (!id) return 'All subscribers';
    return allCategories.find((c) => c.id === id)?.name || id;
  };

  const handleSend = async () => {
    const validatedData = {
      title: formData.title,
      body: formData.body,
      targetCategoryId: formData.targetCategoryId === 'all' ? null : formData.targetCategoryId,
    };

    const result = notificationSchema.safeParse(validatedData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setIsSending(true);

    // Simulate sending delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    sendNotification({
      title: result.data.title,
      body: result.data.body,
      targetCategoryId: result.data.targetCategoryId,
    });
    toast.success('Notification sent successfully');

    setFormData({ title: '', body: '', targetCategoryId: 'all' });
    setErrors({});
    setIsSending(false);
  };

  return (
    <AdminLayout
      title="Notifications"
      description="Send notifications to subscribed users"
    >
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Compose Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5 text-primary" />
              Compose Notification
            </CardTitle>
            <CardDescription>
              Send a notification to users subscribed to specific categories
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="notif-title">Title</Label>
              <Input
                id="notif-title"
                value={formData.title}
                onChange={(e) => {
                  setFormData({ ...formData, title: e.target.value });
                  setErrors({ ...errors, title: '' });
                }}
                placeholder="Notification title"
                maxLength={100}
              />
              {errors.title && (
                <p className="text-sm text-destructive">{errors.title}</p>
              )}
              <p className="text-xs text-muted-foreground">
                {formData.title.length}/100 characters
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notif-body">Body</Label>
              <Textarea
                id="notif-body"
                value={formData.body}
                onChange={(e) => {
                  setFormData({ ...formData, body: e.target.value });
                  setErrors({ ...errors, body: '' });
                }}
                placeholder="Write your notification message..."
                rows={4}
                maxLength={500}
              />
              {errors.body && (
                <p className="text-sm text-destructive">{errors.body}</p>
              )}
              <p className="text-xs text-muted-foreground">
                {formData.body.length}/500 characters
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notif-category">Target Audience</Label>
              <Select
                value={formData.targetCategoryId}
                onValueChange={(value) =>
                  setFormData({ ...formData, targetCategoryId: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select target" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All subscribers</SelectItem>
                  <Separator className="my-1" />
                  {allCategories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name} subscribers
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Only users subscribed to the selected category will receive this notification
              </p>
            </div>

            <Button
              onClick={handleSend}
              disabled={isSending}
              className="w-full gap-2"
            >
              {isSending ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Send Notification
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* History Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Notification History
            </CardTitle>
            <CardDescription>
              Previously sent notifications
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  className="rounded-lg border border-border p-4 transition-soft hover:bg-muted/30"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <h4 className="font-medium">{notif.title}</h4>
                      <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                        {notif.body}
                      </p>
                    </div>
                    <Badge variant="outline" className="shrink-0">
                      {getCategoryName(notif.targetCategoryId)}
                    </Badge>
                  </div>

                  <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDistanceToNow(notif.sentAt, { addSuffix: true })}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {notif.recipientCount.toLocaleString()} recipients
                    </span>
                  </div>
                </div>
              ))}

              {notifications.length === 0 && (
                <div className="py-8 text-center text-muted-foreground">
                  <Bell className="mx-auto mb-2 h-8 w-8 opacity-50" />
                  <p>No notifications sent yet</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
