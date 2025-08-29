import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, Plus, Users, Zap } from 'lucide-react';
import { useCollaborations, useUserCollaborations } from '@/hooks/useApi';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useAuth } from '@/hooks/useAuth';
import CollaborationCard from './collaboration-card';
import CreateCollaborationDialog from './create-collaboration-dialog';
import LoadingSpinner from '@/components/ui/loading-spinner';
import type { Collaboration } from '@shared/schema';

const STATUSES = ['all', 'pending', 'active', 'completed', 'declined'];
const ROLES = ['all', 'lead', 'featured', 'producer', 'writer'];

export default function CollaborationList() {
  const { user } = useAuth();
  const { subscribeToMessage } = useWebSocket();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedRole, setSelectedRole] = useState('all');
  const [viewType, setViewType] = useState<'all' | 'my'>('my');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [liveUpdates, setLiveUpdates] = useState<Map<string, Partial<Collaboration>>>(new Map());
  
  const { data: allCollaborations, isLoading: loadingAll } = useCollaborations();
  const { data: myCollaborations, isLoading: loadingMy } = useUserCollaborations(user?.id || '');
  
  const collaborations = viewType === 'all' ? allCollaborations : myCollaborations;
  const isLoading = viewType === 'all' ? loadingAll : loadingMy;

  // Subscribe to real-time collaboration updates
  useEffect(() => {
    const unsubscribeUpdate = subscribeToMessage('collaboration-update', (data) => {
      setLiveUpdates(prev => new Map(prev.set(data.collaborationId, data.updates)));
    });

    const unsubscribeStatusChange = subscribeToMessage('collaboration-status-change', (data) => {
      setLiveUpdates(prev => new Map(prev.set(data.collaborationId, {
        status: data.status,
        // updatedAt: new Date(), // Remove this field as it doesn't exist in schema
      })));
    });

    return () => {
      unsubscribeUpdate();
      unsubscribeStatusChange();
    };
  }, [subscribeToMessage]);
  
  const filteredCollaborations = collaborations?.filter((collab: Collaboration) => {
    // Apply live updates if available
    const updatedCollab = liveUpdates.has(collab.id) 
      ? { ...collab, ...liveUpdates.get(collab.id) }
      : collab;
      
    const matchesSearch = updatedCollab.trackTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         updatedCollab.initiatorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         updatedCollab.collaboratorName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || updatedCollab.status === selectedStatus;
    const matchesRole = selectedRole === 'all' || updatedCollab.role === selectedRole;
    
    return matchesSearch && matchesStatus && matchesRole;
  });

  const handleJoinSession = () => {
    // Navigate to live collaboration session
    console.log('Joining live collaboration session...');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Users className="w-6 h-6 text-purple-400" />
          <h1 className="text-2xl font-bold text-white">Collaborations</h1>
          <Badge variant="secondary">{collaborations?.length || 0}</Badge>
        </div>
        
        {user && (user.role === 'artist' || user.role === 'producer') && (
          <Button
            data-testid="button-invite-collaboration"
            onClick={() => setShowCreateDialog(true)}
            className="bg-purple-500 hover:bg-purple-600"
          >
            <Plus className="w-4 h-4 mr-2" />
            Invite Collaborator
          </Button>
        )}
      </div>

      {/* View Toggle */}
      <div className="flex items-center space-x-4">
        <div className="flex space-x-1">
          <Button
            data-testid="button-view-my"
            variant={viewType === 'my' ? "default" : "outline"}
            size="sm"
            onClick={() => setViewType('my')}
          >
            My Collaborations
          </Button>
          <Button
            data-testid="button-view-all"
            variant={viewType === 'all' ? "default" : "outline"}
            size="sm"
            onClick={() => setViewType('all')}
          >
            All Collaborations
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            data-testid="input-search-collaborations"
            placeholder="Search tracks or collaborators..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-dark-200 border-dark-400 text-white"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <div className="flex space-x-2">
            {STATUSES.map((status) => (
              <Button
                key={status}
                data-testid={`filter-status-${status}`}
                variant={selectedStatus === status ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedStatus(status)}
                className="text-xs"
              >
                {status === 'active' && <Zap className="w-3 h-3 mr-1" />}
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </Button>
            ))}
          </div>
        </div>

        {/* Role Filter */}
        <div className="flex flex-wrap gap-2">
          {ROLES.map((role) => (
            <Button
              key={role}
              data-testid={`filter-role-${role}`}
              variant={selectedRole === role ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedRole(role)}
              className="text-xs"
            >
              {role.charAt(0).toUpperCase() + role.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Pending', count: filteredCollaborations?.filter(c => c.status === 'pending').length || 0, color: 'text-yellow-400' },
          { label: 'Active', count: filteredCollaborations?.filter(c => c.status === 'active').length || 0, color: 'text-green-400' },
          { label: 'Completed', count: filteredCollaborations?.filter(c => c.status === 'completed').length || 0, color: 'text-blue-400' },
          { label: 'Total', count: filteredCollaborations?.length || 0, color: 'text-purple-400' },
        ].map((stat) => (
          <div key={stat.label} className="p-4 bg-dark-200 rounded-lg border border-dark-400">
            <p className="text-sm text-gray-400">{stat.label}</p>
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.count}</p>
          </div>
        ))}
      </div>

      {/* Collaboration List */}
      <div className="space-y-4">
        {filteredCollaborations?.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-300 mb-2">No collaborations found</h3>
            <p className="text-gray-500">
              {searchTerm || selectedStatus !== 'all' || selectedRole !== 'all'
                ? 'Try adjusting your search or filters'
                : viewType === 'my'
                  ? 'Start collaborating with other artists!'
                  : 'No collaborations available right now.'
              }
            </p>
          </div>
        ) : (
          filteredCollaborations?.map((collaboration: Collaboration) => {
            // Apply live updates if available
            const updatedCollab = liveUpdates.has(collaboration.id) 
              ? { ...collaboration, ...liveUpdates.get(collaboration.id) }
              : collaboration;
              
            return (
              <CollaborationCard
                key={collaboration.id}
                collaboration={updatedCollab as Collaboration}
                onJoinSession={handleJoinSession}
              />
            );
          })
        )}
      </div>

      {/* Create Collaboration Dialog */}
      {showCreateDialog && (
        <CreateCollaborationDialog
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
        />
      )}
    </div>
  );
}