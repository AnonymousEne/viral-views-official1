
import { useState } from "react";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useBattles, useActiveBattles, useCreateCollaboration, useUsers, useTracks } from '@/hooks/useApi';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Trophy, Users, Play, Music, Edit, Share } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { insertCollaborationSchema, type InsertCollaboration, type Track, type Beat, type Battle } from '@shared/schema';
import { useAuth } from '@/hooks/useAuth';
import { useUpdateUserProfile, useBeats, useUserBattles, useUserCollaborations, useCreateBeat, useCreateTrack } from '@/hooks/useApi';
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from '@/components/ui/skeleton';

export default function ProfilePage() {
  const { toast } = useToast();
  // Auth and user state
  const { user } = useAuth();
  // Don't run hooks that depend on user until user is loaded
  const { mutate: createBeat } = useCreateBeat();
  const { mutate: createTrack } = useCreateTrack();
  // Upload Beat modal state
  // Upload Track modal state
  const [uploadTrackOpen, setUploadTrackOpen] = useState(false);
  const [trackTitle, setTrackTitle] = useState("");
  const [trackDesc, setTrackDesc] = useState("");
  const [trackFile, setTrackFile] = useState<File | null>(null);
  const [uploadTrackError, setUploadTrackError] = useState("");
  const [uploadingTrack, setUploadingTrack] = useState(false);
  const [trackCoverFile, setTrackCoverFile] = useState<File | null>(null);
  const [trackCoverUrl, setTrackCoverUrl] = useState("");
  const [uploadBeatOpen, setUploadBeatOpen] = useState(false);
  const [beatTitle, setBeatTitle] = useState("");
  const [beatDesc, setBeatDesc] = useState("");
  const [beatFile, setBeatFile] = useState<File | null>(null);
  const [beatType, setBeatType] = useState("sell");
  const [uploadError, setUploadError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [beatCoverFile, setBeatCoverFile] = useState<File | null>(null);
  const [beatCoverUrl, setBeatCoverUrl] = useState("");

  const openUploadBeat = () => {
    setBeatTitle("");
    setBeatDesc("");
    setBeatFile(null);
    setBeatType("sell");
    setBeatCoverFile(null);
    setBeatCoverUrl("");
    setUploadError("");
    setUploadBeatOpen(true);
  };

  const handleUploadBeat = () => {
    openUploadBeat();
  };

  const handleUploadBeatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    setUploadError("");
    if (!beatFile) {
      setUploadError("Please select an audio file.");
      setUploading(false);
      return;
    }
    let coverImageUrl = "";
    if (beatCoverFile) {
      const coverForm = new FormData();
      coverForm.append('image', beatCoverFile);
      const coverRes = await fetch('/api/upload/image', {
        method: 'POST',
        body: coverForm,
        credentials: 'include',
      });
      if (!coverRes.ok) throw new Error('Cover image upload failed');
      const coverData = await coverRes.json();
      coverImageUrl = coverData.url;
    } else if (beatCoverUrl) {
      coverImageUrl = beatCoverUrl;
    }
    try {
      // 1. Upload audio file
      const formData = new FormData();
      formData.append('audio', beatFile);
      const audioRes = await fetch('/api/upload/audio', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      if (!audioRes.ok) throw new Error('Audio upload failed');
      const audioData = await audioRes.json();
      const audioUrl = audioData.url;
      // 2. Create beat
      if (!user) throw new Error('User not loaded');
      createBeat({
        title: beatTitle,
        audioUrl,
        producerId: user.id,
        producerName: user.displayName || user.firstName || '',
        coverImage: coverImageUrl,
        genre: 'Other',
        bpm: 120,
        price: '0',
        licenseType: beatType,
        tags: [],
      }, {
        onSuccess: () => {
          setUploading(false);
          setUploadBeatOpen(false);
        },
        onError: (err: any) => {
          setUploading(false);
          setUploadError(err.message || 'Failed to create beat');
        }
      });
    } catch (err: any) {
      setUploading(false);
      setUploadError(err.message || 'Upload failed');
    }
  };
  // Action handlers (placeholders)
  const openUploadTrack = () => {
    setTrackTitle("");
    setTrackDesc("");
    setTrackFile(null);
    setTrackCoverFile(null);
    setTrackCoverUrl("");
    setUploadTrackError("");
    setUploadTrackOpen(true);
  };

  const handleUploadTrack = () => {
    openUploadTrack();
  };

  const handleUploadTrackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploadingTrack(true);
    setUploadTrackError("");
    if (!trackFile) {
      setUploadTrackError("Please select an audio file.");
      setUploadingTrack(false);
      return;
    }
    let coverImageUrl = "";
    if (trackCoverFile) {
      const coverForm = new FormData();
      coverForm.append('image', trackCoverFile);
      const coverRes = await fetch('/api/upload/image', {
        method: 'POST',
        body: coverForm,
        credentials: 'include',
      });
      if (!coverRes.ok) throw new Error('Cover image upload failed');
      const coverData = await coverRes.json();
      coverImageUrl = coverData.url;
    } else if (trackCoverUrl) {
      coverImageUrl = trackCoverUrl;
    }
    try {
      // 1. Upload audio file
      const formData = new FormData();
      formData.append('audio', trackFile);
      const audioRes = await fetch('/api/upload/audio', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      if (!audioRes.ok) throw new Error('Audio upload failed');
      const audioData = await audioRes.json();
      const audioUrl = audioData.url;
      // 2. Create track
      if (!user) throw new Error('User not loaded');
      createTrack({
        title: trackTitle,
        audioUrl,
        artistId: user.id,
        artistName: user.displayName || user.firstName || '',
        coverImage: coverImageUrl,
        genre: 'Other',
        bpm: 120,
      }, {
        onSuccess: () => {
          setUploadingTrack(false);
          setUploadTrackOpen(false);
        },
        onError: (err: any) => {
          setUploadingTrack(false);
          setUploadTrackError(err.message || 'Failed to create track');
        }
      });
    } catch (err: any) {
      setUploadingTrack(false);
      setUploadTrackError(err.message || 'Upload failed');
    }
  };
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null);
  const [playingBeatId, setPlayingBeatId] = useState<string | null>(null);
  const handlePlayTrack = (trackId: string) => {
    setPlayingTrackId(trackId === playingTrackId ? null : trackId);
    setPlayingBeatId(null);
  };
  const handlePlayBeat = (beatId: string) => {
    setPlayingBeatId(beatId === playingBeatId ? null : beatId);
    setPlayingTrackId(null);
  };

  // Join Battle Modal State
  const [joinBattleOpen, setJoinBattleOpen] = useState(false);
  const [joiningBattleId, setJoiningBattleId] = useState<string | null>(null);
  const { data: availableBattles = [], isLoading: battlesLoadingAll } = useBattles();
  const handleJoinBattle = () => setJoinBattleOpen(true);

  // Start Collaboration Modal State
  const [startCollabOpen, setStartCollabOpen] = useState(false);
  const handleStartCollab = () => setStartCollabOpen(true);


  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editAvatar, setEditAvatar] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  // Fetch user content (only after user is loaded)
  const { data: userTracks = [], isLoading: tracksLoading } = useTracks(user?.id);
  const { data: userBeats = [], isLoading: beatsLoading } = useBeats(undefined, user?.id);
  const { data: userBattles = [], isLoading: battlesLoading } = useUserBattles(user?.id ?? "");
  const { data: userCollabs = [], isLoading: collabsLoading } = useUserCollaborations(user?.id ?? "");

  // Open edit modal and initialize fields
  const openEdit = () => {
    setEditName(user?.displayName || "");
    setEditBio(user?.bio || "");
    setEditAvatar(user?.profileImageUrl || "");
    setError("");
    setEditOpen(true);
  };

  // Profile update mutation
  const updateProfile = useUpdateUserProfile();

  // Handle profile save
  const handleEditSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    updateProfile.mutate(
      {
        displayName: editName,
        bio: editBio,
        profileImageUrl: editAvatar,
      },
      {
        onSuccess: () => {
          setSaving(false);
          setEditOpen(false);
        },
        onError: (err: any) => {
          setSaving(false);
          setError(err.message || 'Failed to update profile');
        },
      }
    );
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-white text-xl">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      <div className="flex flex-col md:flex-row items-center md:items-start gap-8 mb-8">
        <img
          src={user.profileImageUrl || "/default-avatar.png"}
          alt="Avatar"
          className="w-32 h-32 rounded-full object-cover border-4 border-purple-500 shadow-lg"
        />
        <div className="flex-1 w-full">
          <div className="flex items-center gap-4 mb-2">
            <h1 className="text-3xl font-bold text-white" data-testid="profile-display-name">
              {user.displayName}
            </h1>
            <Badge className="bg-purple-500 text-white text-xs px-2 py-1 rounded">{user.role || "Artist"}</Badge>
            <Dialog open={editOpen} onOpenChange={setEditOpen}>
              <DialogTrigger asChild>
                <Button size="icon" variant="ghost" className="text-purple-400 hover:text-purple-200" onClick={openEdit} data-testid="button-edit-profile">
                  <Edit className="w-5 h-5" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit Profile</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleEditSave} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-white mb-1">Display Name</label>
                    <input
                      className="w-full rounded bg-dark-300 text-white p-2"
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white mb-1">Bio</label>
                    <textarea
                      className="w-full rounded bg-dark-300 text-white p-2"
                      value={editBio}
                      onChange={e => setEditBio(e.target.value)}
                      rows={3}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white mb-1">Avatar URL</label>
                    <input
                      className="w-full rounded bg-dark-300 text-white p-2"
                      value={editAvatar}
                      onChange={e => setEditAvatar(e.target.value)}
                    />
                  </div>
                  {error && <div className="text-red-500 text-sm">{error}</div>}
                  <DialogFooter>
                    <Button type="submit" className="bg-purple-500 text-white" disabled={saving}>
                      {saving ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
          <p className="text-gray-400 mb-4 max-w-2xl" data-testid="profile-bio">
            {user.bio}
          </p>
        </div>
      </div>
      <Tabs defaultValue="tracks" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="tracks" className="data-[state=active]:bg-purple-500 data-[state=active]:text-white" data-testid="tab-tracks">
            <Music className="w-4 h-4 mr-2" />Tracks
          </TabsTrigger>
          <TabsTrigger value="beats" className="data-[state=active]:bg-purple-500 data-[state=active]:text-white" data-testid="tab-beats">
            <Music className="w-4 h-4 mr-2" />Beats
          </TabsTrigger>
          <TabsTrigger value="battles" className="data-[state=active]:bg-purple-500 data-[state=active]:text-white" data-testid="tab-battles">
            <Trophy className="w-4 h-4 mr-2" />Battles
          </TabsTrigger>
          <TabsTrigger value="collaborations" className="data-[state=active]:bg-purple-500 data-[state=active]:text-white" data-testid="tab-collaborations">
            <Users className="w-4 h-4 mr-2" />Collabs
          </TabsTrigger>
        </TabsList>
        <TabsContent value="tracks">
          {tracksLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="bg-dark-200 border-dark-400">
                  <Skeleton className="aspect-video w-full" />
                  <CardContent className="p-4">
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2 mb-3" />
                    <Skeleton className="h-8 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : userTracks && userTracks.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {userTracks.map((track) => (
                <Card key={track.id} className="bg-dark-200 border-dark-400 hover:bg-dark-300 transition-colors">
                  <div className="aspect-video bg-dark-400 rounded-t-lg flex items-center justify-center overflow-hidden">
                    {track.coverImage ? (
                      <img src={track.coverImage} alt={track.title} className="object-cover w-full h-full" />
                    ) : (
                      <Music className="h-12 w-12 text-gray-400" />
                    )}
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-bold text-white mb-2" data-testid={`track-title-${track.id}`}>
                      {track.title}
                    </h3>
                    <div className="flex items-center justify-between text-sm text-gray-400 mb-3">
                      <span>👁 {track.plays?.toLocaleString()}</span>
                      <span>❤️ {track.likes?.toLocaleString()}</span>
                    </div>
                    <Button 
                      className="w-full bg-purple-500 hover:bg-purple-600 text-white"
                      data-testid={`button-play-${track.id}`}
                      onClick={() => handlePlayTrack(track.id)}
                    >
                      <Play className="w-4 h-4 mr-2" />
                      {playingTrackId === track.id ? 'Pause' : 'Play'}
                    </Button>
                    {playingTrackId === track.id && track.audioUrl && (
                      <audio
                        src={track.audioUrl}
                        controls
                        autoPlay
                        onEnded={() => setPlayingTrackId(null)}
                        className="w-full mt-2"
                      />
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Music className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-400 mb-2">No tracks yet</h3>
              <p className="text-gray-500 mb-6">Upload your first track to get started</p>
              <Button 
                className="bg-purple-500 hover:bg-purple-600 text-white font-bold"
                data-testid="button-upload-track"
                onClick={handleUploadTrack}
              >
                Upload Track
              </Button>
              <Dialog open={uploadTrackOpen} onOpenChange={setUploadTrackOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Upload Track</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleUploadTrackSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-white mb-1">Title</label>
                      <input
                        className="w-full rounded bg-dark-300 text-white p-2"
                        value={trackTitle}
                        onChange={e => setTrackTitle(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-white mb-1">Description</label>
                      <textarea
                        className="w-full rounded bg-dark-300 text-white p-2"
                        value={trackDesc}
                        onChange={e => setTrackDesc(e.target.value)}
                        rows={3}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-white mb-1">File</label>
                      <input
                        type="file"
                        accept="audio/*"
                        className="w-full text-white"
                        onChange={e => setTrackFile(e.target.files?.[0] || null)}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-white mb-1">Cover Image</label>
                      <input
                        type="file"
                        accept="image/*"
                        className="w-full text-white"
                        onChange={e => setTrackCoverFile(e.target.files?.[0] || null)}
                      />
                      <div className="text-xs text-gray-400 mt-1">Or paste image URL below</div>
                      <input
                        className="w-full rounded bg-dark-300 text-white p-2 mt-1"
                        placeholder="https://..."
                        value={trackCoverUrl}
                        onChange={e => setTrackCoverUrl(e.target.value)}
                      />
                    </div>
                    {uploadTrackError && <div className="text-red-500 text-sm">{uploadTrackError}</div>}
                    <DialogFooter>
                      <Button type="submit" className="bg-purple-500 text-white" disabled={uploadingTrack}>
                        {uploadingTrack ? 'Uploading...' : 'Upload Track'}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          )}
        </TabsContent>
        <TabsContent value="beats">
          {beatsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="bg-dark-200 border-dark-400">
                  <Skeleton className="aspect-video w-full" />
                  <CardContent className="p-4">
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2 mb-3" />
                    <Skeleton className="h-8 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : userBeats && userBeats.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {userBeats.map((beat) => (
                <Card key={beat.id} className="bg-dark-200 border-dark-400 hover:bg-dark-300 transition-colors">
                  <div className="aspect-video bg-dark-400 rounded-t-lg flex items-center justify-center overflow-hidden">
                    {beat.coverImage ? (
                      <img src={beat.coverImage} alt={beat.title} className="object-cover w-full h-full" />
                    ) : (
                      <Music className="h-12 w-12 text-gray-400" />
                    )}
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-bold text-white mb-2">{beat.title}</h3>
                    <div className="flex items-center justify-between text-sm text-gray-400 mb-3">
                      <span>👁 {beat.plays?.toLocaleString()}</span>
                      <span>❤️ {beat.likes?.toLocaleString()}</span>
                    </div>
                    <Button 
                      className="w-full bg-purple-500 hover:bg-purple-600 text-white"
                      onClick={() => handlePlayBeat(beat.id)}
                    >
                      <Play className="w-4 h-4 mr-2" />
                      {playingBeatId === beat.id ? 'Pause' : 'Play'}
                    </Button>
                    {playingBeatId === beat.id && beat.audioUrl && (
                      <audio
                        src={beat.audioUrl}
                        controls
                        autoPlay
                        onEnded={() => setPlayingBeatId(null)}
                        className="w-full mt-2"
                      />
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Music className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-400 mb-2">No beats yet</h3>
              <p className="text-gray-500 mb-6">Upload your beats to sell, use in battles, or share with the community.</p>
              <Button 
                className="bg-purple-500 hover:bg-purple-600 text-white font-bold"
                data-testid="button-upload-beat"
                onClick={handleUploadBeat}
              >
                Upload Beat
              </Button>
              <Dialog open={uploadBeatOpen} onOpenChange={setUploadBeatOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Upload Beat</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleUploadBeatSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-white mb-1">Title</label>
                      <input
                        className="w-full rounded bg-dark-300 text-white p-2"
                        value={beatTitle}
                        onChange={e => setBeatTitle(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-white mb-1">Description</label>
                      <textarea
                        className="w-full rounded bg-dark-300 text-white p-2"
                        value={beatDesc}
                        onChange={e => setBeatDesc(e.target.value)}
                        rows={3}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-white mb-1">File</label>
                      <input
                        type="file"
                        accept="audio/*"
                        className="w-full text-white"
                        onChange={e => setBeatFile(e.target.files?.[0] || null)}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-white mb-1">Cover Image</label>
                      <input
                        type="file"
                        accept="image/*"
                        className="w-full text-white"
                        onChange={e => setBeatCoverFile(e.target.files?.[0] || null)}
                      />
                      <div className="text-xs text-gray-400 mt-1">Or paste image URL below</div>
                      <input
                        className="w-full rounded bg-dark-300 text-white p-2 mt-1"
                        placeholder="https://..."
                        value={beatCoverUrl}
                        onChange={e => setBeatCoverUrl(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-white mb-1">Type</label>
                      <select
                        className="w-full rounded bg-dark-300 text-white p-2"
                        value={beatType}
                        onChange={e => setBeatType(e.target.value)}
                      >
                        <option value="sell">Sell</option>
                        <option value="battle">Battle</option>
                        <option value="share">Share</option>
                      </select>
                    </div>
                    {uploadError && <div className="text-red-500 text-sm">{uploadError}</div>}
                    <DialogFooter>
                      <Button type="submit" className="bg-purple-500 text-white" disabled={uploading}>
                        {uploading ? 'Uploading...' : 'Upload Beat'}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          )}
        </TabsContent>
        <TabsContent value="battles">
          {battlesLoading ? (
            <div className="text-center py-12">
              <Trophy className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-400 mb-2">Loading battles...</h3>
            </div>
          ) : userBattles && userBattles.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {userBattles.map((battle) => (
                <Card key={battle.id} className="bg-dark-200 border-dark-400 hover:bg-dark-300 transition-colors">
                  <CardContent className="p-4">
                    <h3 className="font-bold text-white mb-2">{battle.title}</h3>
                    <div className="flex items-center justify-between text-sm text-gray-400 mb-3">
                      <span>Status: {battle.status}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Trophy className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-400 mb-2">No battles yet</h3>
              <p className="text-gray-500 mb-6">Join your first rap battle</p>
              <Button 
                className="bg-purple-500 hover:bg-purple-600 text-white font-bold"
                data-testid="button-join-battle"
                onClick={handleJoinBattle}
              >
                Join Battle
              </Button>
              <Dialog open={joinBattleOpen} onOpenChange={setJoinBattleOpen}>
                <DialogContent className="max-w-2xl bg-dark-200 border-dark-400">
                  <DialogHeader>
                    <DialogTitle>Join a Battle</DialogTitle>
                  </DialogHeader>
                  {battlesLoadingAll ? (
                    <div className="text-center py-8">Loading battles...</div>
                  ) : (
                    <div className="space-y-4 max-h-[400px] overflow-y-auto">
                      {availableBattles.filter(b => !b.contestant2Id && b.status === 'active').length === 0 ? (
                        <div className="text-gray-400">No open battles available. Check back soon!</div>
                      ) : availableBattles.filter(b => !b.contestant2Id && b.status === 'active').map(battle => (
                        <div key={battle.id} className="p-4 bg-dark-300 rounded-lg flex flex-col md:flex-row md:items-center md:justify-between gap-2 border border-dark-400">
                          <div>
                            <div className="font-bold text-white">{battle.title}</div>
                            <div className="text-xs text-gray-400">Category: {battle.category}</div>
                            <div className="text-xs text-gray-400">Challenger: {battle.contestant1Name}</div>
                          </div>
                          <Button
                            className="bg-purple-500 hover:bg-purple-600 text-white"
                            disabled={joiningBattleId === battle.id}
                            onClick={async () => {
                              if (!user) return;
                              setJoiningBattleId(battle.id);
                              try {
                                const res = await fetch(`/api/battles/${battle.id}/join`, {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  credentials: 'include',
                                  body: JSON.stringify({
                                    contestant2Id: user.id,
                                    contestant2Name: user.displayName || user.firstName || '',
                                  }),
                                });
                                const data = await res.json();
                                if (!res.ok) throw new Error(data.message || 'Failed to join battle');
                                setJoinBattleOpen(false);
                                toast({ title: 'Joined Battle!', description: `You have joined "${battle.title}".` });
                                // Optionally refresh battles list
                                if (typeof window !== 'undefined' && window.location) {
                                  window.location.reload();
                                }
                              } catch (err) {
                                toast({ title: 'Error', description: (err as Error).message || 'Failed to join battle', variant: 'destructive' });
                              } finally {
                                setJoiningBattleId(null);
                              }
                            }}
                          >
                            {joiningBattleId === battle.id ? 'Joining...' : 'Join Battle'}
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setJoinBattleOpen(false)}>Cancel</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          )}
        </TabsContent>
         <TabsContent value="collaborations">
           {collabsLoading ? (
             <div className="text-center py-12">
               <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
               <h3 className="text-xl font-bold text-gray-400 mb-2">Loading collaborations...</h3>
             </div>
           ) : userCollabs && userCollabs.length > 0 ? (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               {userCollabs.map((collab) => (
                 <Card key={collab.id} className="bg-dark-200 border-dark-400 hover:bg-dark-300 transition-colors">
                   <CardContent className="p-4">
                     <h3 className="font-bold text-white mb-2">{collab.trackTitle || collab.id}</h3>
                     <div className="flex items-center justify-between text-sm text-gray-400 mb-3">
                       <span>Status: {collab.status}</span>
                     </div>
                   </CardContent>
                 </Card>
               ))}
             </div>
           ) : (
             <div className="text-center py-12">
               <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
               <h3 className="text-xl font-bold text-gray-400 mb-2">No collaborations yet</h3>
               <p className="text-gray-500 mb-6">Start collaborating with other artists</p>
               <Button 
                 className="bg-purple-500 hover:bg-purple-600 text-white font-bold"
                 data-testid="button-start-collab"
                 onClick={handleStartCollab}
               >
                 Start Collaboration
               </Button>
             </div>
           )}
           {/* Start Collaboration Modal (reuses CreateCollaborationDialog logic inline) */}

           <StartCollabModal open={startCollabOpen} onOpenChange={setStartCollabOpen} />
         </TabsContent>
        </Tabs>
      </div>
    );
  }



function StartCollabModal(props: { open: boolean, onOpenChange: (open: boolean) => void }) {
  const { open, onOpenChange } = props;
  const { user } = useAuth();
  const createCollaboration = useCreateCollaboration();
  const { data: users } = useUsers();
  const { data: tracks } = useTracks(user?.id);
  const collaborators = users?.filter(u => u.id !== user?.id && (u.role === 'artist' || u.role === 'producer'));
  const myTracks = tracks?.filter(t => t.artistId === user?.id);
  const ROLES = [
    { value: 'featured', label: 'Featured Artist', desc: 'Main vocal or rap feature' },
    { value: 'producer', label: 'Producer', desc: 'Beat production and mixing' },
    { value: 'writer', label: 'Writer', desc: 'Lyrics and songwriting' },
    { value: 'lead', label: 'Lead Artist', desc: 'Primary artist on track' },
  ];
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<InsertCollaboration>({
    resolver: zodResolver(insertCollaborationSchema),
    defaultValues: {
      initiatorId: user?.id || '',
      initiatorName: user?.displayName || '',
    },
  });
  const selectedTrackId = watch('trackId');
  const selectedCollaboratorId = watch('collaboratorId');
  const selectedRole = watch('role');
  const selectedTrack = myTracks?.find(t => t.id === selectedTrackId);
  const selectedCollaborator = collaborators?.find(u => u.id === selectedCollaboratorId);
  const onSubmit = async (data: InsertCollaboration) => {
    try {
      if (selectedTrack) data.trackTitle = selectedTrack.title;
      await createCollaboration.mutateAsync(data);
      reset();
      onOpenChange(false);
    } catch (error) { console.error('Failed to create collaboration:', error); }
  };
  const handleCollaboratorChange = (userId: string) => {
    const selectedUser = collaborators?.find(u => u.id === userId);
    if (selectedUser) {
      setValue('collaboratorId', userId);
      setValue('collaboratorName', selectedUser.displayName);
    }
  };
  const handleTrackChange = (trackId: string) => {
    const track = myTracks?.find(t => t.id === trackId);
    if (track) {
      setValue('trackId', trackId);
      setValue('trackTitle', track.title);
    }
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl bg-dark-200 border-dark-400">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-purple-400" />
            <span>Invite Collaborator</span>
          </DialogTitle>
          <div className="text-gray-400">Invite another artist or producer to collaborate on your track</div>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-white mb-1">Select Track*</label>
            <Select onValueChange={handleTrackChange}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a track to collaborate on" />
              </SelectTrigger>
              <SelectContent>
                {myTracks?.map((track) => (
                  <SelectItem key={track.id} value={track.id}>{track.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.trackId && <p className="text-red-400 text-sm">{errors.trackId.message}</p>}
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-white mb-1">Choose Collaborator*</label>
            <Select onValueChange={handleCollaboratorChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select an artist or producer" />
              </SelectTrigger>
              <SelectContent>
                {collaborators?.map((collaborator) => (
                  <SelectItem key={collaborator.id} value={collaborator.id}>{collaborator.displayName}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.collaboratorId && <p className="text-red-400 text-sm">{errors.collaboratorId.message}</p>}
          </div>
          <div className="space-y-3">
            <label className="block text-sm font-medium text-white mb-1">Collaboration Role*</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {ROLES.map((role) => (
                <div
                  key={role.value}
                  className={`p-4 border rounded-lg cursor-pointer transition-all ${selectedRole === role.value ? 'border-purple-400 bg-purple-400/10' : 'border-dark-400 hover:border-dark-300'}`}
                  onClick={() => setValue('role', role.value)}
                >
                  <h4 className="font-medium text-white">{role.label}</h4>
                  <p className="text-sm text-gray-400 mt-1">{role.desc}</p>
                </div>
              ))}
            </div>
            {errors.role && <p className="text-red-400 text-sm">{errors.role.message}</p>}
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-white mb-1">Collaboration Message</label>
            <Textarea
              {...register('description')}
              placeholder="Tell them about your vision for this collaboration..."
              className="bg-dark-300 border-dark-400 min-h-[100px]"
              rows={4}
            />
            <p className="text-xs text-gray-500">Explain what you're looking for and how they can contribute to the track</p>
          </div>
          {selectedTrack && selectedCollaborator && selectedRole && (
            <div className="p-4 bg-dark-300 rounded-lg border border-dark-400">
              <h4 className="font-medium text-white mb-3 flex items-center">Collaboration Preview</h4>
              <div className="space-y-2 text-sm">
                <p className="text-gray-300"><span className="text-purple-400">Track:</span> {selectedTrack.title}</p>
                <p className="text-gray-300"><span className="text-purple-400">Inviting:</span> {selectedCollaborator.displayName}</p>
                <p className="text-gray-300"><span className="text-purple-400">Role:</span> {ROLES.find(r => r.value === selectedRole)?.label}</p>
              </div>
            </div>
          )}
          <div className="flex justify-end space-x-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={createCollaboration.isPending || !selectedTrackId || !selectedCollaboratorId} className="bg-purple-500 hover:bg-purple-600">
              {createCollaboration.isPending ? 'Sending...' : 'Send Invitation'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

