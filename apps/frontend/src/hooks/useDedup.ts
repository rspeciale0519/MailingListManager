import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { dedupApi } from '@/api';
import { useOrgStore } from '@/store/orgStore';
import { toast } from '@/shared/ui';
import type { CreateDedupRunInput, ApplyDedupInput } from '@/types';

export function useDedup() {
  const queryClient = useQueryClient();
  const { currentOrg } = useOrgStore();
  const orgId = currentOrg?.id;

  const createRunMutation = useMutation({
    mutationFn: (input: CreateDedupRunInput) => dedupApi.create(orgId!, input),
    onSuccess: () => {
      toast({ title: 'Deduplication started', description: 'Analyzing contacts for duplicates...' });
    },
    onError: (error: Error) => {
      toast({ title: 'Dedup failed', description: error.message, variant: 'destructive' });
    },
  });

  const applyMutation = useMutation({
    mutationFn: ({ runId, decisions }: { runId: string; decisions: ApplyDedupInput }) =>
      dedupApi.apply(orgId!, runId, decisions),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts', orgId] });
      toast({ title: 'Applying changes', description: 'Merging duplicates...' });
    },
    onError: (error: Error) => {
      toast({ title: 'Apply failed', description: error.message, variant: 'destructive' });
    },
  });

  const undoMergeMutation = useMutation({
    mutationFn: (mergeId: string) => dedupApi.undoMerge(orgId!, mergeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts', orgId] });
      toast({ title: 'Merge undone' });
    },
    onError: (error: Error) => {
      toast({ title: 'Undo failed', description: error.message, variant: 'destructive' });
    },
  });

  return {
    createRun: createRunMutation.mutate,
    isCreatingRun: createRunMutation.isPending,
    applyDecisions: applyMutation.mutate,
    isApplying: applyMutation.isPending,
    undoMerge: undoMergeMutation.mutate,
    isUndoing: undoMergeMutation.isPending,
  };
}

export function useDedupRun(runId?: string) {
  const { currentOrg } = useOrgStore();
  const orgId = currentOrg?.id;

  const { data, isLoading, error } = useQuery({
    queryKey: ['dedup', orgId, runId],
    queryFn: () => dedupApi.get(orgId!, runId!),
    enabled: !!orgId && !!runId,
    refetchInterval: (query) => {
      return query.state.data?.status === 'processing' ? 2000 : false;
    },
  });

  return { run: data, isLoading, error };
}

export function useDedupClusters(runId?: string, params?: { page?: number; limit?: number }) {
  const { currentOrg } = useOrgStore();
  const orgId = currentOrg?.id;

  const { data, isLoading, error } = useQuery({
    queryKey: ['dedup', orgId, runId, 'clusters', params],
    queryFn: () => dedupApi.getClusters(orgId!, runId!, params),
    enabled: !!orgId && !!runId,
  });

  return { clusters: data?.data || [], meta: data?.meta, isLoading, error };
}
