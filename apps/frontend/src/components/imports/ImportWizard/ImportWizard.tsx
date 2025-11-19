import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';
import { FileUploadStep } from './FileUploadStep';
import { ColumnMappingStep } from './ColumnMappingStep';
import { ValidationStep } from './ValidationStep';
import { ProgressStep } from './ProgressStep';
import type { ImportPreview, ColumnMapping } from '@/types';

type Step = 'upload' | 'mapping' | 'validation' | 'progress';

interface ImportState {
  file: File | null;
  importId: string | null;
  listId: string;
  preview: ImportPreview | null;
  mapping: ColumnMapping[] | null;
  validationResults: {
    total: number;
    valid: number;
    invalid: number;
    warnings: number;
    errors: Array<{
      type: string;
      count: number;
      rows: number[];
    }>;
  } | null;
}

interface ImportWizardProps {
  listId: string;
  isOpen: boolean;
  onClose: () => void;
  onComplete?: () => void;
}

const STEPS: { value: Step; label: string }[] = [
  { value: 'upload', label: 'Upload' },
  { value: 'mapping', label: 'Map Columns' },
  { value: 'validation', label: 'Validate' },
  { value: 'progress', label: 'Import' },
];

export function ImportWizard({ listId, isOpen, onClose, onComplete }: ImportWizardProps) {
  const [currentStep, setCurrentStep] = useState<Step>('upload');
  const [importState, setImportState] = useState<ImportState>({
    file: null,
    importId: null,
    listId,
    preview: null,
    mapping: null,
    validationResults: null,
  });

  const currentStepIndex = STEPS.findIndex((s) => s.value === currentStep);

  const handleNext = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < STEPS.length) {
      setCurrentStep(STEPS[nextIndex].value);
    }
  };

  const handleBack = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(STEPS[prevIndex].value);
    }
  };

  const handleClose = () => {
    // Reset state on close
    setCurrentStep('upload');
    setImportState({
      file: null,
      importId: null,
      listId,
      preview: null,
      mapping: null,
      validationResults: null,
    });
    onClose();
  };

  const handleComplete = () => {
    onComplete?.();
    handleClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Import Contacts</DialogTitle>
        </DialogHeader>

        {/* Step Indicators */}
        <div className="flex items-center justify-between mb-6">
          {STEPS.map((step, index) => {
            const isActive = step.value === currentStep;
            const isCompleted = index < currentStepIndex;
            const isDisabled = index > currentStepIndex;

            return (
              <div key={step.value} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-colors ${
                      isActive
                        ? 'bg-primary-600 text-white'
                        : isCompleted
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {isCompleted ? '✓' : index + 1}
                  </div>
                  <div
                    className={`text-sm mt-2 font-medium ${
                      isActive ? 'text-primary-600' : isDisabled ? 'text-gray-400' : 'text-gray-700'
                    }`}
                  >
                    {step.label}
                  </div>
                </div>
                {index < STEPS.length - 1 && (
                  <div
                    className={`h-0.5 flex-1 mx-2 ${
                      isCompleted ? 'bg-green-500' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Step Content */}
        <div className="flex-1 overflow-y-auto">
          {currentStep === 'upload' && (
            <FileUploadStep
              onFileUploaded={(file, importId, preview) => {
                setImportState((prev) => ({
                  ...prev,
                  file,
                  importId,
                  preview,
                }));
                handleNext();
              }}
              listId={listId}
            />
          )}

          {currentStep === 'mapping' && importState.preview && importState.importId && (
            <ColumnMappingStep
              preview={importState.preview}
              importId={importState.importId}
              onMappingConfirmed={(mapping) => {
                setImportState((prev) => ({
                  ...prev,
                  mapping,
                }));
                handleNext();
              }}
              onBack={handleBack}
            />
          )}

          {currentStep === 'validation' && importState.importId && (
            <ValidationStep
              importId={importState.importId}
              onStartImport={(validationResults) => {
                setImportState((prev) => ({
                  ...prev,
                  validationResults,
                }));
                handleNext();
              }}
              onBack={handleBack}
            />
          )}

          {currentStep === 'progress' && importState.importId && (
            <ProgressStep
              importId={importState.importId}
              onComplete={handleComplete}
            />
          )}
        </div>

        {/* Navigation (only show for upload step) */}
        {currentStep === 'upload' && (
          <div className="flex justify-between pt-4 border-t">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
