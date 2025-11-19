import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { exportsApi } from '@/api';
import { useOrgStore } from '@/store/orgStore';
import { toast } from '@/shared/ui';
import type { CreateExportInput } from '@/types';

/**
 * Hook for exports operations
 */
export function useExports(params?: { page?: number; limit?: number }) {
  const queryClient = useQueryClient();
  const { currentOrg } = useOrgStore();
  const orgId = currentOrg?.id;

  // List all exports
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['exports', orgId, params],
    queryFn: () => exportsApi.list(orgId!, params),
    enabled: !!orgId,
  });

  // Create export mutation
  const createMutation = useMutation({
    mutationFn: (input: CreateExportInput) => exportsApi.create(orgId!, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exports', orgId] });
      toast({
        title: 'Export started',
        description: 'Your export is being generated.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Export failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    exports: data?.data || [],
    meta: data?.meta,
    isLoading,
    error,
    refetch,
    createExport: createMutation.mutate,
    createExportAsync: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
  };
}

/**
 * Hook to get a single export by ID
 */
export function useExport(exportId?: string) {
  const { currentOrg } = useOrgStore();
  const orgId = currentOrg?.id;

  const { data, isLoading, error } = useQuery({
    queryKey: ['exports', orgId, exportId],
    queryFn: () => exportsApi.get(orgId!, exportId!),
    enabled: !!orgId && !!exportId,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      // Poll while processing
      return status === 'processing' ? 2000 : false;
    },
  });

  return {
    export: data,
    isLoading,
    error,
  };
}
