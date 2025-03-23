import { useState } from 'react';
import type { FilterCondition } from '~/models/segment.server';

type SegmentBuilderProps = {
  availableFields: string[];
  initialConditions?: FilterCondition[];
  onConditionsChange: (conditions: FilterCondition[]) => void;
};

export default function SegmentBuilder({
  availableFields,
  initialConditions = [],
  onConditionsChange,
}: SegmentBuilderProps) {
  const [conditions, setConditions] = useState<FilterCondition[]>(initialConditions);

  const operators = [
    { value: 'equals', label: 'Equals' },
    { value: 'notEquals', label: 'Not Equals' },
    { value: 'contains', label: 'Contains' },
    { value: 'notContains', label: 'Not Contains' },
    { value: 'startsWith', label: 'Starts With' },
    { value: 'endsWith', label: 'Ends With' },
  ];

  const addCondition = () => {
    if (availableFields.length === 0) return;
    
    const newCondition: FilterCondition = {
      field: availableFields[0],
      operator: 'equals',
      value: '',
    };
    
    const updatedConditions = [...conditions, newCondition];
    setConditions(updatedConditions);
    onConditionsChange(updatedConditions);
  };

  const removeCondition = (index: number) => {
    const updatedConditions = conditions.filter((_, i) => i !== index);
    setConditions(updatedConditions);
    onConditionsChange(updatedConditions);
  };

  const updateCondition = (index: number, field: keyof FilterCondition, value: string) => {
    const updatedConditions = [...conditions];
    updatedConditions[index] = {
      ...updatedConditions[index],
      [field]: value,
    };
    setConditions(updatedConditions);
    onConditionsChange(updatedConditions);
  };

  return (
    <div className="mt-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">Segment Conditions</h3>
        <button
          type="button"
          onClick={addCondition}
          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <svg className="-ml-0.5 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          Add Condition
        </button>
      </div>
      
      {conditions.length === 0 ? (
        <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-md text-center">
          <p className="text-gray-500">No conditions added yet. Add a condition to filter your records.</p>
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          {conditions.map((condition, index) => (
            <div key={index} className="flex items-center space-x-4">
              <div className="w-1/3">
                <select
                  value={condition.field}
                  onChange={(e) => updateCondition(index, 'field', e.target.value)}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                >
                  {availableFields.map((field) => (
                    <option key={field} value={field}>
                      {field}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="w-1/3">
                <select
                  value={condition.operator}
                  onChange={(e) => updateCondition(index, 'operator', e.target.value as any)}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                >
                  {operators.map((op) => (
                    <option key={op.value} value={op.value}>
                      {op.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="flex-1">
                <input
                  type="text"
                  value={condition.value}
                  onChange={(e) => updateCondition(index, 'value', e.target.value)}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Value"
                />
              </div>
              
              <div>
                <button
                  type="button"
                  onClick={() => removeCondition(index)}
                  className="inline-flex items-center p-1.5 border border-transparent rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
