import { useState } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  RefreshCw,
  Rss,
  Globe,
  Power,
  PowerOff,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useAdminStore } from '@/store/useAdminStore';
import { Feed } from '@/data/adminMockData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
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
import { cn } from '@/lib/utils';
import { z } from 'zod';

const feedSchema = z.object({
  name: z.string().trim().min(1, 'Feed name is required').max(100, 'Name must be less than 100 characters'),
  url: z.string().trim().url('Please enter a valid URL'),
  type: z.enum(['rss', 'api']),
  categoryId: z.string().min(1, 'Please select a category'),
});

export default function AdminFeeds() {
  const { feeds, categories, addFeed, updateFeed, deleteFeed, toggleFeed, refreshFeed } =
    useAdminStore();

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
    categoryId: '',
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

  const resetForm = () => {
    setFormData({ name: '', url: '', type: 'rss', categoryId: '' });
    setErrors({});
  };

  const handleCreate = () => {
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

    addFeed({
      name: result.data.name,
      url: result.data.url,
      type: result.data.type,
      categoryId: result.data.categoryId,
      enabled: true,
    });
    toast.success('Feed created');
    setIsCreateOpen(false);
    resetForm();
  };

  const handleEdit = () => {
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
      updateFeed(selectedFeed.id, result.data);
      toast.success('Feed updated');
      setIsEditOpen(false);
      setSelectedFeed(null);
      resetForm();
    }
  };

  const handleDelete = () => {
    if (selectedFeed) {
      deleteFeed(selectedFeed.id);
      toast.success('Feed deleted');
      setIsDeleteOpen(false);
      setSelectedFeed(null);
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
      categoryId: feed.categoryId,
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
            <div className="space-y-3">
              {feeds.map((feed) => (
                <div
                  key={feed.id}
                  className={cn(
                    'group flex items-center gap-4 rounded-lg border border-border p-4 transition-soft',
                    !feed.enabled && 'opacity-60'
                  )}
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
                      {!feed.enabled && (
                        <Badge variant="outline" className="text-muted-foreground">
                          Disabled
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {getCategoryName(feed.categoryId)} • {feed.articleCount} articles
                    </p>
                    {feed.lastRefreshed && (
                      <p className="text-xs text-muted-foreground">
                        Last refreshed{' '}
                        {formatDistanceToNow(feed.lastRefreshed, { addSuffix: true })}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Switch
                      checked={feed.enabled}
                      onCheckedChange={() => toggleFeed(feed.id)}
                    />
                  </div>

                  <div className="flex items-center gap-1 opacity-0 transition-soft group-hover:opacity-100">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleRefresh(feed)}
                      disabled={!feed.enabled}
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

            <div className="space-y-2">
              <Label htmlFor="feed-category">Category</Label>
              <Select
                value={formData.categoryId}
                onValueChange={(value) => {
                  setFormData({ ...formData, categoryId: value });
                  setErrors({ ...errors, categoryId: '' });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {allCategories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.categoryId && (
                <p className="text-sm text-destructive">{errors.categoryId}</p>
              )}
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
