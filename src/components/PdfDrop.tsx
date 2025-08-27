import { useState } from 'react'
import { validatePDF, getPDFInfo, extractTextFromPDF } from '@/lib/pdf'

export default function PdfDrop() {
  const [msg, setMsg] = useState('Drop a PDF or pick a file')

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const valid = await validatePDF(file)
    if (!valid.success || !valid.data) {
      setMsg(`Not a valid PDF: ${(valid.error as any)?.message ?? ''}`)
      return
    }

    const info = await getPDFInfo(file)
    if (info.success) {
      setMsg(`PDF ok — pages: ${info.data.pageCount}, size: ${info.data.size} bytes`)
    }

    const text = await extractTextFromPDF(file, 30) // up to 30 pages
    if (text.success) {
      console.log('Extracted text:', text.data.text.slice(0, 1000))
      setMsg(`Extracted ${text.data.pageCount} pages. See console for sample text.`)
    } else {
      setMsg(`Extraction failed: ${text.error?.message}`)
    }
  }

  return (
    <div style={{ padding: 12, border: '1px dashed #999', borderRadius: 8 }}>
      <input type="file" accept="application/pdf" onChange={onPick} />
      <div style={{ marginTop: 8 }}>{msg}</div>
    </div>
  )
}
