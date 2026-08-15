import archiver from 'archiver';
import { generateCompleteExcel } from '../bridge-excel-generator/index';
import { ProjectInput } from '../bridge-excel-generator/types';
import { generateLandscapeBookPDF } from './landscape-pdf-export';
// import { generateDxf } from '../dxf-module'; // Assuming DXF export exists or we skip if not readily importable

/**
 * Compiles the Unified Project Dossier into a ZIP Stream.
 * Includes:
 * 1. 55-Sheet Excel Workbook
 * 2. Elegant A4 Landscape PDF Book
 * 3. (Optional) DXF Drawing file if available
 */
export async function compileDossierZip(input: ProjectInput): Promise<NodeJS.ReadableStream> {
  const archive = archiver('zip', {
    zlib: { level: 9 } // Sets the compression level.
  });

  // 1. Generate Excel Buffer
  const excelBuffer = await generateCompleteExcel(input);
  archive.append(Buffer.from(excelBuffer as ArrayBuffer), { name: `${input.projectName || 'Bridge'}_Calculations.xlsx` });

  // 2. Generate Elegant Landscape PDF
  const pdfBuffer = await generateLandscapeBookPDF(input);
  archive.append(pdfBuffer, { name: `${input.projectName || 'Bridge'}_Executive_Book.pdf` });

  // 3. (Optional) DXF logic can be injected here. 
  // For now, we package the two primary robust outputs.

  archive.finalize();

  return archive;
}
