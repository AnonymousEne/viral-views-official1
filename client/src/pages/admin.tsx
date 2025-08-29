import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { 
  Users, 
  Music, 
  Swords, 
  Headphones, 
  BarChart3, 
  Trash2, 
  UserCheck, 
  Shield,
  Eye,
  Clock
} from 'lucide-react';
import type { User } from '@shared/schema';

export default function Admin() {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [newRole, setNewRole] = useState<string>('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Admin stats query
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/admin/stats'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/admin/stats');
      return await response.json();
    },
  });

  // Users query
  const { data: users, isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ['/api/admin/users'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/admin/users');
      return await response.json();
    },
  });

  // Update user role mutation
  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const response = await apiRequest('PATCH', `/api/admin/users/${userId}/role`, { role });
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Role Updated',
        description: 'User role has been updated successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      setSelectedUserId(null);
      setNewRole('');
    },
    onError: (error: any) => {
      toast({
        title: 'Update Failed',
        description: error.message || 'Failed to update user role.',
        variant: 'destructive',
      });
    },
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await apiRequest('DELETE', `/api/admin/users/${userId}`);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: 'User Deleted',
        description: 'User has been deleted successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Delete Failed',
        description: error.message || 'Failed to delete user.',
        variant: 'destructive',
      });
    },
  });

  const handleRoleUpdate = (userId: string) => {
    if (!newRole) return;
    updateRoleMutation.mutate({ userId, role: newRole });
  };

  const handleDeleteUser = (userId: string, username: string) => {
    if (window.confirm(`Are you sure you want to delete user "${username}"? This action cannot be undone.`)) {
      deleteUserMutation.mutate(userId);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-500';
      case 'artist': return 'bg-purple-500';
      case 'producer': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <Shield className="h-8 w-8 text-red-500" />
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        </div>
        <p className="text-gray-400">Manage your music platform</p>
      </div>

      <Tabs defaultValue="overview" className="space-y-8">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview" data-testid="tab-overview">
            <BarChart3 className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="users" data-testid="tab-users">
            <Users className="h-4 w-4 mr-2" />
            Users
          </TabsTrigger>
          <TabsTrigger value="content" data-testid="tab-content">
            <Eye className="h-4 w-4 mr-2" />
            Content
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {statsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-16 bg-gray-300 rounded"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-400">Total Users</p>
                      <p className="text-3xl font-bold">{stats?.totalUsers || 0}</p>
                    </div>
                    <Users className="h-8 w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-400">Total Tracks</p>
                      <p className="text-3xl font-bold">{stats?.totalTracks || 0}</p>
                    </div>
                    <Music className="h-8 w-8 text-purple-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-400">Total Battles</p>
                      <p className="text-3xl font-bold">{stats?.totalBattles || 0}</p>
                    </div>
                    <Swords className="h-8 w-8 text-orange-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-400">Total Beats</p>
                      <p className="text-3xl font-bold">{stats?.totalBeats || 0}</p>
                    </div>
                    <Headphones className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="h-5 w-5" />
                <span>Recent Activity</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stats?.recentActivity?.length > 0 ? (
                <div className="space-y-4">
                  {stats.recentActivity.map((activity: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-dark-200 rounded-lg">
                      <div className="flex items-center space-x-3">
                        {activity.type === 'track' ? (
                          <Music className="h-5 w-5 text-purple-500" />
                        ) : (
                          <Swords className="h-5 w-5 text-orange-500" />
                        )}
                        <div>
                          <p className="font-medium">{activity.data.title}</p>
                          <p className="text-sm text-gray-400">
                            {activity.type === 'track' ? `By ${activity.data.artistName}` : 
                             `${activity.data.contestant1Name} vs ${activity.data.contestant2Name}`}
                          </p>
                        </div>
                      </div>
                      <Badge variant="secondary">{activity.type}</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-center py-8">No recent activity</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <p className="text-sm text-gray-400">Manage user accounts and permissions</p>
            </CardHeader>
            <CardContent>
              {usersLoading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-16 bg-gray-300 rounded animate-pulse"></div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {users?.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div>
                          <div className="flex items-center space-x-2">
                            <p className="font-medium">{user.displayName}</p>
                            <Badge className={getRoleBadgeColor(user.role)}>{user.role}</Badge>
                          </div>
                          <p className="text-sm text-gray-400">@{user.username} • {user.email}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {selectedUserId === user.id ? (
                          <div className="flex items-center space-x-2">
                            <Select value={newRole} onValueChange={setNewRole}>
                              <SelectTrigger className="w-32">
                                <SelectValue placeholder="Role" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="fan">Fan</SelectItem>
                                <SelectItem value="artist">Artist</SelectItem>
                                <SelectItem value="producer">Producer</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button
                              size="sm"
                              onClick={() => handleRoleUpdate(user.id)}
                              disabled={updateRoleMutation.isPending || !newRole}
                              data-testid={`button-save-role-${user.id}`}
                            >
                              <UserCheck className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedUserId(null);
                                setNewRole('');
                              }}
                            >
                              Cancel
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedUserId(user.id);
                                setNewRole(user.role);
                              }}
                              data-testid={`button-edit-role-${user.id}`}
                            >
                              Edit Role
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDeleteUser(user.id, user.username || 'unknown')}
                              disabled={deleteUserMutation.isPending}
                              data-testid={`button-delete-user-${user.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="content" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Content Management</CardTitle>
              <p className="text-sm text-gray-400">Moderate platform content</p>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-400">
                <Eye className="h-12 w-12 mx-auto mb-4" />
                <p>Content moderation tools coming soon</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}