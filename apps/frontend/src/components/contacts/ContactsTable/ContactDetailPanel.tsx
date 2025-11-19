import { useState } from 'react';
import { useContact, useContacts } from '@/hooks/useContacts';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';
import { Separator } from '@/shared/ui/separator';
import { X, Edit, Trash, Mail, Phone, Building, MapPin, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { ContactForm } from './ContactForm';
import type { Contact } from '@/types';

interface ContactDetailPanelProps {
  contactId: string;
  isOpen: boolean;
  onClose: () => void;
  onDeleted?: () => void;
}

export function ContactDetailPanel({
  contactId,
  isOpen,
  onClose,
  onDeleted,
}: ContactDetailPanelProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { contact, isLoading } = useContact(contactId);
  const { deleteContact, isDeleting } = useContacts();

  if (!contact && !isLoading) return null;

  const handleDelete = () => {
    deleteContact(contactId, {
      onSuccess: () => {
        setShowDeleteDialog(false);
        onClose();
        onDeleted?.();
      },
    });
  };

  const getStatusColor = (status: Contact['status']) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      bounced: 'bg-red-100 text-red-800',
      unsubscribed: 'bg-yellow-100 text-yellow-800',
      deleted: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || colors.inactive;
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-gray-500">Loading contact...</div>
            </div>
          ) : contact && isEditing ? (
            <ContactForm
              contact={contact}
              onSuccess={() => {
                setIsEditing(false);
              }}
              onCancel={() => setIsEditing(false)}
            />
          ) : contact ? (
            <>
              <DialogHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <DialogTitle className="text-2xl">
                      {contact.full_name || contact.first_name || contact.last_name || 'Unnamed Contact'}
                    </DialogTitle>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge className={getStatusColor(contact.status)}>
                        {contact.status}
                      </Badge>
                      {contact.tags.map((tag) => (
                        <Badge key={tag} variant="outline">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={onClose}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </DialogHeader>

              <Tabs defaultValue="details" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="history">History</TabsTrigger>
                  <TabsTrigger value="notes">Notes</TabsTrigger>
                </TabsList>

                <TabsContent value="details" className="space-y-6">
                  {/* Contact Information */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Contact Information</h3>

                    {contact.email && (
                      <div className="flex items-start gap-3">
                        <Mail className="h-5 w-5 text-gray-400 mt-0.5" />
                        <div>
                          <div className="text-sm text-gray-500">Email</div>
                          <div className="font-medium">{contact.email}</div>
                        </div>
                      </div>
                    )}

                    {contact.phone && (
                      <div className="flex items-start gap-3">
                        <Phone className="h-5 w-5 text-gray-400 mt-0.5" />
                        <div>
                          <div className="text-sm text-gray-500">Phone</div>
                          <div className="font-medium">{contact.phone}</div>
                        </div>
                      </div>
                    )}

                    {contact.company && (
                      <div className="flex items-start gap-3">
                        <Building className="h-5 w-5 text-gray-400 mt-0.5" />
                        <div>
                          <div className="text-sm text-gray-500">Company</div>
                          <div className="font-medium">{contact.company}</div>
                          {contact.title && (
                            <div className="text-sm text-gray-600">{contact.title}</div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <Separator />

                  {/* Address Information */}
                  {(contact.address_line1 || contact.city || contact.state) && (
                    <>
                      <div className="space-y-4">
                        <h3 className="font-semibold text-lg">Address</h3>
                        <div className="flex items-start gap-3">
                          <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                          <div>
                            {contact.address_line1 && (
                              <div>{contact.address_line1}</div>
                            )}
                            {contact.address_line2 && (
                              <div>{contact.address_line2}</div>
                            )}
                            <div>
                              {[contact.city, contact.state, contact.postal_code]
                                .filter(Boolean)
                                .join(', ')}
                            </div>
                            {contact.country && <div>{contact.country}</div>}
                          </div>
                        </div>
                      </div>
                      <Separator />
                    </>
                  )}

                  {/* Custom Fields */}
                  {Object.keys(contact.custom_fields || {}).length > 0 && (
                    <>
                      <div className="space-y-4">
                        <h3 className="font-semibold text-lg">Custom Fields</h3>
                        <div className="grid grid-cols-2 gap-4">
                          {Object.entries(contact.custom_fields).map(([key, value]) => (
                            <div key={key}>
                              <div className="text-sm text-gray-500 capitalize">
                                {key.replace(/_/g, ' ')}
                              </div>
                              <div className="font-medium">
                                {String(value)}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      <Separator />
                    </>
                  )}

                  {/* Metadata */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Metadata</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-start gap-3">
                        <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                        <div>
                          <div className="text-sm text-gray-500">Created</div>
                          <div className="font-medium">
                            {format(new Date(contact.created_at), 'MMM d, yyyy h:mm a')}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                        <div>
                          <div className="text-sm text-gray-500">Updated</div>
                          <div className="font-medium">
                            {format(new Date(contact.updated_at), 'MMM d, yyyy h:mm a')}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="history" className="space-y-4">
                  <div className="text-center py-8 text-gray-500">
                    History tracking coming soon
                  </div>
                </TabsContent>

                <TabsContent value="notes" className="space-y-4">
                  <div className="text-center py-8 text-gray-500">
                    Notes feature coming soon
                  </div>
                </TabsContent>
              </Tabs>

              <DialogFooter className="flex gap-2">
                <Button
                  variant="destructive"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  <Trash className="mr-2 h-4 w-4" />
                  Delete
                </Button>
                <Button onClick={() => setIsEditing(true)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </Button>
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Contact</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this contact? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
