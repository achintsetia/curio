import { useState, useEffect } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  RefreshCw,
  Rss,
  Globe,
  Clock,
  FileText,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useAdminStore } from '@/store/useAdminStore';
import { Feed } from '@/data/adminMockData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { z } from 'zod';

const feedSchema = z.object({
  name: z.string().trim().min(1, 'Feed name is required').max(100, 'Name must be less than 100 characters'),
  url: z.string().trim().url('Please enter a valid URL'),
  type: z.enum(['rss', 'api']),
});

export default function AdminFeeds() {
  const { feeds, feedsLoading, categories, subscribeToFeeds, addFeed, updateFeed, deleteFeed, refreshFeed } =
    useAdminStore();

  useEffect(() => {
    const unsubscribe = subscribeToFeeds();
    return () => unsubscribe();
  }, [subscribeToFeeds]);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedFeed, setSelectedFeed] = useState<Feed | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    type: 'rss' as 'rss' | 'api',
  });

  const allCategories = categories.flatMap((cat) => [
    { id: cat.id, name: cat.name, isParent: true },
    ...(cat.subcategories?.map((sub) => ({
      id: sub.id,
      name: `${cat.name} / ${sub.name}`,
      isParent: false,
    })) || []),
  ]);

  const getCategoryName = (id: string) => {
    return allCategories.find((c) => c.id === id)?.name || id;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'running':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      default:
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge variant="default" className="bg-green-500/10 text-green-500 border-green-500/20">Success</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      case 'running':
        return <Badge variant="secondary" className="bg-blue-500/10 text-blue-500 border-blue-500/20">Running</Badge>;
      case 'pending':
        return <Badge variant="outline" className="text-yellow-500 border-yellow-500/30">Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const resetForm = () => {
    setFormData({ name: '', url: '', type: 'rss' });
    setErrors({});
  };

  const handleCreate = async () => {
    const result = feedSchema.safeParse(formData);
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

    try {
      await addFeed({
        name: result.data.name,
        url: result.data.url,
        type: result.data.type,
      });
      toast.success('Feed created');
      setIsCreateOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error creating feed:', error);
      toast.error('Failed to create feed');
    }
  };

  const handleEdit = async () => {
    const result = feedSchema.safeParse(formData);
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

    if (selectedFeed) {
      try {
        await updateFeed(selectedFeed.id, result.data);
        toast.success('Feed updated');
        setIsEditOpen(false);
        setSelectedFeed(null);
        resetForm();
      } catch (error) {
        console.error('Error updating feed:', error);
        toast.error('Failed to update feed');
      }
    }
  };

  const handleDelete = async () => {
    if (selectedFeed) {
      try {
        await deleteFeed(selectedFeed.id);
        toast.success('Feed deleted');
        setIsDeleteOpen(false);
        setSelectedFeed(null);
      } catch (error) {
        console.error('Error deleting feed:', error);
        toast.error('Failed to delete feed');
      }
    }
  };

  const handleRefresh = (feed: Feed) => {
    refreshFeed(feed.id);
    toast.success(`Refreshing ${feed.name}...`);
  };

  const openEdit = (feed: Feed) => {
    setSelectedFeed(feed);
    setFormData({
      name: feed.name,
      url: feed.url,
      type: feed.type,
    });
    setErrors({});
    setIsEditOpen(true);
  };

  const openDelete = (feed: Feed) => {
    setSelectedFeed(feed);
    setIsDeleteOpen(true);
  };

  const openCreate = () => {
    resetForm();
    setIsCreateOpen(true);
  };

  return (
    <AdminLayout
      title="Article Feeds"
      description="Manage RSS and API feeds for article ingestion"
    >
      <div className="space-y-6">
        <div className="flex justify-end">
          <Button onClick={openCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Feed
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Active Feeds</CardTitle>
          </CardHeader>
          <CardContent>
            {feedsLoading ? (
              <div className="py-8 text-center text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                Loading feeds...
              </div>
            ) : (
              <div className="space-y-3">
                {feeds.map((feed) => (
                  <div
                    key={feed.id}
                    className="group flex items-center gap-4 rounded-lg border border-border p-4 transition-soft"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                      {feed.type === 'rss' ? (
                        <Rss className="h-5 w-5 text-primary" />
                      ) : (
                        <Globe className="h-5 w-5 text-primary" />
                      )}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{feed.name}</h3>
                        <Badge variant={feed.type === 'rss' ? 'default' : 'secondary'}>
                          {feed.type.toUpperCase()}
                        </Badge>
                        {getStatusBadge(feed.status)}
                      </div>
                      {feed.categoryId && (
                        <p className="text-sm text-muted-foreground">
                          {getCategoryName(feed.categoryId)}
                        </p>
                      )}
                      <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          {feed.fresh_articles_count} fresh articles
                        </span>
                        {feed.last_runtime && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Last run {formatDistanceToNow(feed.last_runtime, { addSuffix: true })}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 opacity-0 transition-soft group-hover:opacity-100">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleRefresh(feed)}
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => openEdit(feed)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => openDelete(feed)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}

                {feeds.length === 0 && (
                  <div className="py-8 text-center text-muted-foreground">
                    No feeds configured. Add your first feed to start ingesting articles.
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog
        open={isCreateOpen || isEditOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsCreateOpen(false);
            setIsEditOpen(false);
            setSelectedFeed(null);
            resetForm();
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isEditOpen ? 'Edit Feed' : 'Add Feed'}</DialogTitle>
            <DialogDescription>
              {isEditOpen
                ? 'Update the feed configuration.'
                : 'Add a new RSS or API feed for article ingestion.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="feed-name">Name</Label>
              <Input
                id="feed-name"
                value={formData.name}
                onChange={(e) => {
                  setFormData({ ...formData, name: e.target.value });
                  setErrors({ ...errors, name: '' });
                }}
                placeholder="Enter feed name"
                maxLength={100}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="feed-url">Feed URL</Label>
              <Input
                id="feed-url"
                value={formData.url}
                onChange={(e) => {
                  setFormData({ ...formData, url: e.target.value });
                  setErrors({ ...errors, url: '' });
                }}
                placeholder="https://example.com/feed.rss"
              />
              {errors.url && (
                <p className="text-sm text-destructive">{errors.url}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="feed-type">Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value: 'rss' | 'api') =>
                  setFormData({ ...formData, type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rss">RSS Feed</SelectItem>
                  <SelectItem value="api">API Endpoint</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateOpen(false);
                setIsEditOpen(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button onClick={isEditOpen ? handleEdit : handleCreate}>
              {isEditOpen ? 'Save Changes' : 'Add Feed'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Feed</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedFeed?.name}"? This will
              not delete the articles already ingested from this feed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
