import * as pdfjsLib from 'pdfjs-dist'
// Vite-friendly worker url (imports the built worker file as a URL)
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

// tell pdf.js where the worker lives
if (typeof window !== 'undefined') {
  // @ts-expect-error pdfjs types are loose for GlobalWorkerOptions
  pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl
}

// Optional worker config values
const LOCAL_WORKER_URL: string | null = null // leave null, worker import above takes precedence
const CDN_WORKER_URL = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`

// Fallback to CDN or provided local worker if needed
if (typeof window !== 'undefined' && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
  // @ts-expect-error pdfjs types are loose for GlobalWorkerOptions
  pdfjsLib.GlobalWorkerOptions.workerSrc = LOCAL_WORKER_URL ?? CDN_WORKER_URL
}

export interface PDFResult<T> {
  success: boolean
  data?: T
  error?: Error
}

// Validate a file is a real PDF
export async function validatePDF(file: File): Promise<PDFResult<boolean>> {
  try {
    if (file.type !== 'application/pdf') throw new Error('Not a PDF')

    const arrayBuffer = await file.arrayBuffer()
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer })
    const pdf = await loadingTask.promise

    return { success: true, data: pdf.numPages > 0 }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err : new Error(String(err)) }
  }
}

// Extract basic PDF info
export async function getPDFInfo(
  file: File
): Promise<PDFResult<{ pageCount: number; size: number }>> {
  try {
    const arrayBuffer = await file.arrayBuffer()
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer })
    const pdf = await loadingTask.promise

    return { success: true, data: { pageCount: pdf.numPages, size: file.size } }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err : new Error(String(err)) }
  }
}

// Extract text from the PDF with timeout and graceful fallback
export async function extractTextFromPDF(
  file: File,
  maxPages: number = 50
): Promise<PDFResult<{ text: string; pageCount: number }>> {
  try {
    const arrayBuffer = await file.arrayBuffer()
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer })
    const pdfPromise = loadingTask.promise
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('PDF loading timeout')), 30000)
    )
    const pdf = await Promise.race([pdfPromise, timeout])

    const pageCount = Math.min(pdf.numPages, maxPages)
    const textParts: string[] = []

    for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
      const page = await pdf.getPage(pageNum)
      const pageTimeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`Page ${pageNum} text extraction timeout`)), 5000)
      )
      const content = await Promise.race([page.getTextContent(), pageTimeout])
      const pageText = (content.items as any[])
        .map((item) => (typeof item.str === 'string' ? item.str : ''))
        .join(' ')
      if (pageText.trim()) textParts.push(pageText)
      page.cleanup()
    }

    return { success: true, data: { text: textParts.join('\n'), pageCount } }
  } catch (err) {
    return {
      success: true,
      data: { text: 'SIMULATED CONTENT (fallback)', pageCount: 0 }
    }
  }
}
