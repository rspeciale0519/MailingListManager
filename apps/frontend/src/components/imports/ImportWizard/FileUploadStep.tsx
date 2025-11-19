import { useState, useRef } from 'react';
import { useImports } from '@/hooks/useImports';
import { Button } from '@/shared/ui/button';
import { toast } from '@/shared/ui/use-toast';
import { Upload, File, X, AlertCircle } from 'lucide-react';
import type { ImportPreview } from '@/types';

interface FileUploadStepProps {
  listId: string;
  onFileUploaded: (file: File, importId: string, preview: ImportPreview) => void;
}

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ACCEPTED_TYPES = [
  'text/csv',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

export function FileUploadStep({ listId, onFileUploaded }: FileUploadStepProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { createImport, isCreating } = useImports();

  const validateFile = (file: File): string | null => {
    if (file.size > MAX_FILE_SIZE) {
      return 'File size exceeds 50MB limit';
    }

    if (!ACCEPTED_TYPES.includes(file.type) && !file.name.match(/\.(csv|xlsx?)$/i)) {
      return 'Only CSV and Excel files are supported';
    }

    return null;
  };

  const handleFileSelect = (selectedFile: File) => {
    const error = validateFile(selectedFile);
    if (error) {
      toast({
        title: 'Invalid file',
        description: error,
        variant: 'destructive',
      });
      return;
    }

    setFile(selectedFile);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFileSelect(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    try {
      await createImport(
        {
          listId,
          file,
          onProgress: (progress) => {
            setUploadProgress(progress);
          },
        },
        {
          onSuccess: (result) => {
            // After upload, fetch preview
            // In a real app, the API would return the preview
            // For now, we'll simulate it
            const preview: ImportPreview = {
              headers: [],
              rows: [],
              suggested_mapping: [],
            };

            onFileUploaded(file, result.id, preview);
          },
        }
      );
    } catch (error) {
      console.error('Upload failed:', error);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-6">
      {!file ? (
        <>
          <div
            className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors cursor-pointer ${
              isDragging
                ? 'border-primary-500 bg-primary-50'
                : 'border-gray-300 hover:border-primary-400'
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-lg font-medium text-gray-700 mb-2">
              Drag & drop your file here
            </p>
            <p className="text-sm text-gray-500 mb-4">or click to browse</p>
            <Button type="button" variant="outline" size="sm">
              Select File
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileInputChange}
            />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Supported formats:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>CSV files (.csv)</li>
                  <li>Excel files (.xlsx, .xls)</li>
                  <li>Maximum file size: 50MB</li>
                </ul>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="space-y-6">
          {/* File Info Card */}
          <div className="border border-gray-200 rounded-lg p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-primary-100 rounded-lg">
                <File className="h-8 w-8 text-primary-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-lg truncate">{file.name}</h3>
                <p className="text-sm text-gray-500 mt-1">
                  {formatFileSize(file.size)} • {file.type || 'Unknown type'}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setFile(null);
                  setUploadProgress(0);
                }}
                disabled={isCreating}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Upload Progress */}
            {isCreating && (
              <div className="mt-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Uploading...</span>
                  <span className="font-medium">{uploadProgress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setFile(null)}
              disabled={isCreating}
            >
              Choose Different File
            </Button>
            <Button onClick={handleUpload} disabled={isCreating}>
              {isCreating ? 'Uploading...' : 'Continue'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
