import { useState, useEffect } from 'react';
import { useImports, useImportPreview } from '@/hooks/useImports';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui/table';
import { ArrowRight, AlertCircle, CheckCircle, AlertTriangle } from 'lucide-react';
import type { ImportPreview, ColumnMapping } from '@/types';

interface ColumnMappingStepProps {
  preview: ImportPreview;
  importId: string;
  onMappingConfirmed: (mapping: ColumnMapping[]) => void;
  onBack: () => void;
}

const TARGET_FIELDS = [
  { value: 'email', label: 'Email', required: false },
  { value: 'phone', label: 'Phone', required: false },
  { value: 'first_name', label: 'First Name', required: false },
  { value: 'last_name', label: 'Last Name', required: false },
  { value: 'full_name', label: 'Full Name', required: false },
  { value: 'company', label: 'Company', required: false },
  { value: 'title', label: 'Title', required: false },
  { value: 'address_line1', label: 'Address Line 1', required: false },
  { value: 'city', label: 'City', required: false },
  { value: 'state', label: 'State', required: false },
  { value: 'postal_code', label: 'Postal Code', required: false },
  { value: 'country', label: 'Country', required: false },
];

export function ColumnMappingStep({
  preview: initialPreview,
  importId,
  onMappingConfirmed,
  onBack,
}: ColumnMappingStepProps) {
  const { preview: fetchedPreview, isLoading } = useImportPreview(importId);
  const { confirmMapping, isConfirming } = useImports();
  const [mapping, setMapping] = useState<Record<string, ColumnMapping>>({});

  const preview = fetchedPreview || initialPreview;

  useEffect(() => {
    if (preview?.suggested_mapping) {
      // Initialize with suggested mappings
      const initialMapping: Record<string, ColumnMapping> = {};
      preview.suggested_mapping.forEach((suggestion) => {
        initialMapping[suggestion.source_header] = suggestion;
      });
      setMapping(initialMapping);
    }
  }, [preview]);

  const handleFieldChange = (sourceHeader: string, targetField: string) => {
    if (!targetField) {
      // Remove mapping
      setMapping((prev) => {
        const newMapping = { ...prev };
        delete newMapping[sourceHeader];
        return newMapping;
      });
    } else {
      // Add or update mapping
      setMapping((prev) => ({
        ...prev,
        [sourceHeader]: {
          source_header: sourceHeader,
          target_field: targetField,
          confidence: 1.0,
          reason: 'Manual selection',
        },
      }));
    }
  };

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 0.9) {
      return (
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          <CheckCircle className="mr-1 h-3 w-3" />
          Exact
        </Badge>
      );
    } else if (confidence >= 0.7) {
      return (
        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
          <AlertTriangle className="mr-1 h-3 w-3" />
          Likely
        </Badge>
      );
    } else {
      return (
        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
          <AlertCircle className="mr-1 h-3 w-3" />
          Low
        </Badge>
      );
    }
  };

  const handleConfirm = async () => {
    const mappings = Object.values(mapping);

    await confirmMapping(
      {
        importId,
        mapping: { mappings },
      },
      {
        onSuccess: () => {
          onMappingConfirmed(mappings);
        },
      }
    );
  };

  const mappedFields = new Set(Object.values(mapping).map((m) => m.target_field));
  const unmappedHeaders = preview?.headers.filter((h) => !mapping[h]) || [];
  const hasMappings = Object.keys(mapping).length > 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading preview...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex gap-3">
          <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Map your columns</p>
            <p>
              Match the columns from your file to the contact fields. We've suggested mappings
              based on column names, but you can adjust them as needed.
            </p>
          </div>
        </div>
      </div>

      {/* Mapping Interface */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-1/3">Source Column</TableHead>
              <TableHead className="w-16"></TableHead>
              <TableHead className="w-1/3">Target Field</TableHead>
              <TableHead className="w-32">Confidence</TableHead>
              <TableHead>Preview</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {preview?.headers.map((header) => {
              const currentMapping = mapping[header];
              const sampleValue = preview.rows[0]?.[header];

              return (
                <TableRow key={header}>
                  <TableCell className="font-medium">{header}</TableCell>
                  <TableCell>
                    <ArrowRight className="h-4 w-4 text-gray-400" />
                  </TableCell>
                  <TableCell>
                    <Select
                      value={currentMapping?.target_field || ''}
                      onValueChange={(value) => handleFieldChange(header, value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Skip this column" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Skip this column</SelectItem>
                        {TARGET_FIELDS.map((field) => (
                          <SelectItem
                            key={field.value}
                            value={field.value}
                            disabled={mappedFields.has(field.value) && currentMapping?.target_field !== field.value}
                          >
                            {field.label}
                            {field.required && ' *'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    {currentMapping && getConfidenceBadge(currentMapping.confidence)}
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-gray-600 truncate max-w-[200px] block">
                      {sampleValue ? String(sampleValue) : '—'}
                    </span>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Preview Table */}
      {preview?.rows && preview.rows.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-semibold text-sm text-gray-700">
            Preview (First 5 rows)
          </h3>
          <div className="border border-gray-200 rounded-lg overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {Object.values(mapping).map((m) => (
                    <TableHead key={m.target_field}>
                      {TARGET_FIELDS.find((f) => f.value === m.target_field)?.label}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {preview.rows.slice(0, 5).map((row, idx) => (
                  <TableRow key={idx}>
                    {Object.values(mapping).map((m) => (
                      <TableCell key={m.target_field}>
                        {String(row[m.source_header] || '—')}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="text-sm text-gray-600">Total Columns</div>
          <div className="text-2xl font-bold text-gray-900">{preview?.headers.length || 0}</div>
        </div>
        <div className="bg-green-50 rounded-lg p-4">
          <div className="text-sm text-green-600">Mapped</div>
          <div className="text-2xl font-bold text-green-900">{Object.keys(mapping).length}</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="text-sm text-gray-600">Unmapped</div>
          <div className="text-2xl font-bold text-gray-900">{unmappedHeaders.length}</div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-between pt-4 border-t">
        <Button variant="outline" onClick={onBack} disabled={isConfirming}>
          Back
        </Button>
        <Button onClick={handleConfirm} disabled={!hasMappings || isConfirming}>
          {isConfirming ? 'Confirming...' : 'Continue to Validation'}
        </Button>
      </div>
    </div>
  );
}
