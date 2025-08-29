import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { insertBattleSchema } from '@shared/schema';
import { useCreateBattle, useUsers } from '@/hooks/useApi';
import { useAuth } from '@/hooks/useAuth';
import { Trophy, Calendar } from 'lucide-react';
import type { InsertBattle } from '@shared/schema';

interface CreateBattleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CATEGORIES = [
  { value: 'freestyle', label: 'Freestyle Battle' },
  { value: 'championship', label: 'Championship Battle' },
  { value: 'team', label: 'Team Battle' },
  { value: 'open_mic', label: 'Open Mic Battle' },
];

export default function CreateBattleDialog({ open, onOpenChange }: CreateBattleDialogProps) {
  const { user } = useAuth();
  const createBattle = useCreateBattle();
  const { data: users } = useUsers();

  // Filter to artists and producers only
  const contestants = users?.filter(u => 
    u.role === 'artist' || u.role === 'producer'
  );

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<InsertBattle>({
    resolver: zodResolver(insertBattleSchema),
    defaultValues: {
      contestant1Id: user?.id || '',
      contestant1Name: user?.displayName || '',
    },
  });

  const selectedContestant2 = watch('contestant2Id');

  const onSubmit = async (data: InsertBattle) => {
    try {
      // Set end time to 24 hours from now if not specified
      if (!data.endTime) {
        const endTime = new Date();
        endTime.setHours(endTime.getHours() + 24);
        data.endTime = endTime;
      }
      
      await createBattle.mutateAsync(data);
      reset();
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to create battle:', error);
    }
  };

  const handleContestant2Change = (userId: string) => {
    const selectedUser = contestants?.find(u => u.id === userId);
    if (selectedUser) {
      setValue('contestant2Id', userId);
      setValue('contestant2Name', selectedUser.displayName);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-dark-200 border-dark-400">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Trophy className="w-5 h-5 text-gold-400" />
            <span>Create New Battle</span>
          </DialogTitle>
          <DialogDescription>
            Challenge another artist to an epic battle
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Battle Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Battle Title*</Label>
            <Input
              id="title"
              data-testid="input-battle-title"
              {...register('title')}
              placeholder="Epic Rap Battle of History"
              className="bg-dark-300 border-dark-400"
            />
            {errors.title && (
              <p className="text-red-400 text-sm">{errors.title.message}</p>
            )}
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category">Battle Category*</Label>
            <Select onValueChange={(value) => setValue('category', value)} data-testid="select-battle-category">
              <SelectTrigger>
                <SelectValue placeholder="Select battle type" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.category && (
              <p className="text-red-400 text-sm">{errors.category.message}</p>
            )}
          </div>

          {/* Contestants */}
          <div className="space-y-4">
            <Label>Contestants</Label>
            
            {/* Contestant 1 (You) */}
            <div className="flex items-center space-x-3 p-3 bg-dark-300 rounded-lg">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-electric-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">
                  {user?.displayName?.charAt(0)}
                </span>
              </div>
              <div className="flex-1">
                <p className="font-medium text-white">{user?.displayName}</p>
                <p className="text-sm text-gray-400">You • {user?.role}</p>
              </div>
              <Badge className="bg-purple-500">Challenger</Badge>
            </div>

            {/* VS Divider */}
            <div className="flex items-center justify-center">
              <div className="bg-gradient-to-r from-gold-400 to-gold-600 text-black px-3 py-1 rounded-full font-bold text-sm">
                VS
              </div>
            </div>

            {/* Contestant 2 */}
            <div className="space-y-2">
              <Label htmlFor="opponent">Choose Your Opponent*</Label>
              <Select onValueChange={handleContestant2Change} data-testid="select-opponent">
                <SelectTrigger>
                  <SelectValue placeholder="Select opponent" />
                </SelectTrigger>
                <SelectContent>
                  {contestants?.filter(u => u.id !== user?.id).map((contestant) => (
                    <SelectItem key={contestant.id} value={contestant.id}>
                      <div className="flex items-center space-x-2">
                        <span>{contestant.displayName}</span>
                        <Badge variant="outline" className="ml-2">
                          {contestant.role}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.contestant2Id && (
                <p className="text-red-400 text-sm">{errors.contestant2Id.message}</p>
              )}
            </div>
          </div>

          {/* Battle Duration */}
          <div className="space-y-2">
            <Label htmlFor="endTime">Battle End Time</Label>
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              <Input
                id="endTime"
                data-testid="input-battle-end-time"
                {...register('endTime', { 
                  setValueAs: (value) => value ? new Date(value) : undefined 
                })}
                type="datetime-local"
                className="bg-dark-300 border-dark-400"
              />
            </div>
            <p className="text-xs text-gray-500">
              Leave empty to set battle duration to 24 hours
            </p>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              data-testid="button-cancel"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createBattle.isPending || !selectedContestant2}
              className="bg-gold-500 hover:bg-gold-600 text-black font-medium"
              data-testid="button-create-battle"
            >
              {createBattle.isPending ? 'Creating...' : 'Create Battle'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}