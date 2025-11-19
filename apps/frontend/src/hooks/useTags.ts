import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { tagsApi } from '@/api';
import { useOrgStore } from '@/store/orgStore';
import { toast } from '@/shared/ui';
import type { CreateTagInput, UpdateTagInput } from '@/types';

/**
 * Hook for tags operations
 */
export function useTags() {
  const queryClient = useQueryClient();
  const { currentOrg } = useOrgStore();
  const orgId = currentOrg?.id;

  // List all tags
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['tags', orgId],
    queryFn: () => tagsApi.list(orgId!),
    enabled: !!orgId,
  });

  // Create tag mutation
  const createMutation = useMutation({
    mutationFn: (input: CreateTagInput) => tagsApi.create(orgId!, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags', orgId] });
      toast({
        title: 'Tag created',
        description: 'The tag has been successfully created.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error creating tag',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Update tag mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTagInput }) =>
      tagsApi.update(orgId!, id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags', orgId] });
      toast({
        title: 'Tag updated',
        description: 'The tag has been successfully updated.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error updating tag',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Delete tag mutation
  const deleteMutation = useMutation({
    mutationFn: (tagId: string) => tagsApi.delete(orgId!, tagId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags', orgId] });
      toast({
        title: 'Tag deleted',
        description: 'The tag has been successfully deleted.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error deleting tag',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    tags: data || [],
    isLoading,
    error,
    refetch,
    createTag: createMutation.mutate,
    createTagAsync: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    updateTag: updateMutation.mutate,
    updateTagAsync: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    deleteTag: deleteMutation.mutate,
    deleteTagAsync: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
  };
}
