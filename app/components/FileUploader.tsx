import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Form } from '@remix-run/react';

type FileUploaderProps = {
  campaignId: string;
  acceptedFileTypes?: string[];
  maxSize?: number;
};

export default function FileUploader({
  campaignId,
  acceptedFileTypes = ['.csv', '.xls', '.xlsx'],
  maxSize = 5242880, // 5MB
}: FileUploaderProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        setSelectedFile(acceptedFiles[0]);
      }
    },
    []
  );

  const { getRootProps, getInputProps, isDragActive, isDragReject, fileRejections } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    },
    maxSize,
    multiple: false,
  });

  const isFileTooLarge = fileRejections.length > 0 && fileRejections[0].file.size > maxSize;

  const handleSubmit = () => {
    if (selectedFile) {
      setIsUploading(true);
    }
  };

  return (
    <Form 
      method="post" 
      encType="multipart/form-data" 
      action={`/campaigns/${campaignId}/upload`}
      onSubmit={handleSubmit}
    >
      {!selectedFile ? (
        <div
          {...getRootProps()}
          className={`flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md ${
            isDragActive ? 'border-indigo-300 bg-indigo-50' : 'border-gray-300'
          } ${isDragReject || isFileTooLarge ? 'border-red-300 bg-red-50' : ''}`}
        >
          <div className="space-y-1 text-center">
            <input {...getInputProps()} name="files" />
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              stroke="currentColor"
              fill="none"
              viewBox="0 0 48 48"
              aria-hidden="true"
            >
              <path
                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <div className="flex text-sm text-gray-600">
              <label
                htmlFor="file-upload"
                className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500"
              >
                <span>Upload a file</span>
              </label>
              <p className="pl-1">or drag and drop</p>
            </div>
            <p className="text-xs text-gray-500">
              {acceptedFileTypes.join(', ')} up to {Math.round(maxSize / 1024 / 1024)}MB
            </p>
            {fileRejections.length > 0 && (
              <p className="text-red-500 text-xs mt-2">
                {isFileTooLarge
                  ? 'File is too large'
                  : 'File type not accepted, please upload a CSV, XLS, or XLSX file'}
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center p-4 bg-gray-50 rounded-md">
            <svg
              className="h-8 w-8 text-indigo-500 mr-3"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
                clipRule="evenodd"
              />
            </svg>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
              <p className="text-xs text-gray-500">
                {(selectedFile.size / 1024).toFixed(2)} KB
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSelectedFile(null)}
              className="ml-4 text-sm font-medium text-indigo-600 hover:text-indigo-500"
            >
              Change
            </button>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isUploading}
              className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                isUploading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isUploading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Uploading...
                </>
              ) : (
                'Upload File'
              )}
            </button>
          </div>
        </div>
      )}
    </Form>
  );
}
