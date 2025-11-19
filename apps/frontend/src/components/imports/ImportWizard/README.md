# ImportWizard Components

Multi-step wizard for CSV/XLSX imports with real-time progress tracking.

## Components

### ImportWizard

Main wizard shell that manages step flow and state.

**Features:**
- Multi-step stepper UI (4 steps)
- Step indicators with completion status
- State management across steps
- Progress saving capability
- WebSocket integration for real-time updates

**Steps:**
1. Upload - File picker and validation
2. Mapping - Column mapping with suggestions
3. Validation - Error checking and preview
4. Progress - Real-time import tracking

**Usage:**
```tsx
import { ImportWizard } from '@/components/imports/ImportWizard';

function MyPage() {
  const [showWizard, setShowWizard] = useState(false);

  return (
    <>
      <button onClick={() => setShowWizard(true)}>
        Import Contacts
      </button>

      <ImportWizard
        listId="list-123"
        isOpen={showWizard}
        onClose={() => setShowWizard(false)}
        onComplete={() => {
          console.log('Import complete');
          setShowWizard(false);
        }}
      />
    </>
  );
}
```

**Props:**
- `listId: string` - Target list ID for import
- `isOpen: boolean` - Controls wizard visibility
- `onClose: () => void` - Called when wizard is closed
- `onComplete?: () => void` - Called when import completes

### FileUploadStep

Drag-and-drop file upload with validation.

**Features:**
- Drag-and-drop zone
- File picker button
- File validation (type, size)
- Upload progress bar
- File preview (size, type, rows)
- Error handling

**Supported Formats:**
- CSV (.csv)
- Excel (.xlsx, .xls)
- Max file size: 50MB

**Validation:**
- File type checking
- File size limits
- Preview first 5 rows

**Usage:**
```tsx
<FileUploadStep
  listId="list-123"
  onFileUploaded={(file, importId, preview) => {
    console.log('File uploaded:', file.name);
    console.log('Import ID:', importId);
  }}
/>
```

### ColumnMappingStep

Interactive column mapping with auto-suggestions.

**Features:**
- Two-column mapping interface
- Auto-suggested mappings with confidence scores
- Drag-and-drop column mapping
- Preview table (first 50 rows)
- Confidence indicators (Exact, Likely, Low)
- Create custom field option
- Skip unmapped columns

**Confidence Scores:**
- **Green (>0.9)**: Exact match
- **Yellow (0.7-0.9)**: Likely match
- **Red (<0.7)**: Low confidence
- **Gray**: Unmapped

**Target Fields:**
- email, phone
- first_name, last_name, full_name
- company, title
- address_line1, city, state, postal_code, country

**Usage:**
```tsx
<ColumnMappingStep
  preview={previewData}
  importId="import-123"
  onMappingConfirmed={(mapping) => {
    console.log('Mapping confirmed:', mapping);
  }}
  onBack={() => console.log('Go back')}
/>
```

### ValidationStep

Data validation with error reporting.

**Features:**
- Summary stats (total, valid, invalid, warnings)
- Error grouping by type
- Row-level error display
- Expandable error details
- Skip invalid rows option
- Quick fix buttons (for supported errors)
- Import summary preview

**Error Types:**
- Invalid email format
- Invalid phone format
- Missing required fields
- Duplicate detection
- Format inconsistencies

**Usage:**
```tsx
<ValidationStep
  importId="import-123"
  onStartImport={(validationResults) => {
    console.log('Starting import with:', validationResults);
  }}
  onBack={() => console.log('Go back')}
/>
```

### ProgressStep

Real-time import progress tracking.

**Features:**
- Real-time progress bar
- WebSocket updates (useImportProgress hook)
- ETA display
- Current operation status
- Processed/Total counters
- Success/Error counts
- Cancel button with confirmation
- Completion summary

**Status States:**
- **Processing**: Active import
- **Complete**: Import finished successfully
- **Failed**: Import encountered an error
- **Canceled**: User canceled import

**Usage:**
```tsx
<ProgressStep
  importId="import-123"
  onComplete={() => {
    console.log('Import complete');
  }}
/>
```

## State Flow

```
1. Upload
   ↓ (file uploaded → importId created)
2. Mapping
   ↓ (mapping confirmed → validation starts)
3. Validation
   ↓ (validation passed → import starts)
4. Progress
   ↓ (import complete)
   Done
```

## WebSocket Integration

The wizard uses WebSocket for real-time updates during import:

```typescript
// Hook usage
const progress = useImportProgress(importId);

// Progress object structure
{
  processed: number;
  total: number;
  status: 'processing' | 'complete' | 'failed';
}
```

**Events:**
- `import:{importId}:progress` - Progress updates
- `import:{importId}:complete` - Import completion
- `import:{importId}:error` - Import errors

## API Integration

The wizard integrates with the following API endpoints:

```typescript
// Upload file
POST /orgs/{orgId}/imports
FormData: { file, list_id, options }

// Get preview for mapping
GET /orgs/{orgId}/imports/{importId}/preview
Returns: { headers, rows, suggested_mapping }

// Confirm mapping
POST /orgs/{orgId}/imports/{importId}/mapping
Body: { mappings: ColumnMapping[] }

// Get import status
GET /orgs/{orgId}/imports/{importId}
Returns: Import (status, progress, counts)

// Cancel import
POST /orgs/{orgId}/imports/{importId}/cancel
Body: { mode: 'reverse' | 'keep' }
```

## Error Handling

Comprehensive error handling at each step:

1. **Upload Step**
   - File too large
   - Invalid file type
   - Network errors

2. **Mapping Step**
   - API failures
   - Invalid mapping configurations

3. **Validation Step**
   - Data validation errors
   - Row-level issues

4. **Progress Step**
   - WebSocket disconnection
   - Import failures
   - Partial completion handling

## Customization

### Styling
All components use Tailwind CSS with shadcn/ui primitives for consistency.

### Field Mapping
Extend `TARGET_FIELDS` in ColumnMappingStep to add custom fields:

```typescript
const TARGET_FIELDS = [
  // ... existing fields
  { value: 'custom_field_1', label: 'Custom Field 1', required: false },
];
```

### Validation Rules
Validation rules are defined server-side but can be previewed:

```typescript
// Custom validation in ValidationStep
const customValidation = (row: Record<string, unknown>) => {
  // Add custom validation logic
};
```

## Performance

- **File Parsing**: Handled server-side for large files
- **Preview Limits**: Only first 50 rows shown for mapping
- **WebSocket**: Efficient real-time updates without polling
- **Chunked Processing**: Server processes imports in batches

## Accessibility

- Keyboard navigation through all steps
- ARIA labels on all interactive elements
- Focus management between steps
- Screen reader announcements for progress
- Proper heading hierarchy

## Mobile Support

- Responsive layouts for all steps
- Touch-friendly drag-and-drop (fallback to select)
- Full-screen dialogs on small screens
- Optimized for mobile networks

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- WebSocket support required

## Dependencies

- @tanstack/react-query ^5.14.2
- socket.io-client ^4.6.0
- react-hook-form ^7.49.2
- lucide-react ^0.295.0
