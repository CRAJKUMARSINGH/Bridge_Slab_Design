/**
 * Minimal ambient type surface for `word-extractor@1.0.4`, which ships no declaration file
 * (there is no `@types/word-extractor` either). Only the members extract-word.ts consumes are
 * declared, so the import type-checks under `strict` instead of silently becoming `any`.
 */
declare module 'word-extractor' {
  interface WordDocument {
    getBody(): string;
    getFootnotes(): string;
    getEndnotes(): string;
    getHeaders(): string;
    getFooters(): string;
  }

  class WordExtractor {
    /** Parses a .doc/.docx at `source` (a path or a Buffer) and returns the extracted document. */
    extract(source: string | Buffer): Promise<WordDocument>;
  }

  export = WordExtractor;
}
