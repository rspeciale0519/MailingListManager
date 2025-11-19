import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { segmentsApi } from '@/api';
import { useOrgStore } from '@/store/orgStore';
import { toast } from '@/shared/ui';
import type { CreateSegmentInput, UpdateSegmentInput } from '@/types';

export function useSegments() {
  const queryClient = useQueryClient();
  const { currentOrg } = useOrgStore();
  const orgId = currentOrg?.id;

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['segments', orgId],
    queryFn: () => segmentsApi.list(orgId!),
    enabled: !!orgId,
  });

  const createMutation = useMutation({
    mutationFn: (input: CreateSegmentInput) => segmentsApi.create(orgId!, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['segments', orgId] });
      toast({ title: 'Segment created' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error creating segment', description: error.message, variant: 'destructive' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateSegmentInput }) =>
      segmentsApi.update(orgId!, id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['segments', orgId] });
      toast({ title: 'Segment updated' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error updating segment', description: error.message, variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (segmentId: string) => segmentsApi.delete(orgId!, segmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['segments', orgId] });
      toast({ title: 'Segment deleted' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error deleting segment', description: error.message, variant: 'destructive' });
    },
  });

  const refreshMutation = useMutation({
    mutationFn: (segmentId: string) => segmentsApi.refresh(orgId!, segmentId),
    onSuccess: () => {
      toast({ title: 'Segment refresh started' });
    },
    onError: (error: Error) => {
      toast({ title: 'Refresh failed', description: error.message, variant: 'destructive' });
    },
  });

  return {
    segments: data || [],
    isLoading,
    error,
    refetch,
    createSegment: createMutation.mutate,
    isCreating: createMutation.isPending,
    updateSegment: updateMutation.mutate,
    isUpdating: updateMutation.isPending,
    deleteSegment: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending,
    refreshSegment: refreshMutation.mutate,
    isRefreshing: refreshMutation.isPending,
  };
}
