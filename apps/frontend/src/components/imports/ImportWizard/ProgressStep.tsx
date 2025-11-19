import { useEffect, useState } from 'react';
import { useImport } from '@/hooks/useImports';
import { useImportProgress } from '@/hooks/useWebSocket';
import { Button } from '@/shared/ui/button';
import { Progress } from '@/shared/ui/progress';
import {
  CheckCircle,
  XCircle,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';

interface ProgressStepProps {
  importId: string;
  onComplete: () => void;
}

export function ProgressStep({ importId, onComplete }: ProgressStepProps) {
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const { import: importData } = useImport(importId);
  const progress = useImportProgress(importId);

  const status = importData?.status || 'processing';
  const totalRows = importData?.total_rows || 0;
  const processedRows = importData?.processed_rows || progress?.processed || 0;
  const validRows = importData?.valid_rows || 0;
  const invalidRows = importData?.invalid_rows || 0;
  const progressPercent = importData?.progress?.percent || 0;
  const currentStage = importData?.progress?.stage || 'Starting...';
  const etaSeconds = importData?.progress?.eta_seconds;

  const isComplete = status === 'complete';
  const isFailed = status === 'failed';
  const isProcessing = status === 'processing';

  useEffect(() => {
    if (isComplete) {
      // Auto-close after a delay when complete
      const timer = setTimeout(() => {
        onComplete();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isComplete, onComplete]);

  const formatETA = (seconds?: number): string => {
    if (!seconds) return 'Calculating...';
    if (seconds < 60) return `${Math.round(seconds)}s`;
    if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
    return `${Math.round(seconds / 3600)}h`;
  };

  const handleCancel = () => {
    // TODO: Implement cancel import
    setShowCancelDialog(false);
  };

  return (
    <>
      <div className="space-y-6">
        {/* Status Header */}
        <div className="text-center">
          {isProcessing && (
            <>
              <Loader2 className="mx-auto h-16 w-16 text-primary-600 animate-spin mb-4" />
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Importing Contacts</h3>
              <p className="text-gray-600">{currentStage}</p>
            </>
          )}

          {isComplete && (
            <>
              <CheckCircle className="mx-auto h-16 w-16 text-green-600 mb-4" />
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Import Complete!</h3>
              <p className="text-gray-600">
                Successfully imported {validRows} contact{validRows !== 1 ? 's' : ''}
              </p>
            </>
          )}

          {isFailed && (
            <>
              <XCircle className="mx-auto h-16 w-16 text-red-600 mb-4" />
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Import Failed</h3>
              <p className="text-gray-600">
                An error occurred while importing your contacts
              </p>
            </>
          )}
        </div>

        {/* Progress Bar */}
        {isProcessing && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Progress</span>
              <span className="font-medium">{progressPercent}%</span>
            </div>
            <Progress value={progressPercent} className="h-3" />
            {etaSeconds && (
              <div className="text-sm text-gray-500 text-center">
                Estimated time remaining: {formatETA(etaSeconds)}
              </div>
            )}
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="text-sm text-gray-600 mb-1">Processed</div>
            <div className="text-2xl font-bold text-gray-900">
              {processedRows.toLocaleString()}
              <span className="text-sm font-normal text-gray-500">
                {' '}/ {totalRows.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
            <div className="text-sm text-green-600 mb-1">Success</div>
            <div className="text-2xl font-bold text-green-900">
              {validRows.toLocaleString()}
            </div>
          </div>

          <div className="bg-red-50 rounded-lg p-4 border border-red-200">
            <div className="text-sm text-red-600 mb-1">Errors</div>
            <div className="text-2xl font-bold text-red-900">
              {invalidRows.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Current Operation */}
        {isProcessing && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 text-blue-600 animate-spin flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <p className="font-medium">{currentStage}</p>
                <p className="text-blue-600 mt-1">
                  Processing row {processedRows.toLocaleString()} of {totalRows.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Completion Summary */}
        {isComplete && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-green-800">
                <p className="font-medium mb-1">Import completed successfully!</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Total contacts imported: {validRows.toLocaleString()}</li>
                  {invalidRows > 0 && (
                    <li>Rows skipped due to errors: {invalidRows.toLocaleString()}</li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Error Details */}
        {isFailed && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-red-800">
                <p className="font-medium mb-1">Import failed</p>
                <p>Please try again or contact support if the issue persists.</p>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-between pt-4 border-t">
          {isProcessing ? (
            <>
              <div></div>
              <Button
                variant="destructive"
                onClick={() => setShowCancelDialog(true)}
              >
                Cancel Import
              </Button>
            </>
          ) : (
            <>
              <div></div>
              <Button onClick={onComplete}>
                {isComplete ? 'Done' : 'Close'}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Cancel Confirmation Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Import</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this import? Any contacts that have already been
              imported will remain in your list.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCancelDialog(false)}>
              Continue Import
            </Button>
            <Button variant="destructive" onClick={handleCancel}>
              Cancel Import
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
