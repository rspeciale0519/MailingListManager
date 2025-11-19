import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { listsApi } from '@/api';
import { useOrgStore } from '@/store/orgStore';
import { toast } from '@/shared/ui';
import type { CreateListInput, UpdateListInput } from '@/types';

/**
 * Hook for lists operations
 */
export function useLists(params?: { page?: number; limit?: number; sort?: string }) {
  const queryClient = useQueryClient();
  const { currentOrg } = useOrgStore();
  const orgId = currentOrg?.id;

  // List all lists
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['lists', orgId, params],
    queryFn: () => listsApi.list(orgId!, params),
    enabled: !!orgId,
  });

  // Create list mutation
  const createMutation = useMutation({
    mutationFn: (input: CreateListInput) => listsApi.create(orgId!, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lists', orgId] });
      toast({
        title: 'List created',
        description: 'The list has been successfully created.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error creating list',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Update list mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateListInput }) =>
      listsApi.update(orgId!, id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lists', orgId] });
      toast({
        title: 'List updated',
        description: 'The list has been successfully updated.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error updating list',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Delete list mutation
  const deleteMutation = useMutation({
    mutationFn: (listId: string) => listsApi.delete(orgId!, listId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lists', orgId] });
      toast({
        title: 'List deleted',
        description: 'The list has been successfully deleted.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error deleting list',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    lists: data?.data || [],
    meta: data?.meta,
    isLoading,
    error,
    refetch,
    createList: createMutation.mutate,
    createListAsync: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    updateList: updateMutation.mutate,
    updateListAsync: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    deleteList: deleteMutation.mutate,
    deleteListAsync: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
  };
}

/**
 * Hook to get a single list by ID
 */
export function useList(listId?: string) {
  const { currentOrg } = useOrgStore();
  const orgId = currentOrg?.id;

  const { data, isLoading, error } = useQuery({
    queryKey: ['lists', orgId, listId],
    queryFn: () => listsApi.get(orgId!, listId!),
    enabled: !!orgId && !!listId,
  });

  return {
    list: data,
    isLoading,
    error,
  };
}
