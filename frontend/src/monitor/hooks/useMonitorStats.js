import { useQuery } from '@tanstack/react-query';
import { fetchStats } from '../services/api';

export function useMonitorStats() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['monitorStats'],
    queryFn: fetchStats,
    refetchInterval: 5000,
    retry: 2,
    staleTime: 3000,
  });

  return { data, isLoading, isError, error };
}
