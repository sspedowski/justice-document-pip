import * as pdfjsLib from 'pdfjs-dist';

// Disable worker for browser compatibility - process PDFs in main thread
pdfjsLib.GlobalWorkerOptions.workerSrc = '';
pdfjsLib.GlobalWorkerOptions.workerPort = null;

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
    
    // Load the PDF document with worker-free configuration
    const loadingTask = pdfjsLib.getDocument({
      data: arrayBuffer,
      useWorkerFetch: false,
      isEvalSupported: false,
      useSystemFonts: true,
      disableAutoFetch: true,
      disableStream: true
    });
    
    const pdf = await loadingTask.promise;
    
    // Get document metadata with error handling
    let metadata: any = { info: {} };
    try {
      metadata = await pdf.getMetadata();
    } catch (metaError) {
      console.warn('Could not extract PDF metadata:', metaError);
    }
    
    const textChunks: string[] = [];
    const pagesToProcess = Math.min(pdf.numPages, maxPages);
    
    // Extract text from each page
    for (let pageNum = 1; pageNum <= pagesToProcess; pageNum++) {
      try {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        
        // Combine text items into a single string for this page
        const pageText = textContent.items
          .map((item: any) => item.str || '')
          .filter(str => str.trim().length > 0)
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
    
    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes('worker')) {
        throw new Error('PDF processing failed: Unable to load PDF worker. The PDF may be corrupted or too complex.');
      } else if (error.message.includes('Invalid PDF')) {
        throw new Error('Invalid PDF file format. Please ensure the file is a valid PDF document.');
      } else if (error.message.includes('password')) {
        throw new Error('This PDF is password protected and cannot be processed.');
      }
    }
    
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
    const loadingTask = pdfjsLib.getDocument({
      data: arrayBuffer,
      useWorkerFetch: false,
      isEvalSupported: false,
      useSystemFonts: true,
      disableAutoFetch: true,
      disableStream: true
    });
    const pdf = await loadingTask.promise;
    
    return {
      pageCount: pdf.numPages,
      size: file.size,
      name: file.name
    };
  } catch (error) {
    throw new Error(`Failed to get PDF info: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}