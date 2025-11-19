import { useState } from 'react';
import { useContacts } from '@/hooks/useContacts';
import { useLists } from '@/hooks/useLists';
import { Button } from '@/shared/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Badge } from '@/shared/ui/badge';
import { ChevronDown, X, Trash, Tags, FolderInput, Download } from 'lucide-react';
import type { Contact, BulkAction } from '@/types';

interface BulkActionsToolbarProps {
  selectedContacts: Contact[];
  onClearSelection: () => void;
  onActionComplete: () => void;
}

type ActionDialog =
  | 'delete'
  | 'addTags'
  | 'removeTags'
  | 'moveToList'
  | null;

export function BulkActionsToolbar({
  selectedContacts,
  onClearSelection,
  onActionComplete,
}: BulkActionsToolbarProps) {
  const [dialogOpen, setDialogOpen] = useState<ActionDialog>(null);
  const [tagInput, setTagInput] = useState('');
  const [selectedListId, setSelectedListId] = useState('');
  const { bulkAction, isBulkProcessing } = useContacts();
  const { lists } = useLists();

  const contactIds = selectedContacts.map((c) => c.id);

  const handleBulkAction = async (action: BulkAction) => {
    await bulkAction(action, {
      onSuccess: () => {
        setDialogOpen(null);
        setTagInput('');
        setSelectedListId('');
        onActionComplete();
      },
    });
  };

  const handleDelete = () => {
    handleBulkAction({
      selection: {
        type: 'ids',
        contact_ids: contactIds,
      },
      action: 'delete',
      params: {},
    });
  };

  const handleAddTags = () => {
    const tags = tagInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    if (tags.length === 0) return;

    handleBulkAction({
      selection: {
        type: 'ids',
        contact_ids: contactIds,
      },
      action: 'add_tags',
      params: { tags },
    });
  };

  const handleRemoveTags = () => {
    const tags = tagInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    if (tags.length === 0) return;

    handleBulkAction({
      selection: {
        type: 'ids',
        contact_ids: contactIds,
      },
      action: 'remove_tags',
      params: { tags },
    });
  };

  const handleMoveToList = () => {
    if (!selectedListId) return;

    handleBulkAction({
      selection: {
        type: 'ids',
        contact_ids: contactIds,
      },
      action: 'move_to_list',
      params: { list_id: selectedListId },
    });
  };

  const handleExport = () => {
    // TODO: Implement export functionality
    console.log('Exporting contacts:', contactIds);
  };

  return (
    <>
      <div className="sticky top-16 z-10 bg-primary-600 text-white rounded-lg p-4 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-4">
          <Badge variant="secondary" className="bg-white text-primary-600 text-sm">
            {selectedContacts.length} selected
          </Badge>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="secondary"
                size="sm"
                className="bg-white text-primary-600 hover:bg-gray-100"
              >
                Actions
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={() => setDialogOpen('addTags')}>
                <Tags className="mr-2 h-4 w-4" />
                Add Tags
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setDialogOpen('removeTags')}>
                <Tags className="mr-2 h-4 w-4" />
                Remove Tags
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setDialogOpen('moveToList')}>
                <FolderInput className="mr-2 h-4 w-4" />
                Move to List
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExport}>
                <Download className="mr-2 h-4 w-4" />
                Export Selected
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setDialogOpen('delete')}
                className="text-red-600"
              >
                <Trash className="mr-2 h-4 w-4" />
                Delete Selected
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={onClearSelection}
          className="text-white hover:bg-primary-700"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={dialogOpen === 'delete'} onOpenChange={() => setDialogOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Contacts</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedContacts.length} contact(s)? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isBulkProcessing}
            >
              {isBulkProcessing ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Tags Dialog */}
      <Dialog open={dialogOpen === 'addTags'} onOpenChange={() => setDialogOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Tags</DialogTitle>
            <DialogDescription>
              Add tags to {selectedContacts.length} contact(s). Separate multiple tags with
              commas.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="tags">Tags</Label>
              <Input
                id="tags"
                placeholder="VIP, Newsletter, Customer"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(null)}>
              Cancel
            </Button>
            <Button onClick={handleAddTags} disabled={isBulkProcessing || !tagInput}>
              {isBulkProcessing ? 'Adding...' : 'Add Tags'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove Tags Dialog */}
      <Dialog open={dialogOpen === 'removeTags'} onOpenChange={() => setDialogOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Tags</DialogTitle>
            <DialogDescription>
              Remove tags from {selectedContacts.length} contact(s). Separate multiple tags with
              commas.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="remove-tags">Tags</Label>
              <Input
                id="remove-tags"
                placeholder="Old, Inactive"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(null)}>
              Cancel
            </Button>
            <Button onClick={handleRemoveTags} disabled={isBulkProcessing || !tagInput}>
              {isBulkProcessing ? 'Removing...' : 'Remove Tags'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Move to List Dialog */}
      <Dialog open={dialogOpen === 'moveToList'} onOpenChange={() => setDialogOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Move to List</DialogTitle>
            <DialogDescription>
              Move {selectedContacts.length} contact(s) to another list.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="list">Select List</Label>
              <select
                id="list"
                className="w-full rounded-md border border-gray-300 px-3 py-2"
                value={selectedListId}
                onChange={(e) => setSelectedListId(e.target.value)}
              >
                <option value="">Select a list...</option>
                {lists.map((list) => (
                  <option key={list.id} value={list.id}>
                    {list.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(null)}>
              Cancel
            </Button>
            <Button onClick={handleMoveToList} disabled={isBulkProcessing || !selectedListId}>
              {isBulkProcessing ? 'Moving...' : 'Move'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
