# ContactsTable Components

Production-grade contact management components built with TanStack Table v8 and React.

## Components

### ContactsTable

Main data grid component for displaying and managing contacts.

**Features:**
- TanStack Table v8 integration
- Multi-column sorting
- Row selection with shift+click support
- Server-side pagination
- Column filtering
- Responsive design
- Loading and empty states
- Keyboard navigation
- ARIA labels for accessibility

**Usage:**
```tsx
import { ContactsTable } from '@/components/contacts/ContactsTable';

function MyPage() {
  return (
    <ContactsTable
      listId="list-123"
      onContactClick={(contact) => console.log('View', contact)}
      onContactEdit={(contact) => console.log('Edit', contact)}
      onContactDelete={(contact) => console.log('Delete', contact)}
    />
  );
}
```

**Props:**
- `listId?: string` - Filter contacts by list
- `onContactClick?: (contact: Contact) => void` - Called when row is clicked
- `onContactEdit?: (contact: Contact) => void` - Called from actions menu
- `onContactDelete?: (contact: Contact) => void` - Called from actions menu

### ContactsTableFilters

Advanced filtering UI with multiple filter types.

**Features:**
- Debounced search (300ms)
- State dropdown filter
- Tag multi-select
- Status filter
- Active filter chips
- Clear all filters button
- Mobile responsive

**Filters:**
- Text search (email, name, company, etc.)
- US States (50 states)
- Status (active, inactive, bounced, unsubscribed)
- Tags (multi-select)

### BulkActionsToolbar

Sticky toolbar for bulk operations on selected contacts.

**Features:**
- Appears when contacts are selected
- Shows selection count
- Bulk actions dropdown
- Confirmation dialogs
- Progress indicators
- Responsive design

**Actions:**
- Delete selected
- Add tags
- Remove tags
- Move to list
- Export selected

**Usage:**
```tsx
<BulkActionsToolbar
  selectedContacts={selectedContacts}
  onClearSelection={() => setSelection({})}
  onActionComplete={() => refetch()}
/>
```

### TagPillEditor

Inline tag editor with autocomplete and tag creation.

**Features:**
- Display tags as colored pills
- Click to remove tags
- Autocomplete dropdown
- Create new tags inline
- Keyboard shortcuts (Backspace to remove)
- Click outside to close

**Usage:**
```tsx
<TagPillEditor contact={contact} />
```

### ContactDetailPanel

Side panel for viewing contact details.

**Features:**
- Slides from right
- Tabbed interface (Details, History, Notes)
- Edit mode toggle
- Delete confirmation
- Mobile full-screen
- Loading states

**Sections:**
- Contact information (email, phone, name)
- Company details
- Address with validation
- Tags with inline editor
- Custom fields (dynamic)
- Metadata (created, updated)
- Action buttons (Edit, Delete)

**Usage:**
```tsx
const [selectedContact, setSelectedContact] = useState<Contact | null>(null);

<ContactDetailPanel
  contactId={selectedContact?.id}
  isOpen={!!selectedContact}
  onClose={() => setSelectedContact(null)}
  onDeleted={() => {
    setSelectedContact(null);
    refetch();
  }}
/>
```

### ContactForm

Form for creating and editing contacts with validation.

**Features:**
- React Hook Form integration
- Zod schema validation
- Real-time validation
- Auto-formatting (phone, email)
- All contact fields
- Create/Edit modes
- Loading states

**Validation:**
- Email format validation
- Phone number regex
- Max length constraints
- Required field handling

**Usage:**
```tsx
// Create mode
<ContactForm
  listId="list-123"
  onSuccess={() => console.log('Created')}
  onCancel={() => console.log('Cancelled')}
/>

// Edit mode
<ContactForm
  contact={existingContact}
  onSuccess={() => console.log('Updated')}
  onCancel={() => console.log('Cancelled')}
/>
```

## Integration Example

Complete example integrating all components:

```tsx
import { useState } from 'react';
import {
  ContactsTable,
  ContactDetailPanel,
  ContactForm,
} from '@/components/contacts/ContactsTable';
import { Dialog, DialogContent } from '@/shared/ui/dialog';
import type { Contact } from '@/types';

export function ContactsPage() {
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  return (
    <div>
      <ContactsTable
        listId="my-list-id"
        onContactClick={(contact) => setSelectedContact(contact)}
      />

      {selectedContact && (
        <ContactDetailPanel
          contactId={selectedContact.id}
          isOpen={!!selectedContact}
          onClose={() => setSelectedContact(null)}
        />
      )}

      <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
        <DialogContent>
          <ContactForm
            listId="my-list-id"
            onSuccess={() => setShowCreateForm(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
```

## Performance Considerations

1. **Debouncing**: Search input is debounced to 300ms to reduce API calls
2. **Memoization**: Column definitions are memoized to prevent re-renders
3. **Server-side pagination**: Only loads visible page data
4. **Optimistic updates**: UI updates immediately, syncs with server

## Accessibility

- All interactive elements are keyboard accessible (Tab, Enter, Escape)
- Proper ARIA labels on buttons and inputs
- Focus management in modals
- Screen reader announcements for state changes
- Semantic HTML structure

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Android)

## Dependencies

- @tanstack/react-table ^8.11.2
- @tanstack/react-query ^5.14.2
- react-hook-form ^7.49.2
- zod ^3.22.4
- lucide-react ^0.295.0
