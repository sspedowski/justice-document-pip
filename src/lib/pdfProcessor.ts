import * as pdfjsLib from 'pdfjs-dist';

// Configure worker for pdfjs
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export interface PDFProcessingResult {
  text: string;
  pageCount: number;
  metadata?: {
    title?: string;
    author?: string;
    creator?: string;
    producer?: string;
    creationDate?: Date;
    modificationDate?: Date;
  };
}

/**
 * Extract text content from a PDF file
 * @param file - The PDF file to process
 * @param maxPages - Maximum number of pages to process (default: 50 for performance)
 * @returns Promise containing extracted text and metadata
 */
export async function extractTextFromPDF(file: File, maxPages: number = 50): Promise<PDFProcessingResult> {
  try {
    // Convert file to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    
    // Load the PDF document
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    
    // Get document metadata
    const metadata = await pdf.getMetadata().catch(() => ({ info: {}, metadata: null }));
    
    const textChunks: string[] = [];
    const pagesToProcess = Math.min(pdf.numPages, maxPages);
    
    // Extract text from each page
    for (let pageNum = 1; pageNum <= pagesToProcess; pageNum++) {
      try {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        
        // Combine text items into a single string for this page
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ')
          .trim();
        
        if (pageText) {
          textChunks.push(pageText);
        }
      } catch (pageError) {
        console.warn(`Error processing page ${pageNum}:`, pageError);
        // Continue processing other pages even if one fails
      }
    }
    
    // Clean up and join all text
    const fullText = textChunks
      .join('\n\n')
      .replace(/\s+/g, ' ')
      .trim();
    
    return {
      text: fullText,
      pageCount: pdf.numPages,
      metadata: {
        title: metadata.info?.Title || undefined,
        author: metadata.info?.Author || undefined,
        creator: metadata.info?.Creator || undefined,
        producer: metadata.info?.Producer || undefined,
        creationDate: metadata.info?.CreationDate ? new Date(metadata.info.CreationDate) : undefined,
        modificationDate: metadata.info?.ModDate ? new Date(metadata.info.ModDate) : undefined,
      }
    };
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    throw new Error(`Failed to process PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Validate if a file is a proper PDF
 * @param file - File to validate
 * @returns Promise<boolean> indicating if file is a valid PDF
 */
export async function validatePDF(file: File): Promise<boolean> {
  try {
    if (file.type !== 'application/pdf') {
      return false;
    }
    
    // Try to read the first few bytes to check PDF header
    const chunk = file.slice(0, 8);
    const arrayBuffer = await chunk.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    const header = String.fromCharCode(...uint8Array.slice(0, 4));
    
    return header === '%PDF';
  } catch {
    return false;
  }
}

/**
 * Get basic file information without full processing
 * @param file - PDF file to analyze
 * @returns Promise with basic file info
 */
export async function getPDFInfo(file: File): Promise<{ pageCount: number; size: number; name: string }> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    
    return {
      pageCount: pdf.numPages,
      size: file.size,
      name: file.name
    };
  } catch (error) {
    throw new Error(`Failed to get PDF info: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}