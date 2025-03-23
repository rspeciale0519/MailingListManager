import { useState, useEffect } from 'react';
import type { SystemHeader } from '~/models/list.server';

type ColumnMapperProps = {
  fileHeaders: string[];
  systemHeaders: SystemHeader[];
  initialMapping?: Record<string, string>;
  onMappingChange: (mapping: Record<string, string>) => void;
};

export default function ColumnMapper({
  fileHeaders,
  systemHeaders,
  initialMapping = {},
  onMappingChange,
}: ColumnMapperProps) {
  const [mapping, setMapping] = useState<Record<string, string>>(initialMapping);

  useEffect(() => {
    // If there's no initial mapping, try to auto-map based on similar names
    if (Object.keys(initialMapping).length === 0) {
      const autoMapping: Record<string, string> = {};
      
      fileHeaders.forEach(fileHeader => {
        const normalizedFileHeader = fileHeader.toLowerCase().trim();
        
        // Try to find a matching system header
        const matchingSystemHeader = systemHeaders.find(sysHeader => {
          const normalizedSysHeader = sysHeader.name.toLowerCase().trim();
          return normalizedFileHeader === normalizedSysHeader ||
                 normalizedFileHeader.includes(normalizedSysHeader) ||
                 normalizedSysHeader.includes(normalizedFileHeader);
        });
        
        if (matchingSystemHeader) {
          autoMapping[fileHeader] = matchingSystemHeader.id;
        }
      });
      
      setMapping(autoMapping);
      onMappingChange(autoMapping);
    }
  }, [fileHeaders, systemHeaders, initialMapping, onMappingChange]);

  const handleMappingChange = (fileHeader: string, systemHeaderId: string) => {
    const newMapping = { ...mapping };
    
    if (systemHeaderId === '') {
      delete newMapping[fileHeader];
    } else {
      newMapping[fileHeader] = systemHeaderId;
    }
    
    setMapping(newMapping);
    onMappingChange(newMapping);
  };

  // Check if required fields are mapped
  const requiredSystemHeaders = systemHeaders.filter(header => header.isRequired);
  const missingRequiredFields = requiredSystemHeaders.filter(header => 
    !Object.values(mapping).includes(header.id)
  );

  return (
    <div className="mt-6">
      <h3 className="text-lg font-medium text-gray-900">Map Your Columns</h3>
      <p className="mt-1 text-sm text-gray-500">
        Match your file columns to our system fields.
      </p>
      
      {missingRequiredFields.length > 0 && (
        <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-sm text-yellow-700">
            <span className="font-medium">Required fields missing: </span>
            {missingRequiredFields.map(field => field.name).join(', ')}
          </p>
        </div>
      )}
      
      <div className="mt-4 border rounded-md overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                File Column
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                System Field
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {fileHeaders.map((fileHeader) => (
              <tr key={fileHeader}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {fileHeader}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <select
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                    value={mapping[fileHeader] || ''}
                    onChange={(e) => handleMappingChange(fileHeader, e.target.value)}
                  >
                    <option value="">-- Do not import --</option>
                    {systemHeaders.map((systemHeader) => (
                      <option 
                        key={systemHeader.id} 
                        value={systemHeader.id}
                      >
                        {systemHeader.name} {systemHeader.isRequired ? '(Required)' : ''}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
