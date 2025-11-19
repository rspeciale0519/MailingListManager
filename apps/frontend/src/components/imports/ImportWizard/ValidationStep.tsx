import { useState } from 'react';
import { useImport } from '@/hooks/useImports';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { Checkbox } from '@/shared/ui/checkbox';
import { Label } from '@/shared/ui/label';
import {
  AlertCircle,
  CheckCircle,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';

interface ValidationStepProps {
  importId: string;
  onStartImport: (validationResults: ValidationResults) => void;
  onBack: () => void;
}

interface ValidationResults {
  total: number;
  valid: number;
  invalid: number;
  warnings: number;
  errors: Array<{
    type: string;
    count: number;
    rows: number[];
    fixable?: boolean;
  }>;
}

export function ValidationStep({ importId, onStartImport, onBack }: ValidationStepProps) {
  const [skipInvalid, setSkipInvalid] = useState(true);
  const [expandedErrors, setExpandedErrors] = useState<Set<string>>(new Set());
  const { import: importData, isLoading } = useImport(importId);

  // Simulate validation results
  // In a real app, this would come from the API
  const validationResults: ValidationResults = {
    total: importData?.total_rows || 0,
    valid: importData?.valid_rows || 0,
    invalid: importData?.invalid_rows || 0,
    warnings: 0,
    errors: [],
  };

  const handleStartImport = () => {
    onStartImport(validationResults);
  };

  const toggleErrorExpanded = (errorType: string) => {
    setExpandedErrors((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(errorType)) {
        newSet.delete(errorType);
      } else {
        newSet.add(errorType);
      }
      return newSet;
    });
  };

  const hasErrors = validationResults.errors.length > 0;
  const canProceed = validationResults.valid > 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Validating data...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <div className="text-sm text-gray-600 mb-1">Total Rows</div>
          <div className="text-3xl font-bold text-gray-900">{validationResults.total}</div>
        </div>
        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
          <div className="text-sm text-green-600 mb-1">Valid</div>
          <div className="text-3xl font-bold text-green-900">{validationResults.valid}</div>
        </div>
        <div className="bg-red-50 rounded-lg p-4 border border-red-200">
          <div className="text-sm text-red-600 mb-1">Errors</div>
          <div className="text-3xl font-bold text-red-900">{validationResults.invalid}</div>
        </div>
        <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
          <div className="text-sm text-yellow-600 mb-1">Warnings</div>
          <div className="text-3xl font-bold text-yellow-900">{validationResults.warnings}</div>
        </div>
      </div>

      {/* Validation Status */}
      {!hasErrors ? (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex gap-3">
            <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-green-800">
              <p className="font-medium mb-1">All rows validated successfully!</p>
              <p>Your data looks good and is ready to be imported.</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-yellow-800">
              <p className="font-medium mb-1">Some rows have validation errors</p>
              <p>
                Review the errors below. You can choose to skip invalid rows or fix them before
                importing.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error Groups */}
      {hasErrors && (
        <div className="space-y-3">
          <h3 className="font-semibold text-lg">Validation Errors</h3>
          {validationResults.errors.map((error) => {
            const isExpanded = expandedErrors.has(error.type);

            return (
              <div
                key={error.type}
                className="border border-gray-200 rounded-lg overflow-hidden"
              >
                <button
                  type="button"
                  className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                  onClick={() => toggleErrorExpanded(error.type)}
                >
                  <div className="flex items-center gap-3">
                    <AlertCircle className="h-5 w-5 text-red-600" />
                    <div className="text-left">
                      <div className="font-medium">{error.type}</div>
                      <div className="text-sm text-gray-500">
                        {error.count} {error.count === 1 ? 'row' : 'rows'} affected
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {error.fixable && (
                      <Button variant="outline" size="sm" onClick={(e) => e.stopPropagation()}>
                        Quick Fix
                      </Button>
                    )}
                    <Badge variant="destructive">{error.count}</Badge>
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-gray-200 bg-gray-50 p-4">
                    <div className="text-sm text-gray-700">
                      <p className="font-medium mb-2">Affected rows:</p>
                      <div className="flex flex-wrap gap-1">
                        {error.rows.slice(0, 20).map((row) => (
                          <Badge key={row} variant="outline">
                            {row}
                          </Badge>
                        ))}
                        {error.rows.length > 20 && (
                          <Badge variant="outline">+{error.rows.length - 20} more</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Import Options */}
      <div className="space-y-4 pt-4 border-t">
        <h3 className="font-semibold text-lg">Import Options</h3>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="skip-invalid"
            checked={skipInvalid}
            onCheckedChange={(checked) => setSkipInvalid(!!checked)}
          />
          <Label htmlFor="skip-invalid" className="cursor-pointer">
            Skip invalid rows and import only valid data
          </Label>
        </div>

        {!skipInvalid && hasErrors && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="flex gap-2 text-sm text-red-800">
              <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <p>
                Invalid rows will cause the import to fail. Please fix the errors or enable
                "Skip invalid rows" to proceed.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Progress Summary */}
      {skipInvalid && hasErrors && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Import Summary</p>
            <p>
              {validationResults.valid} out of {validationResults.total} rows will be imported.
              {validationResults.invalid} invalid {validationResults.invalid === 1 ? 'row' : 'rows'} will
              be skipped.
            </p>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-between pt-4 border-t">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button
          onClick={handleStartImport}
          disabled={!canProceed || (!skipInvalid && hasErrors)}
        >
          Start Import
        </Button>
      </div>
    </div>
  );
}
