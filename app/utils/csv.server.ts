import Papa from 'papaparse';

export function parseCSV(csvContent: string): { headers: string[], rows: Record<string, string>[] } {
  const result = Papa.parse(csvContent, {
    header: true,
    skipEmptyLines: true,
  });

  // Convert to the expected format
  const headers = result.meta.fields || [];
  const rows = result.data as Record<string, string>[];

  return { headers, rows };
}

export function generateCSV(data: Record<string, string>[], headers: string[]): string {
  // Ensure all data objects have the same keys in the same order
  const formattedData = data.map(row => {
    const newRow: Record<string, string> = {};
    headers.forEach(header => {
      newRow[header] = row[header] || '';
    });
    return newRow;
  });

  return Papa.unparse(formattedData);
}
