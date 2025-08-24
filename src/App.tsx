import { useState, useEffect } from 'react'
import { useKV } from '@/hooks/useKV'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { FileText, Upload, Scale, Shield, Users, Download, Filter, Search, Eye, Edit, GitBranch } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { extractTextFromPDF, validatePDF, getPDFInfo } from '@/lib/pdfProcessor'
import '@/lib/sparkFallback' // Initialize Spark fallback for environments without Spark runtime

interface Document {
  id: string
  fileName: string
  title: string
  description: string
  category: 'Primary' | 'Supporting' | 'External' | 'No'
  children: string[]
  laws: string[]
  misconduct: Array<{
    law: string
    page: string
    paragraph: string
    notes: string
  }>
  include: 'YES' | 'NO'
  placement: {
    masterFile: boolean
    exhibitBundle: boolean
    oversightPacket: boolean
  }
  uploadedAt: string
  textContent?: string
}

interface ProcessingDocument {
  fileName: string
  progress: number
  status: 'validating' | 'uploading' | 'extracting' | 'analyzing' | 'complete' | 'error'
  error?: string
}

const CHILDREN_NAMES = ['Jace', 'Josh', 'Joshua', 'Nicholas', 'John', 'Peyton', 'Owen']

const LAWS = [
  { name: 'Brady v. Maryland', keywords: ['Brady', 'exculpatory', 'suppressed evidence', 'withheld'] },
  { name: 'Due Process (14th Amendment)', keywords: ['due process', 'denied hearing', 'procedural', 'fundamental fairness'] },
  { name: 'CAPTA', keywords: ['CAPTA', 'child abuse prevention', 'failure to investigate'] },
  { name: 'Perjury', keywords: ['perjury', 'false statement', 'sworn', 'oath'] },
  { name: 'Evidence Tampering', keywords: ['tamper', 'altered', 'fabricated', 'suppressed', 'omitted'] }
]

// Load processed documents from GitHub Actions pipeline
async function loadProcessedDocuments(): Promise<Document[]> {
  try {
    // Try relative path first
    let response = await fetch('/app/data/justice-documents.json')
    
    // If that fails, try absolute path from public folder
    if (!response.ok) {
      response = await fetch('./app/data/justice-documents.json')
    }
    
    if (!response.ok) {
      console.log('No processed documents file found - this is normal for new installations')
      return []
    }
    
    const data = await response.json()
    return Array.isArray(data) ? data : []
  } catch (error) {
    console.log('No processed documents found yet, using empty array:', error)
    return []
  }
}

function App() {
  const [documents, setDocuments] = useKV<Document[]>('justice-documents', [])
  const [processedDocs, setProcessedDocs] = useState<Document[]>([])
  const [processing, setProcessing] = useState<ProcessingDocument[]>([])
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null)
  const [editingDoc, setEditingDoc] = useState<Document | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [activeTab, setActiveTab] = useState('dashboard')
  const [isLoadingProcessed, setIsLoadingProcessed] = useState(true)

  // Load processed documents from GitHub Actions pipeline on component mount
  useEffect(() => {
    const loadData = async () => {
      setIsLoadingProcessed(true)
      try {
        const processed = await loadProcessedDocuments()
        setProcessedDocs(processed)
        
        // Merge with locally uploaded documents, avoiding duplicates
        const existingFileNames = new Set(processed.map(doc => doc.fileName))
        const localOnly = documents.filter(doc => !existingFileNames.has(doc.fileName))
        
        if (processed.length > 0) {
          toast.success(`Loaded ${processed.length} processed documents from pipeline`)
        } else if (localOnly.length > 0) {
          toast.info(`Found ${localOnly.length} local documents. Add PDFs to input/ directory to use pipeline processing.`)
        } else {
          console.log('No documents found - ready to upload new PDFs')
        }
      } catch (error) {
        console.error('Error loading processed documents:', error)
        // Don't show error toast - this is expected for new installations
      } finally {
        setIsLoadingProcessed(false)
      }
    }
    
    loadData()
  }, [])

  // Combine processed and local documents
  const allDocuments = [...processedDocs, ...documents.filter(localDoc => 
    !processedDocs.some(processedDoc => processedDoc.fileName === localDoc.fileName)
  )]

  const filteredDocuments = allDocuments.filter(doc => {
    const matchesSearch = searchTerm === '' || 
      doc.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.children.some(child => child.toLowerCase().includes(searchTerm.toLowerCase())) ||
      doc.laws.some(law => law.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesCategory = categoryFilter === 'all' || doc.category === categoryFilter
    
    return matchesSearch && matchesCategory
  })

  const handleFileUpload = async (files: FileList) => {
    const fileArray = Array.from(files)
    
    if (fileArray.length === 0) {
      toast.error('Please select files to upload')
      return
    }

    // Validate all files first
    const validationResults = await Promise.all(
      fileArray.map(async (file) => ({
        file,
        isValid: await validatePDF(file),
        isPDF: file.type === 'application/pdf'
      }))
    )

    const invalidFiles = validationResults.filter(r => !r.isValid)
    const validFiles = validationResults.filter(r => r.isValid).map(r => r.file)

    if (invalidFiles.length > 0) {
      const invalidNames = invalidFiles.map(f => f.file.name).join(', ')
      toast.error(`Invalid PDF files: ${invalidNames}`)
    }

    if (validFiles.length === 0) {
      toast.error('No valid PDF files found')
      return
    }

    // Process valid files
    for (const file of validFiles) {
      const processingDoc: ProcessingDocument = {
        fileName: file.name,
        progress: 0,
        status: 'validating'
      }
      
      setProcessing(prev => [...prev, processingDoc])
      
      // Process each file (error handling is done within processRealPDF)
      await processRealPDF(file, processingDoc)
    }
  }

  const processRealPDF = async (file: File, processingDoc: ProcessingDocument) => {
    const updateProgress = (progress: number, status: ProcessingDocument['status']) => {
      setProcessing(prev => prev.map(p => 
        p.fileName === file.name 
          ? { ...p, progress, status }
          : p
      ))
    }

    try {
      // Step 1: Validate (already done, but update UI)
      updateProgress(10, 'validating')
      await new Promise(resolve => setTimeout(resolve, 200))

      // Step 2: Extract text from PDF
      updateProgress(25, 'extracting')
      const pdfResult = await extractTextFromPDF(file, 50) // Limit to 50 pages for performance
      
      updateProgress(70, 'analyzing')
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Step 3: Analyze content for children and laws
      const detectedChildren = CHILDREN_NAMES.filter(name => 
        pdfResult.text.toLowerCase().includes(name.toLowerCase())
      )
      
      const detectedLaws = LAWS.filter(law =>
        law.keywords.some(keyword => 
          pdfResult.text.toLowerCase().includes(keyword.toLowerCase())
        )
      ).map(law => law.name)

      const category = guessCategory(pdfResult.text)
      
      // Create a more meaningful description from extracted text
      const description = createDescription(pdfResult.text, pdfResult.metadata)
      
      const newDoc: Document = {
        id: Date.now().toString(),
        fileName: file.name,
        title: pdfResult.metadata?.title || file.name.replace('.pdf', ''),
        description,
        category,
        children: detectedChildren,
        laws: detectedLaws,
        misconduct: detectedLaws.map(law => ({
          law,
          page: '',
          paragraph: '',
          notes: ''
        })),
        include: category === 'No' ? 'NO' : 'YES',
        placement: {
          masterFile: category !== 'No',
          exhibitBundle: ['Primary', 'Supporting'].includes(category),
          oversightPacket: ['Primary', 'Supporting'].includes(category)
        },
        uploadedAt: new Date().toISOString(),
        textContent: pdfResult.text.substring(0, 10000) // Store first 10k chars for search
      }

      updateProgress(100, 'complete')
      
      setDocuments(prev => [...prev, newDoc])
      
      setTimeout(() => {
        setProcessing(prev => prev.filter(p => p.fileName !== file.name))
      }, 2000)

      toast.success(`Successfully processed ${file.name} (${pdfResult.pageCount} pages)`)
    } catch (error) {
      console.error('Processing error:', error)
      updateProgress(0, 'error')
      setProcessing(prev => prev.map(p => 
        p.fileName === file.name 
          ? { 
              ...p, 
              status: 'error', 
              progress: 0,
              error: error instanceof Error ? error.message : 'Unknown error'
            }
          : p
      ))
      toast.error(`Failed to process ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const createDescription = (text: string, metadata?: any): string => {
    // Clean and truncate text for description
    const cleanText = text.replace(/\s+/g, ' ').trim()
    
    // Try to find a meaningful first sentence or paragraph
    const sentences = cleanText.split(/[.!?]+/).filter(s => s.trim().length > 20)
    
    if (sentences.length > 0) {
      let description = sentences[0].trim()
      if (description.length < 100 && sentences.length > 1) {
        description += '. ' + sentences[1].trim()
      }
      
      // Add metadata context if available
      if (metadata?.author) {
        description = `Document by ${metadata.author}. ${description}`
      }
      
      return description.length > 500 
        ? description.substring(0, 500) + '...'
        : description
    }
    
    // Fallback to first 300 characters
    return cleanText.length > 300 
      ? cleanText.substring(0, 300) + '...'
      : cleanText || 'No readable text content found'
  }

  const guessCategory = (text: string): Document['category'] => {
    const lowerText = text.toLowerCase()
    
    // Primary evidence indicators
    if (
      lowerText.includes('nurse exam') || 
      lowerText.includes('forensic') || 
      lowerText.includes('police report') ||
      lowerText.includes('investigation report') ||
      lowerText.includes('medical exam') ||
      lowerText.includes('child protective') ||
      lowerText.includes('abuse allegation') ||
      lowerText.includes('witness statement')
    ) {
      return 'Primary'
    }
    
    // Skip these documents
    if (
      lowerText.includes('notice of hearing') || 
      lowerText.includes('scheduling') ||
      lowerText.includes('calendar notice') ||
      lowerText.includes('administrative notice') ||
      (lowerText.includes('notice') && lowerText.length < 500) // Short notices
    ) {
      return 'No'
    }
    
    // External documents
    if (
      lowerText.includes('newspaper') ||
      lowerText.includes('news article') ||
      lowerText.includes('media report') ||
      lowerText.includes('press release')
    ) {
      return 'External'
    }
    
    // Default to supporting for everything else
    return 'Supporting'
  }

  const handleEditDocument = (doc: Document) => {
    setEditingDoc({ ...doc })
  }

  const saveEditedDocument = () => {
    if (!editingDoc) return
    
    // Check if this is a processed document (from GitHub Actions) or local document
    const isProcessedDoc = processedDocs.some(doc => doc.id === editingDoc.id)
    
    if (isProcessedDoc) {
      // For processed documents, only update local state (changes won't persist across refreshes)
      setProcessedDocs(prev => prev.map(doc => 
        doc.id === editingDoc.id ? editingDoc : doc
      ))
      toast.success('Document updated (local changes only - use GitHub repository for permanent changes)')
    } else {
      // For local documents, update persistent storage
      setDocuments(prev => prev.map(doc => 
        doc.id === editingDoc.id ? editingDoc : doc
      ))
      toast.success('Document updated successfully')
    }
    
    setEditingDoc(null)
  }

  const exportToCSV = () => {
    const headers = [
      'File Name', 'Category', 'Children', 'Laws', 'Misconduct', 
      'Include', 'Master File', 'Exhibit Bundle', 'Oversight Packet', 
      'Title', 'Description'
    ]
    
    const rows = allDocuments.map(doc => [
      doc.fileName,
      doc.category,
      doc.children.join(', '),
      doc.laws.join(', '),
      doc.misconduct.map(m => `${m.law} p${m.page}/${m.paragraph}`).join('; '),
      doc.include,
      doc.placement.masterFile.toString(),
      doc.placement.exhibitBundle.toString(),
      doc.placement.oversightPacket.toString(),
      doc.title,
      doc.description
    ])
    
    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'MasterReview_INDEX.csv'
    a.click()
    URL.revokeObjectURL(url)
    
    toast.success('CSV exported successfully')
  }

  const generateOversightPackets = () => {
    const eligibleDocs = allDocuments.filter(doc => doc.placement.oversightPacket)
    if (eligibleDocs.length === 0) {
      toast.error('No documents eligible for oversight packets')
      return
    }
    
    toast.success(`${eligibleDocs.length} documents ready for oversight packets. Use GitHub Actions to generate PDFs.`)
  }

  const refreshProcessedData = async () => {
    setIsLoadingProcessed(true)
    try {
      const processed = await loadProcessedDocuments()
      setProcessedDocs(processed)
      toast.success(`Refreshed: Found ${processed.length} processed documents`)
    } catch (error) {
      toast.error('Failed to refresh processed documents')
    } finally {
      setIsLoadingProcessed(false)
    }
  }

  const CategoryBadge = ({ category }: { category: Document['category'] }) => {
    const colors = {
      Primary: 'bg-red-100 text-red-800',
      Supporting: 'bg-blue-100 text-blue-800',
      External: 'bg-green-100 text-green-800',
      No: 'bg-gray-100 text-gray-800'
    }
    return <Badge className={colors[category]}>{category}</Badge>
  }

  return (
    <div id="spark-app" className="min-h-screen bg-background">
      <div className="border-b border-border bg-card">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Scale className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold text-foreground">Justice Document Manager</h1>
                <p className="text-sm text-muted-foreground">Contact & Action Book — Master File System</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={refreshProcessedData} variant="outline" size="sm" disabled={isLoadingProcessed}>
                <GitBranch className="h-4 w-4 mr-2" />
                {isLoadingProcessed ? 'Loading...' : 'Refresh Data'}
              </Button>
              <Button onClick={exportToCSV} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
              <Button onClick={generateOversightPackets} size="sm">
                <Shield className="h-4 w-4 mr-2" />
                Generate Packets
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="dashboard">Document Dashboard</TabsTrigger>
            <TabsTrigger value="upload">Upload & Process</TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GitBranch className="h-5 w-5" />
                  GitHub Actions Pipeline
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-muted/50 rounded-lg p-4">
                  <h4 className="font-semibold mb-2">Automated Processing</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    This system uses GitHub Actions to automatically process PDF documents. To add new documents:
                  </p>
                  <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                    <li>Add PDF files to the <code className="bg-background px-1 rounded">input/</code> directory in your repository</li>
                    <li>Commit and push changes to the main branch</li>
                    <li>GitHub Actions will automatically extract text, classify documents, and generate oversight packets</li>
                    <li>Use the "Refresh Data" button above to load newly processed documents</li>
                  </ol>
                  {processedDocs.length > 0 && (
                    <div className="mt-3 text-sm text-green-700 bg-green-50 px-3 py-2 rounded">
                      ✓ Found {processedDocs.length} documents processed by the pipeline
                    </div>
                  )}
                  {processedDocs.length === 0 && (
                    <div className="mt-3 text-sm text-blue-700 bg-blue-50 px-3 py-2 rounded">
                      ℹ️ No pipeline documents found. Upload PDFs to input/ directory to enable automated processing.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Local PDF Upload (Development)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div
                  className="border-2 border-dashed border-border rounded-lg p-12 text-center hover:border-primary/50 transition-colors cursor-pointer"
                  onDrop={(e) => {
                    e.preventDefault()
                    handleFileUpload(e.dataTransfer.files)
                  }}
                  onDragOver={(e) => e.preventDefault()}
                  onDragEnter={(e) => e.preventDefault()}
                  onClick={() => {
                    const input = document.createElement('input')
                    input.type = 'file'
                    input.multiple = true
                    input.accept = '.pdf,application/pdf'
                    input.onchange = (e) => {
                      const files = (e.target as HTMLInputElement).files
                      if (files) handleFileUpload(files)
                    }
                    input.click()
                  }}
                >
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Drop PDF files here or click to browse</h3>
                  <p className="text-muted-foreground mb-2">Supports multiple file upload</p>
                  <p className="text-xs text-muted-foreground">
                    Files will be processed locally in your browser - no data is sent to external servers
                  </p>
                </div>

                {processing.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-semibold">Processing Documents</h4>
                    {processing.map((proc, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="truncate max-w-xs">{proc.fileName}</span>
                          <span className={`capitalize ${proc.status === 'error' ? 'text-destructive' : ''}`}>
                            {proc.status === 'error' && proc.error ? `Error: ${proc.error}` : proc.status}
                          </span>
                        </div>
                        <Progress 
                          value={proc.progress} 
                          className={`h-2 ${proc.status === 'error' ? 'bg-destructive/20' : ''}`} 
                        />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="dashboard" className="space-y-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search documents..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-48">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="Primary">Primary</SelectItem>
                  <SelectItem value="Supporting">Supporting</SelectItem>
                  <SelectItem value="External">External</SelectItem>
                  <SelectItem value="No">No</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredDocuments.map((doc) => (
                <Card key={doc.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-sm font-medium truncate">{doc.title}</CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          <CategoryBadge category={doc.category} />
                          {processedDocs.some(p => p.id === doc.id) && (
                            <Badge variant="outline" className="text-xs">
                              <GitBranch className="h-3 w-3 mr-1" />
                              Pipeline
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-xs text-muted-foreground overflow-hidden" style={{
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical'
                    }}>{doc.description}</p>
                    
                    {doc.children.length > 0 && (
                      <div className="flex items-center gap-1 flex-wrap">
                        <Users className="h-3 w-3 text-muted-foreground" />
                        {doc.children.map((child, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">{child}</Badge>
                        ))}
                      </div>
                    )}
                    
                    {doc.laws.length > 0 && (
                      <div className="flex items-center gap-1 flex-wrap">
                        <Scale className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">{doc.laws.length} law(s)</span>
                      </div>
                    )}
                    
                    <div className="flex justify-between items-center pt-2">
                      <Badge variant={doc.include === 'YES' ? 'default' : 'secondary'}>
                        {doc.include}
                      </Badge>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setSelectedDoc(doc)}
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEditDocument(doc)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredDocuments.length === 0 && !isLoadingProcessed && (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No documents found</h3>
                <p className="text-muted-foreground">
                  {allDocuments.length === 0 
                    ? "Add PDF documents to the input/ directory and push to trigger the pipeline, or upload documents locally for testing"
                    : "Try adjusting your search or filter criteria"
                  }
                </p>
              </div>
            )}

            {isLoadingProcessed && (
              <div className="text-center py-12">
                <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading processed documents...</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Document Detail Dialog */}
      <Dialog open={!!selectedDoc} onOpenChange={() => setSelectedDoc(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedDoc?.title}</DialogTitle>
          </DialogHeader>
          {selectedDoc && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Document Details</h4>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-medium">File:</span> {selectedDoc.fileName}</div>
                    <div><span className="font-medium">Category:</span> <CategoryBadge category={selectedDoc.category} /></div>
                    <div><span className="font-medium">Include:</span> <Badge variant={selectedDoc.include === 'YES' ? 'default' : 'secondary'}>{selectedDoc.include}</Badge></div>
                    <div><span className="font-medium">Uploaded:</span> {new Date(selectedDoc.uploadedAt).toLocaleDateString()}</div>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Placement Rules</h4>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-medium">Master File:</span> {selectedDoc.placement.masterFile ? '✓' : '✗'}</div>
                    <div><span className="font-medium">Exhibit Bundle:</span> {selectedDoc.placement.exhibitBundle ? '✓' : '✗'}</div>
                    <div><span className="font-medium">Oversight Packet:</span> {selectedDoc.placement.oversightPacket ? '✓' : '✗'}</div>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Children Identified</h4>
                <div className="flex gap-2 flex-wrap">
                  {selectedDoc.children.length > 0 
                    ? selectedDoc.children.map((child, idx) => (
                        <Badge key={idx} variant="secondary">{child}</Badge>
                      ))
                    : <span className="text-muted-foreground text-sm">None identified</span>
                  }
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Laws & Regulations</h4>
                <div className="flex gap-2 flex-wrap">
                  {selectedDoc.laws.length > 0 
                    ? selectedDoc.laws.map((law, idx) => (
                        <Badge key={idx} variant="outline">{law}</Badge>
                      ))
                    : <span className="text-muted-foreground text-sm">None identified</span>
                  }
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Description</h4>
                <p className="text-sm text-muted-foreground">{selectedDoc.description}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Document Dialog */}
      <Dialog open={!!editingDoc} onOpenChange={() => setEditingDoc(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Document</DialogTitle>
          </DialogHeader>
          {editingDoc && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Title</label>
                <Input
                  value={editingDoc.title}
                  onChange={(e) => setEditingDoc({...editingDoc, title: e.target.value})}
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Category</label>
                <Select
                  value={editingDoc.category}
                  onValueChange={(value: Document['category']) => 
                    setEditingDoc({...editingDoc, category: value})
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Primary">Primary</SelectItem>
                    <SelectItem value="Supporting">Supporting</SelectItem>
                    <SelectItem value="External">External</SelectItem>
                    <SelectItem value="No">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium">Include</label>
                <Select
                  value={editingDoc.include}
                  onValueChange={(value: 'YES' | 'NO') => 
                    setEditingDoc({...editingDoc, include: value})
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="YES">YES</SelectItem>
                    <SelectItem value="NO">NO</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  value={editingDoc.description}
                  onChange={(e) => setEditingDoc({...editingDoc, description: e.target.value})}
                  rows={4}
                />
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditingDoc(null)}>
                  Cancel
                </Button>
                <Button onClick={saveEditedDocument}>
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default App