import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { contactsApi } from '@/api';
import { useOrgStore } from '@/store/orgStore';
import { toast } from '@/shared/ui';
import type {
  ContactFilters,
  CreateContactInput,
  UpdateContactInput,
  BulkAction,
} from '@/types';

/**
 * Hook for contacts operations
 */
export function useContacts(filters?: ContactFilters) {
  const queryClient = useQueryClient();
  const { currentOrg } = useOrgStore();
  const orgId = currentOrg?.id;

  // List contacts with filters
  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['contacts', orgId, filters],
    queryFn: () => contactsApi.list(orgId!, filters || {}),
    enabled: !!orgId,
  });

  // Create contact mutation
  const createMutation = useMutation({
    mutationFn: (input: CreateContactInput) => contactsApi.create(orgId!, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts', orgId] });
      toast({
        title: 'Contact created',
        description: 'The contact has been successfully created.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error creating contact',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Update contact mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateContactInput }) =>
      contactsApi.update(orgId!, id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts', orgId] });
      toast({
        title: 'Contact updated',
        description: 'The contact has been successfully updated.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error updating contact',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Delete contact mutation
  const deleteMutation = useMutation({
    mutationFn: (contactId: string) => contactsApi.delete(orgId!, contactId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts', orgId] });
      toast({
        title: 'Contact deleted',
        description: 'The contact has been successfully deleted.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error deleting contact',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Bulk action mutation
  const bulkMutation = useMutation({
    mutationFn: (action: BulkAction) => contactsApi.bulk(orgId!, action),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts', orgId] });
      toast({
        title: 'Bulk action started',
        description: 'The bulk action is being processed.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Bulk action failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    contacts: data?.data || [],
    meta: data?.meta,
    isLoading,
    error,
    refetch,
    createContact: createMutation.mutate,
    createContactAsync: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    updateContact: updateMutation.mutate,
    updateContactAsync: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    deleteContact: deleteMutation.mutate,
    deleteContactAsync: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
    bulkAction: bulkMutation.mutate,
    bulkActionAsync: bulkMutation.mutateAsync,
    isBulkProcessing: bulkMutation.isPending,
  };
}

/**
 * Hook to get a single contact by ID
 */
export function useContact(contactId?: string) {
  const { currentOrg } = useOrgStore();
  const orgId = currentOrg?.id;

  const { data, isLoading, error } = useQuery({
    queryKey: ['contacts', orgId, contactId],
    queryFn: () => contactsApi.get(orgId!, contactId!),
    enabled: !!orgId && !!contactId,
  });

  return {
    contact: data,
    isLoading,
    error,
  };
}
