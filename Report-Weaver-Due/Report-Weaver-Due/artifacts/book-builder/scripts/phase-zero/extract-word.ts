/**
 * Extract plain text from .doc / .docx via word-extractor (no Word install).
 */

import fs from 'fs';
import path from 'path';
import WordExtractor from 'word-extractor';
import type { WordExtractSummary } from './types';

const extractor = new WordExtractor();

export async function extractWordToDir(
  absoluteFilePath: string,
  relativePathForMeta: string,
  outDir: string,
): Promise<WordExtractSummary> {
  fs.mkdirSync(outDir, { recursive: true });

  const doc = await extractor.extract(absoluteFilePath);
  const body = doc.getBody() ?? '';
  const textPath = path.join(outDir, 'extracted.txt');
  fs.writeFileSync(textPath, body, 'utf8');

  const paragraphs = body.split(/\r?\n\r?\n/).filter((p) => p.trim().length > 0);
  const summary: WordExtractSummary = {
    fileName: path.basename(absoluteFilePath),
    relativePath: relativePathForMeta,
    charCount: body.length,
    paragraphCount: paragraphs.length,
  };
  fs.writeFileSync(path.join(outDir, 'word-summary.json'), JSON.stringify(summary, null, 2), 'utf8');
  return summary;
}
