import { useState } from 'react';
import { Plus, Upload } from 'lucide-react';
import { Button } from '@/shared/ui';
import { Breadcrumbs } from '@/shared/layout/Breadcrumbs';
import { ContactsTable, ContactDetailPanel, ContactForm } from '@/components/contacts/ContactsTable';
import { ImportWizard } from '@/components/imports/ImportWizard';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';
import type { Contact } from '@/types';

export function ContactsPage() {
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showImportWizard, setShowImportWizard] = useState(false);

  return (
    <div className="flex-1 space-y-4 p-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Breadcrumbs items={[{ label: 'Contacts' }]} />
          <h1 className="text-2xl font-semibold text-gray-900">Contacts</h1>
          <p className="text-sm text-gray-600">
            Manage your contact database
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowImportWizard(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Button onClick={() => setShowCreateForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Contact
          </Button>
        </div>
      </div>

      {/* Contacts Table */}
      <ContactsTable
        onContactClick={(contact) => setSelectedContact(contact)}
        onContactEdit={(contact) => setSelectedContact(contact)}
        onContactDelete={() => {
          // Delete handled by table
        }}
      />

      {/* Contact Detail Panel */}
      {selectedContact && (
        <ContactDetailPanel
          contactId={selectedContact.id}
          isOpen={!!selectedContact}
          onClose={() => setSelectedContact(null)}
          onDeleted={() => setSelectedContact(null)}
        />
      )}

      {/* Create Contact Dialog */}
      <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Contact</DialogTitle>
          </DialogHeader>
          <ContactForm
            onSuccess={() => setShowCreateForm(false)}
            onCancel={() => setShowCreateForm(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Import Wizard */}
      <ImportWizard
        listId="" // TODO: Get from selected list or default list
        isOpen={showImportWizard}
        onClose={() => setShowImportWizard(false)}
        onComplete={() => {
          // Refresh contacts table
          setShowImportWizard(false);
        }}
      />
    </div>
  );
}
