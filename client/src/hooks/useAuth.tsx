import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import type { User } from '@shared/schema';

export function useAuth() {
  const queryClient = useQueryClient();

  const { data: user, isLoading, error } = useQuery({
    queryKey: ['/api/auth/user'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/auth/user');
        const userData = await response.json() as User;
        return userData;
      } catch (error: any) {
        // If user is not authenticated, return null instead of throwing
        if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
          return null;
        }
        throw error;
      }
    },
    retry: (failureCount, error: any) => {
      // Retry up to 2 times for network errors, but not for auth errors
      if (error?.message?.includes('401') || error?.message?.includes('Unauthorized')) {
        return false;
      }
      return failureCount < 2;
    },
    staleTime: 1000 * 30, // Cache for 30 seconds to prevent excessive requests
    gcTime: 1000 * 60 * 5, // Keep in cache for 5 minutes
    refetchOnWindowFocus: true, // Refetch when user returns to tab
  });

  const logout = async () => {
    try {
      // Redirect to Replit logout endpoint
      window.location.href = '/api/logout';
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const isAuthenticated = !!user && user !== null;

  return {
    user,
    isLoading,
    isAuthenticated,
    logout,
    refetch: () => queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] }),
  };
}