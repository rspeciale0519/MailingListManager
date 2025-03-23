import * as XLSX from 'xlsx';

export function parseXLSX(buffer: ArrayBuffer): { headers: string[], rows: Record<string, string>[] } {
  const workbook = XLSX.read(buffer, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  
  // Convert to JSON
  const jsonData = XLSX.utils.sheet_to_json<Record<string, string>>(worksheet);
  
  // Extract headers
  const headers = jsonData.length > 0 ? Object.keys(jsonData[0]) : [];
  
  return { headers, rows: jsonData };
}

export function generateXLSX(data: Record<string, string>[], headers: string[]): ArrayBuffer {
  // Ensure all data objects have the same keys in the same order
  const formattedData = data.map(row => {
    const newRow: Record<string, string> = {};
    headers.forEach(header => {
      newRow[header] = row[header] || '';
    });
    return newRow;
  });

  // Create a new workbook and worksheet
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(formattedData);
  
  // Add the worksheet to the workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
  
  // Generate buffer
  return XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });
}
