import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useContacts } from '@/hooks/useContacts';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import type { Contact, CreateContactInput, UpdateContactInput } from '@/types';

const contactSchema = z.object({
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().regex(/^\+?[\d\s()-]+$/, 'Invalid phone number').optional().or(z.literal('')),
  first_name: z.string().max(255).optional(),
  last_name: z.string().max(255).optional(),
  company: z.string().max(255).optional(),
  title: z.string().max(255).optional(),
  address_line1: z.string().max(255).optional(),
  city: z.string().max(255).optional(),
  state: z.string().max(2).optional(),
  postal_code: z.string().max(20).optional(),
  country: z.string().max(2).optional(),
});

type ContactFormData = z.infer<typeof contactSchema>;

interface ContactFormProps {
  contact?: Contact;
  listId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ContactForm({ contact, listId, onSuccess, onCancel }: ContactFormProps) {
  const isEdit = !!contact;
  const { createContact, updateContact, isCreating, isUpdating } = useContacts();

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: contact || {},
  });

  const onSubmit = async (data: ContactFormData) => {
    // Remove empty strings and convert to undefined
    const cleanData = Object.fromEntries(
      Object.entries(data).map(([key, value]) => [
        key,
        value === '' ? undefined : value,
      ])
    );

    if (isEdit) {
      await updateContact(
        {
          id: contact.id,
          data: cleanData as UpdateContactInput,
        },
        {
          onSuccess: () => {
            onSuccess?.();
          },
        }
      );
    } else {
      if (!listId) {
        console.error('listId is required for creating a contact');
        return;
      }
      await createContact(
        {
          list_id: listId,
          ...cleanData,
        } as CreateContactInput,
        {
          onSuccess: () => {
            onSuccess?.();
          },
        }
      );
    }
  };

  const isLoading = isCreating || isUpdating;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">
          {isEdit ? 'Edit Contact' : 'Create Contact'}
        </h3>

        {/* Name Fields */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="first_name">First Name</Label>
            <Input
              id="first_name"
              {...register('first_name')}
              placeholder="John"
            />
            {errors.first_name && (
              <p className="text-sm text-red-600">{errors.first_name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="last_name">Last Name</Label>
            <Input
              id="last_name"
              {...register('last_name')}
              placeholder="Doe"
            />
            {errors.last_name && (
              <p className="text-sm text-red-600">{errors.last_name.message}</p>
            )}
          </div>
        </div>

        {/* Contact Fields */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              {...register('email')}
              placeholder="john@example.com"
            />
            {errors.email && (
              <p className="text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              type="tel"
              {...register('phone')}
              placeholder="+1 (555) 123-4567"
            />
            {errors.phone && (
              <p className="text-sm text-red-600">{errors.phone.message}</p>
            )}
          </div>
        </div>

        {/* Company Fields */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="company">Company</Label>
            <Input
              id="company"
              {...register('company')}
              placeholder="Acme Inc."
            />
            {errors.company && (
              <p className="text-sm text-red-600">{errors.company.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              {...register('title')}
              placeholder="Marketing Manager"
            />
            {errors.title && (
              <p className="text-sm text-red-600">{errors.title.message}</p>
            )}
          </div>
        </div>

        {/* Address Fields */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="address_line1">Address Line 1</Label>
            <Input
              id="address_line1"
              {...register('address_line1')}
              placeholder="123 Main St"
            />
            {errors.address_line1 && (
              <p className="text-sm text-red-600">{errors.address_line1.message}</p>
            )}
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                {...register('city')}
                placeholder="New York"
              />
              {errors.city && (
                <p className="text-sm text-red-600">{errors.city.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="state">State</Label>
              <Input
                id="state"
                {...register('state')}
                placeholder="NY"
                maxLength={2}
              />
              {errors.state && (
                <p className="text-sm text-red-600">{errors.state.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="postal_code">Postal Code</Label>
              <Input
                id="postal_code"
                {...register('postal_code')}
                placeholder="10001"
              />
              {errors.postal_code && (
                <p className="text-sm text-red-600">{errors.postal_code.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="country">Country Code</Label>
            <Input
              id="country"
              {...register('country')}
              placeholder="US"
              maxLength={2}
            />
            {errors.country && (
              <p className="text-sm text-red-600">{errors.country.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end gap-2 pt-4 border-t">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isLoading || (!isDirty && isEdit)}>
          {isLoading ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Contact'}
        </Button>
      </div>
    </form>
  );
}
