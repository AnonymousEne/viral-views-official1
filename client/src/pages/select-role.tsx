import { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { apiRequest } from '@/lib/queryClient';

const ROLES = [
  { value: 'artist', label: 'Artist' },
  { value: 'producer', label: 'Producer' },
  { value: 'beatmaker', label: 'Beatmaker' },
  { value: 'industryRep', label: 'Industry Rep' },
  { value: 'fan', label: 'Fan' },
];

export default function SelectRole() {
  const { user, refetch } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedRole, setSelectedRole] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole) return setError('Please select a role.');
    setLoading(true);
    try {
      await apiRequest('PATCH', '/api/users/profile', { role: selectedRole });
      await refetch();
      setLocation('/');
    } catch (err) {
      setError('Failed to set role. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!user || user.role) {
    setLocation('/');
    return null;
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center text-white">
            Select Your Role
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-3">
              {ROLES.map((role) => (
                <label key={role.value} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="role"
                    value={role.value}
                    checked={selectedRole === role.value}
                    onChange={() => setSelectedRole(role.value)}
                    className="form-radio text-purple-500"
                  />
                  <span className="text-white font-medium">{role.label}</span>
                </label>
              ))}
            </div>
            {error && <div className="text-red-500 text-sm">{error}</div>}
            <Button type="submit" className="w-full bg-purple-500 hover:bg-purple-600 text-white font-bold" disabled={loading}>
              {loading ? 'Saving...' : 'Continue'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
