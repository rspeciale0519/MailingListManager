# Frontend Component Structure
## Mailing List Manager SaaS Platform

**Version:** 1.0  
**Last Updated:** November 11, 2025  
**Framework:** React 18+ with TypeScript

---

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Project Structure](#project-structure)
3. [Component Organization](#component-organization)
4. [State Management](#state-management)
5. [Routing](#routing)
6. [Key Components](#key-components)
7. [Shared Components](#shared-components)
8. [Hooks](#hooks)
9. [Utilities](#utilities)
10. [Styling](#styling)

---

## Architecture Overview

### Design Principles

1. **Component Modularity**: No component file exceeds 450 lines
2. **Separation of Concerns**: Presentational vs Container components
3. **Reusability**: DRY principle with shared components
4. **Type Safety**: Full TypeScript coverage
5. **Performance**: Memoization, lazy loading, code splitting
6. **Accessibility**: WCAG 2.1 AA compliance
7. **Responsive**: Mobile-first design

### Technology Stack

- **Framework**: React 18+ (with Concurrent Features)
- **Language**: TypeScript 5+
- **Build Tool**: Vite
- **State Management**: Zustand (global) + React Query (server state)
- **Routing**: React Router v6
- **UI Components**: shadcn/ui + Radix UI
- **Styling**: TailwindCSS 3+
- **Data Grid**: TanStack Table (React Table v8)
- **Forms**: React Hook Form + Zod validation
- **HTTP Client**: Axios
- **WebSocket**: Socket.io-client
- **Testing**: Vitest + React Testing Library + Playwright

---

## Project Structure

```
frontend/
├── public/
│   ├── favicon.ico
│   └── assets/
├── src/
│   ├── api/                        # API client layer
│   │   ├── client.ts               # Axios instance
│   │   ├── auth.api.ts
│   │   ├── orgs.api.ts
│   │   ├── contacts.api.ts
│   │   ├── imports.api.ts
│   │   ├── exports.api.ts
│   │   ├── dedup.api.ts
│   │   └── index.ts
│   │
│   ├── components/                 # Reusable components
│   │   ├── auth/
│   │   │   ├── LoginForm.tsx       (<300 LOC)
│   │   │   ├── RegisterForm.tsx
│   │   │   ├── MFASetup.tsx
│   │   │   └── PasswordReset.tsx
│   │   │
│   │   ├── contacts/
│   │   │   ├── ContactsTable/
│   │   │   │   ├── ContactsTable.tsx        (<400 LOC)
│   │   │   │   ├── ContactsTableRow.tsx     (<200 LOC)
│   │   │   │   ├── ContactsTableHeader.tsx  (<150 LOC)
│   │   │   │   ├── ContactsTableFilters.tsx (<300 LOC)
│   │   │   │   ├── BulkActionsToolbar.tsx   (<250 LOC)
│   │   │   │   └── ColumnManager.tsx        (<200 LOC)
│   │   │   ├── ContactDetailPanel.tsx       (<350 LOC)
│   │   │   ├── ContactForm.tsx              (<300 LOC)
│   │   │   ├── InlineContactEditor.tsx      (<250 LOC)
│   │   │   └── TagPillEditor.tsx            (<150 LOC)
│   │   │
│   │   ├── imports/
│   │   │   ├── ImportWizard/
│   │   │   │   ├── ImportWizard.tsx         (<300 LOC)
│   │   │   │   ├── FileUploadStep.tsx       (<200 LOC)
│   │   │   │   ├── ColumnMappingStep.tsx    (<400 LOC)
│   │   │   │   ├── ValidationStep.tsx       (<250 LOC)
│   │   │   │   └── ProgressStep.tsx         (<200 LOC)
│   │   │   ├── ColumnMapper.tsx             (<350 LOC)
│   │   │   ├── MappingPreview.tsx           (<250 LOC)
│   │   │   └── ImportProgress.tsx           (<200 LOC)
│   │   │
│   │   ├── exports/
│   │   │   ├── ExportDialog.tsx             (<300 LOC)
│   │   │   ├── ColumnSelector.tsx           (<200 LOC)
│   │   │   └── ExportProgress.tsx           (<150 LOC)
│   │   │
│   │   ├── dedup/
│   │   │   ├── DedupWizard/
│   │   │   │   ├── DedupWizard.tsx          (<250 LOC)
│   │   │   │   ├── CriteriaStep.tsx         (<300 LOC)
│   │   │   │   ├── ReviewClustersStep.tsx   (<400 LOC)
│   │   │   │   └── ApplyStep.tsx            (<200 LOC)
│   │   │   ├── ClusterCard.tsx              (<300 LOC)
│   │   │   ├── SurvivorSelector.tsx         (<250 LOC)
│   │   │   └── MergePreview.tsx             (<200 LOC)
│   │   │
│   │   ├── segments/
│   │   │   ├── SegmentBuilder.tsx           (<350 LOC)
│   │   │   ├── FilterBuilder.tsx            (<400 LOC)
│   │   │   ├── SegmentList.tsx              (<200 LOC)
│   │   │   └── SegmentCard.tsx              (<150 LOC)
│   │   │
│   │   ├── tags/
│   │   │   ├── TagManager.tsx               (<250 LOC)
│   │   │   ├── TagPill.tsx                  (<100 LOC)
│   │   │   └── TagColorPicker.tsx           (<150 LOC)
│   │   │
│   │   ├── validation/
│   │   │   ├── ValidationPanel.tsx          (<300 LOC)
│   │   │   └── ValidationProgress.tsx       (<200 LOC)
│   │   │
│   │   ├── skiptrace/
│   │   │   ├── SkipTracePanel.tsx           (<300 LOC)
│   │   │   └── SkipTraceProgress.tsx        (<200 LOC)
│   │   │
│   │   ├── lists/
│   │   │   ├── ListSelector.tsx             (<200 LOC)
│   │   │   ├── ListCard.tsx                 (<150 LOC)
│   │   │   └── ListForm.tsx                 (<200 LOC)
│   │   │
│   │   ├── settings/
│   │   │   ├── OrgSettings.tsx              (<350 LOC)
│   │   │   ├── TeamMembers.tsx              (<300 LOC)
│   │   │   ├── PermissionsMatrix.tsx        (<400 LOC)
│   │   │   ├── BillingSettings.tsx          (<300 LOC)
│   │   │   └── UserProfile.tsx              (<250 LOC)
│   │   │
│   │   └── audit/
│   │       ├── AuditLog.tsx                 (<350 LOC)
│   │       ├── AuditEventDetail.tsx         (<200 LOC)
│   │       └── AuditFilters.tsx             (<200 LOC)
│   │
│   ├── shared/                     # Shared/common components
│   │   ├── ui/                     # shadcn/ui components
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── dropdown-menu.tsx
│   │   │   ├── table.tsx
│   │   │   ├── toast.tsx
│   │   │   └── ...
│   │   │
│   │   ├── layout/
│   │   │   ├── AppLayout.tsx                (<250 LOC)
│   │   │   ├── Sidebar.tsx                  (<300 LOC)
│   │   │   ├── Header.tsx                   (<200 LOC)
│   │   │   ├── Footer.tsx                   (<100 LOC)
│   │   │   └── Breadcrumbs.tsx              (<150 LOC)
│   │   │
│   │   ├── feedback/
│   │   │   ├── LoadingSpinner.tsx           (<100 LOC)
│   │   │   ├── ErrorBoundary.tsx            (<200 LOC)
│   │   │   ├── EmptyState.tsx               (<150 LOC)
│   │   │   ├── ProgressBar.tsx              (<100 LOC)
│   │   │   └── Toast.tsx                    (<150 LOC)
│   │   │
│   │   ├── forms/
│   │   │   ├── FormField.tsx                (<100 LOC)
│   │   │   ├── FormLabel.tsx                (<50 LOC)
│   │   │   ├── FormError.tsx                (<50 LOC)
│   │   │   ├── SearchInput.tsx              (<100 LOC)
│   │   │   └── Select.tsx                   (<150 LOC)
│   │   │
│   │   ├── data-display/
│   │   │   ├── DataTable.tsx                (<400 LOC)
│   │   │   ├── Pagination.tsx               (<150 LOC)
│   │   │   ├── Badge.tsx                    (<100 LOC)
│   │   │   ├── Card.tsx                     (<100 LOC)
│   │   │   └── Stat.tsx                     (<100 LOC)
│   │   │
│   │   └── modals/
│   │       ├── Modal.tsx                    (<200 LOC)
│   │       ├── ConfirmDialog.tsx            (<150 LOC)
│   │       └── SlideOver.tsx                (<200 LOC)
│   │
│   ├── pages/                      # Page components (route targets)
│   │   ├── auth/
│   │   │   ├── LoginPage.tsx                (<200 LOC)
│   │   │   ├── RegisterPage.tsx             (<200 LOC)
│   │   │   └── ForgotPasswordPage.tsx       (<150 LOC)
│   │   │
│   │   ├── dashboard/
│   │   │   └── DashboardPage.tsx            (<300 LOC)
│   │   │
│   │   ├── contacts/
│   │   │   ├── ContactsPage.tsx             (<350 LOC)
│   │   │   └── ContactDetailPage.tsx        (<250 LOC)
│   │   │
│   │   ├── lists/
│   │   │   ├── ListsPage.tsx                (<250 LOC)
│   │   │   └── ListDetailPage.tsx           (<300 LOC)
│   │   │
│   │   ├── imports/
│   │   │   ├── ImportsPage.tsx              (<200 LOC)
│   │   │   └── ImportDetailPage.tsx         (<250 LOC)
│   │   │
│   │   ├── exports/
│   │   │   └── ExportsPage.tsx              (<200 LOC)
│   │   │
│   │   ├── dedup/
│   │   │   └── DedupPage.tsx                (<300 LOC)
│   │   │
│   │   ├── segments/
│   │   │   ├── SegmentsPage.tsx             (<250 LOC)
│   │   │   └── SegmentDetailPage.tsx        (<250 LOC)
│   │   │
│   │   ├── settings/
│   │   │   ├── SettingsPage.tsx             (<200 LOC)
│   │   │   ├── OrgSettingsPage.tsx          (<250 LOC)
│   │   │   ├── TeamPage.tsx                 (<250 LOC)
│   │   │   ├── BillingPage.tsx              (<300 LOC)
│   │   │   └── ProfilePage.tsx              (<200 LOC)
│   │   │
│   │   ├── audit/
│   │   │   └── AuditPage.tsx                (<250 LOC)
│   │   │
│   │   └── errors/
│   │       ├── NotFoundPage.tsx             (<100 LOC)
│   │       └── UnauthorizedPage.tsx         (<100 LOC)
│   │
│   ├── hooks/                      # Custom React hooks
│   │   ├── useAuth.ts                       (<200 LOC)
│   │   ├── useContacts.ts                   (<300 LOC)
│   │   ├── useImports.ts                    (<250 LOC)
│   │   ├── useExports.ts                    (<200 LOC)
│   │   ├── useDedup.ts                      (<250 LOC)
│   │   ├── useWebSocket.ts                  (<200 LOC)
│   │   ├── usePermissions.ts                (<150 LOC)
│   │   ├── useDebounce.ts                   (<50 LOC)
│   │   ├── useLocalStorage.ts               (<100 LOC)
│   │   └── usePagination.ts                 (<100 LOC)
│   │
│   ├── store/                      # Zustand stores
│   │   ├── authStore.ts                     (<200 LOC)
│   │   ├── orgStore.ts                      (<150 LOC)
│   │   ├── uiStore.ts                       (<150 LOC)
│   │   └── filterStore.ts                   (<200 LOC)
│   │
│   ├── lib/                        # Utility libraries
│   │   ├── validators.ts                    (<300 LOC)
│   │   ├── formatters.ts                    (<400 LOC)
│   │   ├── crypto.ts                        (<200 LOC)
│   │   ├── date.ts                          (<150 LOC)
│   │   ├── string.ts                        (<150 LOC)
│   │   ├── array.ts                         (<150 LOC)
│   │   └── export.ts                        (<200 LOC)
│   │
│   ├── types/                      # TypeScript types
│   │   ├── api.types.ts                     (<400 LOC)
│   │   ├── contact.types.ts                 (<200 LOC)
│   │   ├── import.types.ts                  (<200 LOC)
│   │   ├── dedup.types.ts                   (<200 LOC)
│   │   └── user.types.ts                    (<150 LOC)
│   │
│   ├── constants/                  # Constants and config
│   │   ├── routes.ts
│   │   ├── permissions.ts
│   │   ├── plans.ts
│   │   └── config.ts
│   │
│   ├── App.tsx                     # Root component
│   ├── main.tsx                    # Entry point
│   ├── router.tsx                  # Route configuration
│   └── vite-env.d.ts
│
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
├── .env.example
├── .env.development
├── .env.production
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
└── README.md
```

---

## Component Organization

### Component Categories

#### 1. Page Components (`/pages`)
- **Purpose**: Route targets, orchestrate layout
- **Responsibilities**:
  - Fetch data via hooks
  - Compose feature components
  - Handle page-level state
- **Naming**: `{Feature}Page.tsx`
- **Max LOC**: 350

#### 2. Feature Components (`/components`)
- **Purpose**: Domain-specific, reusable within feature
- **Responsibilities**:
  - Implement feature logic
  - Manage local state
  - Call API hooks
- **Naming**: `{FeatureName}.tsx`
- **Max LOC**: 400

#### 3. Shared Components (`/shared`)
- **Purpose**: Generic, reusable across features
- **Responsibilities**:
  - UI primitives
  - Layout components
  - Feedback components
- **Naming**: `{ComponentName}.tsx`
- **Max LOC**: 200

### Component Structure Template

```tsx
// components/contacts/ContactForm.tsx

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { FormField, FormLabel, FormError } from '@/shared/forms';
import { contactSchema } from '@/lib/validators';
import { useCreateContact } from '@/hooks/useContacts';

// Types
interface ContactFormProps {
  listId: string;
  onSuccess?: (contact: Contact) => void;
  onCancel?: () => void;
}

// Schema
const formSchema = contactSchema.pick({
  email: true,
  first_name: true,
  last_name: true,
  phone: true,
});

type FormData = z.infer<typeof formSchema>;

/**
 * Form for creating/editing a contact
 * 
 * Features:
 * - Client-side validation with Zod
 * - Auto-formatting of phone/email
 * - Inline error display
 */
export function ContactForm({ 
  listId, 
  onSuccess, 
  onCancel 
}: ContactFormProps) {
  // Hooks
  const createContact = useCreateContact();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<FormData>({
    resolver: zodResolver(formSchema)
  });

  // Handlers
  const onSubmit = async (data: FormData) => {
    try {
      const contact = await createContact.mutateAsync({
        ...data,
        list_id: listId
      });
      onSuccess?.(contact);
    } catch (error) {
      // Error handled by mutation
    }
  };

  // Render
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <FormField>
        <FormLabel htmlFor="email">Email</FormLabel>
        <Input
          id="email"
          type="email"
          {...register('email')}
          aria-invalid={!!errors.email}
        />
        {errors.email && <FormError>{errors.email.message}</FormError>}
      </FormField>

      <FormField>
        <FormLabel htmlFor="first_name">First Name</FormLabel>
        <Input id="first_name" {...register('first_name')} />
        {errors.first_name && <FormError>{errors.first_name.message}</FormError>}
      </FormField>

      {/* More fields... */}

      <div className="flex gap-2 justify-end">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Creating...' : 'Create Contact'}
        </Button>
      </div>
    </form>
  );
}
```

---

## State Management

### Zustand Stores (Global State)

#### authStore.ts
```typescript
// store/authStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  
  // Actions
  login: (tokens: { accessToken: string; refreshToken: string }, user: User) => void;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      
      login: (tokens, user) => set({
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        user,
        isAuthenticated: true
      }),
      
      logout: () => set({
        user: null,
        accessToken: null,
        refreshToken: null,
        isAuthenticated: false
      }),
      
      updateUser: (userData) => set((state) => ({
        user: state.user ? { ...state.user, ...userData } : null
      }))
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        refreshToken: state.refreshToken,
        user: state.user
      })
    }
  )
);
```

#### orgStore.ts
```typescript
// store/orgStore.ts
import { create } from 'zustand';

interface Org {
  id: string;
  name: string;
  slug: string;
  plan: string;
  role: string;
}

interface OrgState {
  currentOrg: Org | null;
  orgs: Org[];
  
  setCurrentOrg: (org: Org) => void;
  setOrgs: (orgs: Org[]) => void;
}

export const useOrgStore = create<OrgState>((set) => ({
  currentOrg: null,
  orgs: [],
  
  setCurrentOrg: (org) => set({ currentOrg: org }),
  setOrgs: (orgs) => set({ orgs })
}));
```

### React Query (Server State)

#### useContacts.ts
```typescript
// hooks/useContacts.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { contactsApi } from '@/api';
import type { Contact, ContactFilters, CreateContactInput } from '@/types';

// Query keys factory
export const contactKeys = {
  all: ['contacts'] as const,
  lists: () => [...contactKeys.all, 'list'] as const,
  list: (filters: ContactFilters) => [...contactKeys.lists(), filters] as const,
  details: () => [...contactKeys.all, 'detail'] as const,
  detail: (id: string) => [...contactKeys.details(), id] as const,
};

// List contacts
export function useContacts(filters: ContactFilters) {
  return useQuery({
    queryKey: contactKeys.list(filters),
    queryFn: () => contactsApi.list(filters),
    keepPreviousData: true,
  });
}

// Get single contact
export function useContact(id: string) {
  return useQuery({
    queryKey: contactKeys.detail(id),
    queryFn: () => contactsApi.get(id),
    enabled: !!id,
  });
}

// Create contact
export function useCreateContact() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateContactInput) => contactsApi.create(data),
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: contactKeys.lists() });
    },
  });
}

// Update contact
export function useUpdateContact() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Contact> }) =>
      contactsApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: contactKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: contactKeys.lists() });
    },
  });
}

// Delete contact
export function useDeleteContact() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => contactsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contactKeys.lists() });
    },
  });
}
```

---

## Routing

### router.tsx
```typescript
// router.tsx
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppLayout } from '@/shared/layout/AppLayout';
import { AuthLayout } from '@/shared/layout/AuthLayout';

// Lazy-loaded pages
const DashboardPage = lazy(() => import('@/pages/dashboard/DashboardPage'));
const ContactsPage = lazy(() => import('@/pages/contacts/ContactsPage'));
const ListsPage = lazy(() => import('@/pages/lists/ListsPage'));
// ... other pages

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />
      },
      {
        path: 'dashboard',
        element: <DashboardPage />
      },
      {
        path: 'contacts',
        element: <ContactsPage />
      },
      {
        path: 'contacts/:contactId',
        element: <ContactDetailPage />
      },
      {
        path: 'lists',
        element: <ListsPage />
      },
      {
        path: 'lists/:listId',
        element: <ListDetailPage />
      },
      // ... more routes
    ]
  },
  {
    path: '/auth',
    element: <AuthLayout />,
    children: [
      {
        path: 'login',
        element: <LoginPage />
      },
      {
        path: 'register',
        element: <RegisterPage />
      },
      // ... auth routes
    ]
  }
]);
```

### Protected Routes
```typescript
// components/auth/ProtectedRoute.tsx
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission?: string;
}

export function ProtectedRoute({ 
  children, 
  requiredPermission 
}: ProtectedRouteProps) {
  const { isAuthenticated } = useAuthStore();
  const location = useLocation();
  
  if (!isAuthenticated) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }
  
  // Check permission if required
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return <Navigate to="/unauthorized" replace />;
  }
  
  return <>{children}</>;
}
```

---

## Key Components

### ContactsTable Component

```typescript
// components/contacts/ContactsTable/ContactsTable.tsx
import React, { useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table';
import { useContacts } from '@/hooks/useContacts';
import { ContactsTableHeader } from './ContactsTableHeader';
import { ContactsTableRow } from './ContactsTableRow';
import { ContactsTableFilters } from './ContactsTableFilters';
import { BulkActionsToolbar } from './BulkActionsToolbar';
import { Pagination } from '@/shared/data-display/Pagination';
import { LoadingSpinner } from '@/shared/feedback/LoadingSpinner';
import type { Contact, ContactFilters } from '@/types';

interface ContactsTableProps {
  listId?: string;
  initialFilters?: Partial<ContactFilters>;
}

export function ContactsTable({ listId, initialFilters }: ContactsTableProps) {
  // State
  const [filters, setFilters] = useState<ContactFilters>({
    list_id: listId,
    page: 1,
    limit: 50,
    ...initialFilters,
  });
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState({});

  // Data
  const { data, isLoading } = useContacts(filters);

  // Columns definition
  const columns: ColumnDef<Contact>[] = [
    {
      id: 'select',
      header: ({ table }) => (
        <input
          type="checkbox"
          checked={table.getIsAllRowsSelected()}
          onChange={table.getToggleAllRowsSelectedHandler()}
        />
      ),
      cell: ({ row }) => (
        <input
          type="checkbox"
          checked={row.getIsSelected()}
          onChange={row.getToggleSelectedHandler()}
        />
      ),
    },
    {
      accessorKey: 'email',
      header: 'Email',
      cell: ({ getValue }) => <span>{getValue() as string}</span>,
    },
    {
      accessorKey: 'first_name',
      header: 'First Name',
    },
    {
      accessorKey: 'last_name',
      header: 'Last Name',
    },
    // ... more columns
  ];

  // Table instance
  const table = useReactTable({
    data: data?.data || [],
    columns,
    state: {
      sorting,
      rowSelection,
    },
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  // Render
  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      <ContactsTableFilters filters={filters} onFiltersChange={setFilters} />
      
      {Object.keys(rowSelection).length > 0 && (
        <BulkActionsToolbar
          selectedCount={Object.keys(rowSelection).length}
          onClearSelection={() => setRowSelection({})}
        />
      )}

      <div className="rounded-md border">
        <table className="w-full">
          <ContactsTableHeader headerGroups={table.getHeaderGroups()} />
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <ContactsTableRow key={row.id} row={row} />
            ))}
          </tbody>
        </table>
      </div>

      {data?.meta && (
        <Pagination
          page={data.meta.page}
          totalPages={data.meta.totalPages}
          onPageChange={(page) => setFilters({ ...filters, page })}
        />
      )}
    </div>
  );
}
```

### ImportWizard Component

```typescript
// components/imports/ImportWizard/ImportWizard.tsx
import React, { useState } from 'react';
import { Dialog } from '@/shared/ui/dialog';
import { FileUploadStep } from './FileUploadStep';
import { ColumnMappingStep } from './ColumnMappingStep';
import { ValidationStep } from './ValidationStep';
import { ProgressStep } from './ProgressStep';
import { useImportWizard } from '@/hooks/useImports';
import type { ImportState } from '@/types';

interface ImportWizardProps {
  listId: string;
  open: boolean;
  onClose: () => void;
  onComplete?: () => void;
}

type Step = 'upload' | 'mapping' | 'validation' | 'progress';

export function ImportWizard({ 
  listId, 
  open, 
  onClose, 
  onComplete 
}: ImportWizardProps) {
  // State
  const [currentStep, setCurrentStep] = useState<Step>('upload');
  const [importState, setImportState] = useState<ImportState | null>(null);

  // Hook
  const importWizard = useImportWizard({
    listId,
    onComplete: () => {
      onComplete?.();
      onClose();
    },
  });

  // Step navigation
  const goToNextStep = () => {
    const steps: Step[] = ['upload', 'mapping', 'validation', 'progress'];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1]);
    }
  };

  const goToPreviousStep = () => {
    const steps: Step[] = ['upload', 'mapping', 'validation', 'progress'];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1]);
    }
  };

  // Render current step
  const renderStep = () => {
    switch (currentStep) {
      case 'upload':
        return (
          <FileUploadStep
            onFileUploaded={(file) => {
              setImportState({ file });
              goToNextStep();
            }}
          />
        );
      case 'mapping':
        return (
          <ColumnMappingStep
            importState={importState!}
            onMappingConfirmed={(mapping) => {
              setImportState({ ...importState!, mapping });
              goToNextStep();
            }}
            onBack={goToPreviousStep}
          />
        );
      case 'validation':
        return (
          <ValidationStep
            importState={importState!}
            onValidationComplete={() => goToNextStep()}
            onBack={goToPreviousStep}
          />
        );
      case 'progress':
        return (
          <ProgressStep
            importId={importState!.importId}
            onComplete={onComplete}
          />
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-4">Import Contacts</h2>
        
        {/* Step indicator */}
        <div className="flex mb-6">
          {['Upload', 'Mapping', 'Validation', 'Progress'].map((label, i) => (
            <div key={label} className="flex-1">
              <div className={`text-sm ${i <= ['upload', 'mapping', 'validation', 'progress'].indexOf(currentStep) ? 'text-blue-600' : 'text-gray-400'}`}>
                {label}
              </div>
            </div>
          ))}
        </div>

        {/* Current step */}
        {renderStep()}
      </div>
    </Dialog>
  );
}
```

---

## Shared Components

### DataTable Component (Reusable)

```typescript
// shared/data-display/DataTable.tsx
import React from 'react';
import {
  flexRender,
  type Table as TableType,
} from '@tanstack/react-table';

interface DataTableProps<TData> {
  table: TableType<TData>;
  isLoading?: boolean;
  emptyMessage?: string;
}

export function DataTable<TData>({ 
  table, 
  isLoading, 
  emptyMessage = 'No data' 
}: DataTableProps<TData>) {
  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="rounded-md border">
      <table className="w-full">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th key={header.id} className="px-4 py-2 text-left">
                  {flexRender(
                    header.column.columnDef.header,
                    header.getContext()
                  )}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.length === 0 ? (
            <tr>
              <td colSpan={table.getAllColumns().length} className="text-center py-8 text-gray-500">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="border-t hover:bg-gray-50">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-4 py-2">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
```

---

## Hooks

### useWebSocket Hook

```typescript
// hooks/useWebSocket.ts
import { useEffect, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import { useAuthStore } from '@/store/authStore';

export function useWebSocket() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const { accessToken } = useAuthStore();

  useEffect(() => {
    if (!accessToken) return;

    const newSocket = io(import.meta.env.VITE_WS_URL, {
      auth: { token: accessToken }
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [accessToken]);

  return socket;
}

// Usage in component
export function useImportProgress(importId: string) {
  const socket = useWebSocket();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!socket || !importId) return;

    socket.emit('subscribe', { type: 'import', id: importId });

    socket.on('import:progress', (data) => {
      setProgress(data.progress);
    });

    return () => {
      socket.off('import:progress');
    };
  }, [socket, importId]);

  return progress;
}
```

---

## Utilities

### formatters.ts
```typescript
// lib/formatters.ts

/**
 * Format phone number to US format
 */
export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  return phone;
}

/**
 * Format currency in USD
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
}

/**
 * Format relative time
 */
export function formatRelativeTime(date: Date | string): string {
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  const now = new Date();
  const then = new Date(date);
  const diffMs = then.getTime() - now.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
  
  if (Math.abs(diffDays) < 1) return 'today';
  if (Math.abs(diffDays) < 7) return rtf.format(diffDays, 'day');
  if (Math.abs(diffDays) < 30) return rtf.format(Math.round(diffDays / 7), 'week');
  return rtf.format(Math.round(diffDays / 30), 'month');
}
```

---

## Styling

### TailwindCSS Configuration

```javascript
// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          // ... full scale
          900: '#1e3a8a',
        },
        // ... other custom colors
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
}
```

### CSS Architecture

```
src/
├── styles/
│   ├── globals.css          # Global styles, Tailwind imports
│   ├── animations.css       # Custom animations
│   └── utilities.css        # Custom utility classes
```

```css
/* styles/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body {
    @apply bg-gray-50 text-gray-900 antialiased;
  }
}

@layer components {
  .btn-primary {
    @apply px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 
           focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
           disabled:opacity-50 disabled:cursor-not-allowed;
  }
}
```

---

**End of Frontend Component Structure**

**Code Modularization Reminder:**
> **CRITICAL:** No single component file should exceed 450 lines of code. When a component approaches this limit, split it into smaller sub-components with focused responsibilities. Use composition over large monolithic components.

**Next Document:** Development Roadmap with comprehensive task list
