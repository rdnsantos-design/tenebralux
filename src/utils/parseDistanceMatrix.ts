/**
 * Utility to parse the distance matrix Excel file.
 * This is a temporary debug script - logs the structure to console.
 */
import * as XLSX from 'xlsx';

export async function parseDistanceMatrixFromFile(file: File): Promise<void> {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data);
  
  console.log('=== Sheet Names ===');
  console.log(workbook.SheetNames);
  
  workbook.SheetNames.forEach(sheetName => {
    console.log(`\n=== Sheet: ${sheetName} ===`);
    const worksheet = workbook.Sheets[sheetName];
    
    // Get the range
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
    console.log(`Range: ${worksheet['!ref']}`);
    console.log(`Rows: ${range.e.r - range.s.r + 1}, Cols: ${range.e.c - range.s.c + 1}`);
    
    // Get first 10 rows as JSON
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    console.log('First 5 rows:');
    jsonData.slice(0, 5).forEach((row, i) => {
      console.log(`Row ${i}:`, row);
    });
  });
}

export interface DistanceMatrix {
  provinces: string[];
  distances: Map<string, Map<string, number>>;
}

export async function parseDistanceMatrix(file: File): Promise<DistanceMatrix> {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data);
  
  // Find a sheet with "distancia" or "matriz" in name, or use first
  const sheetName = workbook.SheetNames.find(name => 
    name.toLowerCase().includes('distancia') || 
    name.toLowerCase().includes('matriz') ||
    name.toLowerCase().includes('distance')
  ) || workbook.SheetNames[0];
  
  const worksheet = workbook.Sheets[sheetName];
  const jsonData: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  
  // Assume first row has province names (starting from column 1)
  // First column also has province names
  const headerRow = jsonData[0] as string[];
  const provinces: string[] = [];
  
  // Get province names from header (skip first cell which might be empty or a label)
  for (let i = 1; i < headerRow.length; i++) {
    if (headerRow[i] && typeof headerRow[i] === 'string') {
      provinces.push(headerRow[i].trim());
    }
  }
  
  // Build distance map
  const distances = new Map<string, Map<string, number>>();
  
  for (let i = 1; i < jsonData.length; i++) {
    const row = jsonData[i];
    const fromProvince = row[0]?.toString().trim();
    if (!fromProvince) continue;
    
    const fromMap = new Map<string, number>();
    
    for (let j = 1; j < row.length && j <= provinces.length; j++) {
      const distance = parseFloat(row[j]);
      if (!isNaN(distance)) {
        fromMap.set(provinces[j - 1], distance);
      }
    }
    
    distances.set(fromProvince, fromMap);
  }
  
  console.log('Parsed distance matrix:', {
    provinceCount: provinces.length,
    sampleProvinces: provinces.slice(0, 5),
  });
  
  return { provinces, distances };
}
