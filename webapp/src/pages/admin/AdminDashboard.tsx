import { useEffect } from 'react';
import { FolderTree, Rss, FileText, Bell, TrendingUp, Users } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAdminStore } from '@/store/useAdminStore';
import { useAppStore } from '@/store/useAppStore';

export default function AdminDashboard() {
  const { feeds, notifications, subscribeToFeeds } = useAdminStore();
  const { articles, categories, fetchCategoriesTree } = useAppStore();

  useEffect(() => {
    const unsubscribeFeeds = subscribeToFeeds();
    fetchCategoriesTree();
    return () => {
      unsubscribeFeeds();
    };
  }, [subscribeToFeeds, fetchCategoriesTree]);

  const totalCategories = categories.reduce(
    (acc, cat) => acc + 1 + (cat.subcategories?.length || 0),
    0
  );

  const successFeeds = feeds.filter((f) => f.status === 'success').length;
  const errorFeeds = feeds.filter((f) => f.status === 'error' || f.status === 'failed').length;

  const stats = [
    {
      title: 'Total Categories',
      value: totalCategories,
      icon: FolderTree,
      description: `${categories.length} parent categories`,
    },
    {
      title: 'Total Feeds',
      value: feeds.length,
      icon: Rss,
      description: `${successFeeds} active, ${errorFeeds} with errors`,
    },
    {
      title: 'Total Articles',
      value: articles.length,
      icon: FileText,
      description: `${articles.filter((a) => !a.isRead).length} unread`,
    },
    {
      title: 'Notifications Sent',
      value: notifications.length,
      icon: Bell,
      description: 'All time',
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-500';
      case 'error':
      case 'failed':
        return 'bg-red-500';
      case 'running':
        return 'bg-blue-500';
      default:
        return 'bg-yellow-500';
    }
  };

  return (
    <AdminLayout
      title="Dashboard"
      description="Overview of your Curio news platform"
    >
      <div className="space-y-6">
        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.title} className="transition-soft hover:shadow-card-hover">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">{stat.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <TrendingUp className="h-5 w-5 text-primary" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {notifications.slice(0, 3).map((notif) => (
                  <div
                    key={notif.id}
                    className="flex items-start gap-3 rounded-lg border border-border p-3"
                  >
                    <Bell className="mt-0.5 h-4 w-4 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{notif.title}</p>
                      <p className="text-xs text-muted-foreground">
                        Sent to {notif.recipientCount} subscribers
                      </p>
                    </div>
                  </div>
                ))}
                {notifications.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No notifications yet
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="h-5 w-5 text-primary" />
                Feed Health
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {feeds.slice(0, 3).map((feed) => (
                  <div
                    key={feed.id}
                    className="flex items-center justify-between rounded-lg border border-border p-3"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-2 w-2 rounded-full ${getStatusColor(feed.status)}`}
                      />
                      <span className="text-sm font-medium">{feed.name}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {feed.fresh_articles_count} fresh articles
                    </span>
                  </div>
                ))}
                {feeds.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No feeds configured
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}

