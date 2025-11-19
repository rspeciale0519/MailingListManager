import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { importsApi } from '@/api';
import { useOrgStore } from '@/store/orgStore';
import { toast } from '@/shared/ui';
import type { ImportOptions, ConfirmMappingInput } from '@/types';

/**
 * Hook for imports operations
 */
export function useImports(params?: { page?: number; limit?: number }) {
  const queryClient = useQueryClient();
  const { currentOrg } = useOrgStore();
  const orgId = currentOrg?.id;

  // List all imports
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['imports', orgId, params],
    queryFn: () => importsApi.list(orgId!, params),
    enabled: !!orgId,
  });

  // Create import mutation
  const createMutation = useMutation({
    mutationFn: ({
      listId,
      file,
      options,
      onProgress,
    }: {
      listId: string;
      file: File;
      options?: ImportOptions;
      onProgress?: (progress: number) => void;
    }) => importsApi.create(orgId!, listId, file, options, onProgress),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['imports', orgId] });
      toast({
        title: 'Import started',
        description: 'Your file is being processed.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Import failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Confirm mapping mutation
  const confirmMappingMutation = useMutation({
    mutationFn: ({ importId, mapping }: { importId: string; mapping: ConfirmMappingInput }) =>
      importsApi.confirmMapping(orgId!, importId, mapping),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['imports', orgId] });
      toast({
        title: 'Import processing',
        description: 'Column mapping confirmed. Processing contacts...',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Mapping confirmation failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Cancel import mutation
  const cancelMutation = useMutation({
    mutationFn: ({ importId, mode }: { importId: string; mode: 'reverse' | 'keep' }) =>
      importsApi.cancel(orgId!, importId, mode),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['imports', orgId] });
      toast({
        title: 'Import cancelled',
        description: 'The import has been cancelled.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Cancel failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    imports: data?.data || [],
    meta: data?.meta,
    isLoading,
    error,
    refetch,
    createImport: createMutation.mutate,
    createImportAsync: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    confirmMapping: confirmMappingMutation.mutate,
    confirmMappingAsync: confirmMappingMutation.mutateAsync,
    isConfirming: confirmMappingMutation.isPending,
    cancelImport: cancelMutation.mutate,
    cancelImportAsync: cancelMutation.mutateAsync,
    isCancelling: cancelMutation.isPending,
  };
}

/**
 * Hook to get a single import by ID
 */
export function useImport(importId?: string) {
  const { currentOrg } = useOrgStore();
  const orgId = currentOrg?.id;

  const { data, isLoading, error } = useQuery({
    queryKey: ['imports', orgId, importId],
    queryFn: () => importsApi.get(orgId!, importId!),
    enabled: !!orgId && !!importId,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      // Poll while processing
      return status === 'processing' || status === 'mapping' ? 2000 : false;
    },
  });

  return {
    import: data,
    isLoading,
    error,
  };
}

/**
 * Hook to get import preview for mapping
 */
export function useImportPreview(importId?: string) {
  const { currentOrg } = useOrgStore();
  const orgId = currentOrg?.id;

  const { data, isLoading, error } = useQuery({
    queryKey: ['imports', orgId, importId, 'preview'],
    queryFn: () => importsApi.getPreview(orgId!, importId!),
    enabled: !!orgId && !!importId,
  });

  return {
    preview: data,
    isLoading,
    error,
  };
}
