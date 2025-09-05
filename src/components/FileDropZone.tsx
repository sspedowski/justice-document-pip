import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileText, Upload, Download, Warning } from '@phosphor-icons/react'
import { toast } from 'sonner'

interface FileDropZoneProps {
  maxFiles?: number
  onFilesUploaded: (files: FileList) => void
}

export function FileDropZone({ maxFiles = 10, onFilesUploaded }: FileDropZoneProps) {
  const [isDragging, setIsDragging] = useState(false)

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    const files = e.dataTransfer.files
    if (files.length > maxFiles) {
      toast.error(`Too many files! Maximum ${maxFiles} files allowed.`)
      return
    }
    
    onFilesUploaded(files)
  }

  const handleFileSelect = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.multiple = true
    input.accept = '.pdf'
    input.onchange = (e) => {
      const files = (e.target as HTMLInputElement).files
      if (files && files.length > 0) {
        if (files.length > maxFiles) {
          toast.error(`Too many files! Maximum ${maxFiles} files allowed.`)
          return
        }
        onFilesUploaded(files)
      }
    }
    input.click()
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Bulk Document Upload
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div
          className={`border-2 border-dashed rounded-lg p-12 text-center transition-all cursor-pointer
            ${isDragging 
              ? 'border-primary bg-primary/5 scale-[1.02]' 
              : 'border-muted-foreground/25 hover:border-primary hover:bg-primary/5'
            }`}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onDragEnter={(e) => {
            e.preventDefault()
            setIsDragging(true)
          }}
          onDragLeave={(e) => {
            e.preventDefault()
            setIsDragging(false)
          }}
          onClick={handleFileSelect}
        >
          <div className="flex flex-col items-center space-y-4">
            <div className="p-4 bg-primary/10 rounded-full">
              {isDragging ? (
                <Download size={48} className="text-primary animate-bounce" />
              ) : (
                <FileText size={48} className="text-primary" />
              )}
            </div>
            
            <div>
              <h3 className="text-xl font-bold mb-2 text-primary">
                {isDragging ? 'Drop Files Here!' : 'Upload PDF Documents'}
              </h3>
              <p className="text-muted-foreground mb-2">
                Drag and drop multiple files or click to browse
              </p>
              <p className="text-sm text-muted-foreground">
                Supports: PDF files • Up to {maxFiles} files at once
              </p>
            </div>
            
            <div className="text-xs text-muted-foreground bg-muted/50 rounded px-3 py-2">
              <div className="flex items-center gap-2 mb-1">
                <Warning className="h-3 w-3" />
                <strong>Processing includes:</strong>
              </div>
              <div className="text-left space-y-1">
                <div>• Text extraction from PDF files</div>
                <div>• Automatic content analysis and classification</div>
                <div>• Detection of children names and legal violations</div>
                <div>• Duplicate detection and prevention</div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}