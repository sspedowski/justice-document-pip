import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Upload, FileText, Warning, CheckCircle, XCircle } from '@phosphor-icons/react'
import { toast } from 'sonner'

interface FileUploadManagerProps {
  onUploadComplete: (files: ProcessedFile[]) => void
}

interface ProcessedFile {
  name: string
  size: number
  type: string
  status: 'pending' | 'processing' | 'complete' | 'error'
  progress: number
  error?: string
  extractedText?: string
  metadata?: any
}

export function FileUploadManager({ onUploadComplete }: FileUploadManagerProps) {
  const [files, setFiles] = useState<ProcessedFile[]>([])
  const [isProcessing, setIsProcessing] = useState(false)

  const handleFileSelection = (selectedFiles: FileList) => {
    const newFiles: ProcessedFile[] = Array.from(selectedFiles).map(file => ({
      name: file.name,
      size: file.size,
      type: file.type,
      status: 'pending',
      progress: 0
    }))

    setFiles(prev => [...prev, ...newFiles])
    processFiles(newFiles, selectedFiles)
  }

  const processFiles = async (fileList: ProcessedFile[], actualFiles: FileList) => {
    setIsProcessing(true)

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i]
      const actualFile = actualFiles[i]

      try {
        // Update status to processing
        setFiles(prev => prev.map(f => 
          f.name === file.name ? { ...f, status: 'processing', progress: 10 } : f
        ))

        // Simulate PDF processing
        await new Promise(resolve => setTimeout(resolve, 500))
        
        setFiles(prev => prev.map(f => 
          f.name === file.name ? { ...f, progress: 30 } : f
        ))

        // Extract text (simulated)
        await new Promise(resolve => setTimeout(resolve, 800))
        
        setFiles(prev => prev.map(f => 
          f.name === file.name ? { ...f, progress: 70 } : f
        ))

        // Complete processing
        await new Promise(resolve => setTimeout(resolve, 300))
        
        setFiles(prev => prev.map(f => 
          f.name === file.name ? { 
            ...f, 
            status: 'complete', 
            progress: 100,
            extractedText: `Sample extracted text from ${file.name}`,
            metadata: {
              pages: Math.floor(Math.random() * 20) + 1,
              words: Math.floor(Math.random() * 5000) + 500
            }
          } : f
        ))

      } catch (error) {
        setFiles(prev => prev.map(f => 
          f.name === file.name ? { 
            ...f, 
            status: 'error', 
            progress: 0,
            error: error instanceof Error ? error.message : 'Processing failed'
          } : f
        ))
      }
    }

    setIsProcessing(false)
    
    const completedFiles = fileList.filter(f => f.status === 'complete')
    if (completedFiles.length > 0) {
      onUploadComplete(completedFiles)
      toast.success(`Successfully processed ${completedFiles.length} files`)
    }
  }

  const clearFiles = () => {
    setFiles([])
  }

  const removeFile = (fileName: string) => {
    setFiles(prev => prev.filter(f => f.name !== fileName))
  }

  const getStatusIcon = (status: ProcessedFile['status']) => {
    switch (status) {
      case 'complete':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'error':
        return <XCircle className="h-4 w-4 text-red-600" />
      case 'processing':
        return <div className="h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      default:
        return <FileText className="h-4 w-4 text-gray-400" />
    }
  }

  const getStatusColor = (status: ProcessedFile['status']) => {
    switch (status) {
      case 'complete':
        return 'text-green-600'
      case 'error':
        return 'text-red-600'
      case 'processing':
        return 'text-blue-600'
      default:
        return 'text-gray-600'
    }
  }

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <Card>
        <CardContent className="p-8">
          <div
            className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors cursor-pointer"
            onClick={() => {
              const input = document.createElement('input')
              input.type = 'file'
              input.multiple = true
              input.accept = '.pdf,application/pdf'
              input.onchange = (e) => {
                const files = (e.target as HTMLInputElement).files
                if (files) {
                  handleFileSelection(files)
                }
              }
              input.click()
            }}
            onDrop={(e) => {
              e.preventDefault()
              const files = e.dataTransfer.files
              if (files) {
                handleFileSelection(files)
              }
            }}
            onDragOver={(e) => e.preventDefault()}
          >
            <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Upload PDF Files</h3>
            <p className="text-gray-600 mb-4">
              Drag and drop files here or click to browse
            </p>
            <Button variant="outline">
              <FileText className="h-4 w-4 mr-2" />
              Select Files
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* File List */}
      {files.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Processing Files ({files.length})</CardTitle>
              <div className="flex gap-2">
                <Badge variant="outline">
                  {files.filter(f => f.status === 'complete').length} Complete
                </Badge>
                <Badge variant="outline">
                  {files.filter(f => f.status === 'error').length} Errors
                </Badge>
                {!isProcessing && (
                  <Button size="sm" variant="outline" onClick={clearFiles}>
                    Clear All
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {files.map((file, index) => (
                <div key={`${file.name}-${index}`} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(file.status)}
                      <div>
                        <div className="font-medium text-sm">{file.name}</div>
                        <div className="text-xs text-gray-500">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant="outline" 
                        className={getStatusColor(file.status)}
                      >
                        {file.status.charAt(0).toUpperCase() + file.status.slice(1)}
                      </Badge>
                      {file.status !== 'processing' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeFile(file.name)}
                        >
                          <XCircle className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  {file.status === 'processing' && (
                    <Progress value={file.progress} className="h-2" />
                  )}
                  
                  {file.error && (
                    <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                      <Warning className="h-4 w-4 inline mr-1" />
                      {file.error}
                    </div>
                  )}
                  
                  {file.status === 'complete' && file.metadata && (
                    <div className="mt-2 text-xs text-gray-600">
                      {file.metadata.pages} pages • {file.metadata.words} words extracted
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Processing Status */}
      {isProcessing && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm">Processing files...</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}