import { useState, useEffect, useMemo } from 'react'
import { useKV } from '@github/spark/hooks'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { FileText, Upload, Scale, Shield, Users, Download, Filter, Search, Eye, Edit, GitBranch, MagnifyingGlass, TextT, X, Clock, User, FileArrowUp, ChartLine, GitCompare } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { extractTextFromPDF, validatePDF, getPDFInfo } from '@/lib/pdfProcessor'
import { ReportGenerator } from '@/components/ReportGenerator'
import { DocumentComparison } from '@/components/DocumentComparison'
import '@/lib/sparkFallback' // Initialize Spark fallback for environments without Spark runtime

interface DocumentVersion {
  id: string
  documentId: string
  version: number
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
  changedBy: string
  changedAt: string
  changeNotes?: string
  changeType: 'created' | 'edited' | 'imported'
}

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
  currentVersion: number
  lastModified: string
  lastModifiedBy: string
}

interface ProcessingDocument {
  fileName: string
  progress: number
  status: 'validating' | 'uploading' | 'extracting' | 'analyzing' | 'complete' | 'error'
  error?: string
}

interface SearchResult {
  docId: string
  matches: Array<{
    text: string
    context: string
    position: number
  }>
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
    const documents = Array.isArray(data) ? data : []
    
    // Ensure all documents have version information
    return documents.map(doc => ({
      ...doc,
      currentVersion: doc.currentVersion || 1,
      lastModified: doc.lastModified || doc.uploadedAt || new Date().toISOString(),
      lastModifiedBy: doc.lastModifiedBy || 'Pipeline Import'
    }))
  } catch (error) {
    console.log('No processed documents found yet, using empty array:', error)
    return []
  }
}

function App() {
  const [documents, setDocuments] = useKV<Document[]>('justice-documents', [])
  const [documentVersions, setDocumentVersions] = useKV<DocumentVersion[]>('document-versions', [])
  const [processedDocs, setProcessedDocs] = useState<Document[]>([])
  const [processing, setProcessing] = useState<ProcessingDocument[]>([])
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null)
  const [editingDoc, setEditingDoc] = useState<Document | null>(null)
  const [viewingVersionHistory, setViewingVersionHistory] = useState<Document | null>(null)
  const [comparingVersions, setComparingVersions] = useState<Document | null>(null)
  const [changeNotes, setChangeNotes] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [contentSearchTerm, setContentSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false)
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [activeTab, setActiveTab] = useState('dashboard')
  const [documentSearchTerm, setDocumentSearchTerm] = useState('')
  const [isLoadingProcessed, setIsLoadingProcessed] = useState(true)

  // Load processed documents from GitHub Actions pipeline on component mount
  useEffect(() => {
    const loadData = async () => {
      setIsLoadingProcessed(true)
      try {
        const processed = await loadProcessedDocuments()
        setProcessedDocs(processed)
        
        // Create initial version entries for processed documents that don't have them
        const processedVersions: DocumentVersion[] = []
        processed.forEach(doc => {
          const existingVersions = documentVersions.filter(v => v.documentId === doc.id)
          if (existingVersions.length === 0) {
            const initialVersion = createDocumentVersion(doc, 'imported', 'Document imported from pipeline processing')
            processedVersions.push(initialVersion)
          }
        })
        
        if (processedVersions.length > 0) {
          setDocumentVersions(prev => [...prev, ...processedVersions])
        }
        
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
  }, []) // Removed documents dependency to prevent infinite loop

  // Combine processed and local documents - use useMemo to prevent recalculation on every render
  const allDocuments = useMemo(() => {
    const processed = processedDocs.filter(doc => doc && doc.id) || []
    const local = documents.filter(doc => doc && doc.id) || []
    
    return [
      ...processed, 
      ...local.filter(localDoc => 
        !processed.some(processedDoc => processedDoc.fileName === localDoc.fileName)
      )
    ]
  }, [processedDocs, documents])

  // Advanced content search function
  const searchInDocuments = (query: string): SearchResult[] => {
    if (!query.trim() || allDocuments.length === 0) return []
    
    const results: SearchResult[] = []
    const searchLower = query.toLowerCase()
    
    allDocuments.forEach(doc => {
      if (!doc || !doc.textContent) return
      
      const matches: SearchResult['matches'] = []
      const text = doc.textContent.toLowerCase()
      let position = 0
      
      // Find all occurrences of the search term
      while (position < text.length) {
        const index = text.indexOf(searchLower, position)
        if (index === -1) break
        
        // Extract context around the match (100 chars before and after)
        const contextStart = Math.max(0, index - 100)
        const contextEnd = Math.min(text.length, index + searchLower.length + 100)
        const context = doc.textContent.substring(contextStart, contextEnd)
        
        // Get the actual matched text with original casing
        const matchText = doc.textContent.substring(index, index + searchLower.length)
        
        matches.push({
          text: matchText,
          context: contextStart > 0 ? '...' + context : context,
          position: index
        })
        
        position = index + 1
      }
      
      if (matches.length > 0) {
        results.push({
          docId: doc.id,
          matches: matches.slice(0, 5) // Limit to 5 matches per document
        })
      }
    })
    
    return results
  }

  // Effect to update search results when content search term changes
  useEffect(() => {
    if (contentSearchTerm.trim() && allDocuments.length > 0) {
      const results = searchInDocuments(contentSearchTerm)
      setSearchResults(results)
    } else {
      setSearchResults([])
    }
  }, [contentSearchTerm, allDocuments])

  // Separate effect to handle search results update when documents change
  useEffect(() => {
    if (contentSearchTerm.trim() && allDocuments.length > 0) {
      const results = searchInDocuments(contentSearchTerm)
      setSearchResults(results)
    }
  }, [allDocuments])

  // Version management functions
  const createDocumentVersion = (doc: Document, changeType: DocumentVersion['changeType'], notes?: string): DocumentVersion => {
    const version = (doc.currentVersion || 0) + 1
    return {
      id: `${doc.id}-v${version}-${Date.now()}`,
      documentId: doc.id,
      version,
      title: doc.title,
      description: doc.description,
      category: doc.category,
      children: [...doc.children],
      laws: [...doc.laws],
      misconduct: doc.misconduct.map(m => ({ ...m })),
      include: doc.include,
      placement: { ...doc.placement },
      changedBy: 'Current User', // In a real app, this would come from authentication
      changedAt: new Date().toISOString(),
      changeNotes: notes,
      changeType
    }
  }

  const saveDocumentWithVersion = (updatedDoc: Document, changeType: DocumentVersion['changeType'], notes?: string) => {
    // Create version history entry
    const version = createDocumentVersion(updatedDoc, changeType, notes)
    
    // Update document with new version info
    const docWithVersion = {
      ...updatedDoc,
      currentVersion: version.version,
      lastModified: new Date().toISOString(),
      lastModifiedBy: 'Current User'
    }

    // Save version and document
    setDocumentVersions(prev => [...prev, version])
    
    // Check if this is a processed document or local document
    const isProcessedDoc = processedDocs.some(doc => doc.id === updatedDoc.id)
    
    if (isProcessedDoc) {
      setProcessedDocs(prev => prev.map(doc => 
        doc.id === updatedDoc.id ? docWithVersion : doc
      ))
    } else {
      setDocuments(prev => prev.map(doc => 
        doc.id === updatedDoc.id ? docWithVersion : doc
      ))
    }
  }

  const getDocumentVersions = (documentId: string): DocumentVersion[] => {
    return documentVersions
      .filter(v => v.documentId === documentId)
      .sort((a, b) => b.version - a.version)
  }

  const showVersionHistory = (doc: Document) => {
    const versions = getDocumentVersions(doc.id)
    setViewingVersionHistory(doc)
    
    if (versions.length === 0) {
      toast.info('No version history yet. Changes to this document will be tracked going forward.')
    } else {
      toast.success(`Viewing ${versions.length} version${versions.length === 1 ? '' : 's'} of "${doc.title}"`)
    }
  }

  const showVersionComparison = (doc: Document) => {
    const versions = getDocumentVersions(doc.id)
    if (versions.length < 1) {
      toast.error('Need at least 2 versions to compare. Make some edits to create version history.')
      return
    }
    setComparingVersions(doc)
    toast.success(`Opening comparison view for "${doc.title}"`)
  }

  const revertToVersion = (documentId: string, versionId: string) => {
    const version = documentVersions.find(v => v.id === versionId)
    if (!version) {
      toast.error('Version not found')
      return
    }

    const currentDoc = allDocuments.find(d => d.id === documentId)
    if (!currentDoc) {
      toast.error('Document not found')
      return
    }

    // Create updated document from version data
    const revertedDoc: Document = {
      ...currentDoc,
      title: version.title,
      description: version.description,
      category: version.category,
      children: [...version.children],
      laws: [...version.laws],
      misconduct: version.misconduct.map(m => ({ ...m })),
      include: version.include,
      placement: { ...version.placement }
    }

    saveDocumentWithVersion(revertedDoc, 'edited', `Reverted to version ${version.version}`)
    toast.success(`Reverted to version ${version.version}`)
  }

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + K to focus on main search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        const searchInput = document.querySelector('input[placeholder*="Search documents"]') as HTMLInputElement
        if (searchInput) {
          searchInput.focus()
        }
      }
      
      // Ctrl/Cmd + Shift + F to open content search
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'F') {
        e.preventDefault()
        setShowAdvancedSearch(true)
        setTimeout(() => {
          const contentSearchInput = document.querySelector('input[placeholder*="Search within document content"]') as HTMLInputElement
          if (contentSearchInput) {
            contentSearchInput.focus()
          }
        }, 100)
      }
      
      // Ctrl/Cmd + H to open version history for selected document
      if ((e.ctrlKey || e.metaKey) && e.key === 'h' && selectedDoc) {
        e.preventDefault()
        showVersionHistory(selectedDoc)
        setSelectedDoc(null)
      }
      
      // Ctrl/Cmd + D to open version comparison for selected document
      if ((e.ctrlKey || e.metaKey) && e.key === 'd' && selectedDoc) {
        e.preventDefault()
        showVersionComparison(selectedDoc)
        setSelectedDoc(null)
      }
      
      // Escape to close dialogs
      if (e.key === 'Escape') {
        if (comparingVersions) {
          setComparingVersions(null)
        } else if (viewingVersionHistory) {
          setViewingVersionHistory(null)
        } else if (editingDoc) {
          setEditingDoc(null)
          setChangeNotes('')
        } else if (selectedDoc) {
          setSelectedDoc(null)
        }
      }
    }
    
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [selectedDoc, viewingVersionHistory, editingDoc, comparingVersions])

  const filteredDocuments = allDocuments.filter(doc => {
    if (!doc) return false
    
    const matchesSearch = searchTerm === '' || 
      (doc.fileName && doc.fileName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (doc.title && doc.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (doc.description && doc.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (doc.children && doc.children.some(child => child && child.toLowerCase().includes(searchTerm.toLowerCase()))) ||
      (doc.laws && doc.laws.some(law => law && law.toLowerCase().includes(searchTerm.toLowerCase())))
    
    const matchesCategory = categoryFilter === 'all' || doc.category === categoryFilter
    
    // If there's a content search active, filter to show only docs with matches
    const matchesContentSearch = contentSearchTerm === '' || 
      searchResults.some(result => result.docId === doc.id)
    
    return matchesSearch && matchesCategory && matchesContentSearch
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
        textContent: pdfResult.text.substring(0, 50000), // Store first 50k chars for search (increased from 10k)
        currentVersion: 1,
        lastModified: new Date().toISOString(),
        lastModifiedBy: 'Current User'
      }

      updateProgress(100, 'complete')
      
      // Save document and create initial version
      setDocuments(prev => [...prev, newDoc])
      
      // Create initial version entry
      const initialVersion = createDocumentVersion(newDoc, 'created', 'Initial document upload and processing')
      setDocumentVersions(prev => [...prev, initialVersion])
      
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
    
    const notes = changeNotes.trim() || 'Document edited'
    saveDocumentWithVersion(editingDoc, 'edited', notes)
    
    toast.success('Document updated with version history')
    setEditingDoc(null)
    setChangeNotes('')
  }

  const exportToCSV = () => {
    const headers = [
      'File Name', 'Category', 'Children', 'Laws', 'Misconduct', 
      'Include', 'Master File', 'Exhibit Bundle', 'Oversight Packet', 
      'Title', 'Description'
    ]
    
    const rows = allDocuments.filter(doc => doc).map(doc => [
      doc.fileName || '',
      doc.category || '',
      (doc.children || []).join(', '),
      (doc.laws || []).join(', '),
      (doc.misconduct || []).map(m => `${m.law || ''} p${m.page || ''}/${m.paragraph || ''}`).join('; '),
      doc.include || '',
      (doc.placement?.masterFile || false).toString(),
      (doc.placement?.exhibitBundle || false).toString(),
      (doc.placement?.oversightPacket || false).toString(),
      doc.title || '',
      doc.description || ''
    ])
    
    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
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

  const handleExportReport = (reportData: any) => {
    // Export comprehensive report as JSON
    const jsonBlob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' })
    const jsonUrl = URL.createObjectURL(jsonBlob)
    const jsonLink = document.createElement('a')
    jsonLink.href = jsonUrl
    jsonLink.download = `justice-report-${new Date().toISOString().split('T')[0]}.json`
    jsonLink.click()
    URL.revokeObjectURL(jsonUrl)

    // Also export as CSV summary
    const summaryHeaders = ['Metric', 'Value']
    const summaryRows = [
      ['Total Documents', reportData.summary.totalDocuments],
      ['Primary Evidence', reportData.summary.primaryEvidence],
      ['Included Documents', reportData.summary.includedDocuments],
      ['Children Involved', reportData.summary.childrenInvolved],
      ['Laws Violated', reportData.summary.lawsViolated],
      ['Oversight Ready', reportData.summary.oversightReady],
      ['Total Versions', reportData.summary.totalVersions],
      ['Generated At', new Date(reportData.generatedAt).toLocaleString()]
    ]
    
    const csvContent = [summaryHeaders, ...summaryRows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n')
    
    const csvBlob = new Blob([csvContent], { type: 'text/csv' })
    const csvUrl = URL.createObjectURL(csvBlob)
    const csvLink = document.createElement('a')
    csvLink.href = csvUrl
    csvLink.download = `justice-report-summary-${new Date().toISOString().split('T')[0]}.csv`
    csvLink.click()
    URL.revokeObjectURL(csvUrl)
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

  const CategoryBadge = ({ category }: { category: Document['category'] | undefined }) => {
    const safeCategory = category || 'No'
    const colors = {
      Primary: 'bg-red-100 text-red-800',
      Supporting: 'bg-blue-100 text-blue-800',
      External: 'bg-green-100 text-green-800',
      No: 'bg-gray-100 text-gray-800'
    }
    return <Badge className={colors[safeCategory as keyof typeof colors]}>{safeCategory}</Badge>
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
                <p className="text-sm text-muted-foreground">
                  Contact & Action Book — Master File System
                  {allDocuments.length > 0 && (
                    <span className="ml-2">
                      • {allDocuments.length} documents • {documentVersions.length} versions tracked
                    </span>
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={refreshProcessedData} variant="outline" size="sm" disabled={isLoadingProcessed}>
                <GitBranch className="h-4 w-4 mr-2" />
                {isLoadingProcessed ? 'Loading...' : 'Refresh Data'}
              </Button>
              <Button 
                onClick={() => setActiveTab('reports')} 
                variant={activeTab === 'reports' ? 'default' : 'outline'} 
                size="sm"
              >
                <ChartLine className="h-4 w-4 mr-2" />
                Reports
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
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="dashboard">Document Dashboard</TabsTrigger>
            <TabsTrigger value="reports">Reports & Analytics</TabsTrigger>
            <TabsTrigger value="upload">Upload & Process</TabsTrigger>
          </TabsList>

          <TabsContent value="reports" className="space-y-6">
            <ReportGenerator 
              documents={allDocuments}
              documentVersions={documentVersions}
              onExportReport={handleExportReport}
            />
          </TabsContent>

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
            {/* Version Analytics Summary */}
            {documentVersions.length > 0 && (
              <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <GitBranch className="h-5 w-5 text-blue-600" />
                    Version Tracking Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{documentVersions.length}</div>
                      <div className="text-muted-foreground">Total Versions</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {documentVersions.filter(v => v.changeType === 'edited').length}
                      </div>
                      <div className="text-muted-foreground">Edits Made</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {allDocuments.filter(doc => doc.currentVersion > 1).length}
                      </div>
                      <div className="text-muted-foreground">Active Docs</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">
                        {new Set(documentVersions.map(v => v.changedBy)).size}
                      </div>
                      <div className="text-muted-foreground">Contributors</div>
                    </div>
                  </div>
                  {(() => {
                    const sevenDaysAgo = new Date()
                    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
                    const recentVersions = documentVersions.filter(v => new Date(v.changedAt) >= sevenDaysAgo)
                    return recentVersions.length > 0 && (
                      <div className="mt-4 pt-3 border-t border-blue-200">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>{recentVersions.length} changes in the last 7 days</span>
                          <span>View detailed analytics in Reports → Versions. Press Ctrl+D to compare versions.</span>
                        </div>
                      </div>
                    )
                  })()}
                </CardContent>
              </Card>
            )}

            {/* Search Controls */}
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search documents by title, description, children, laws... (Ctrl+K)"
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
                <Button
                  variant={showAdvancedSearch ? "default" : "outline"}
                  onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
                  className="relative"
                >
                  <TextT className="h-4 w-4 mr-2" />
                  Content Search
                  <span className="ml-2 text-xs opacity-70">(Ctrl+Shift+F)</span>
                </Button>
              </div>

              {/* Advanced Content Search */}
              {showAdvancedSearch && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <MagnifyingGlass className="h-4 w-4" />
                      Search Inside Documents
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="relative">
                      <MagnifyingGlass className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search within document content..."
                        value={contentSearchTerm}
                        onChange={(e) => setContentSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                      {contentSearchTerm && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                          onClick={() => setContentSearchTerm('')}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                    
                    {contentSearchTerm && searchResults.length > 0 && (
                      <div className="space-y-3 max-h-60 overflow-y-auto">
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-muted-foreground">
                            Found {searchResults.reduce((acc, result) => acc + result.matches.length, 0)} matches 
                            in {searchResults.length} documents
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              // Export search results
                              const searchData = searchResults.map(result => {
                                const doc = allDocuments.find(d => d.id === result.docId)
                                return {
                                  document: doc?.title || 'Unknown',
                                  fileName: doc?.fileName || 'Unknown',
                                  matches: result.matches.length,
                                  matchTexts: result.matches.map(m => m.text).join(', ')
                                }
                              })
                              
                              const csvContent = [
                                ['Document', 'File Name', 'Match Count', 'Match Texts'],
                                ...searchData.map(item => [item.document, item.fileName, item.matches.toString(), item.matchTexts])
                              ]
                                .map(row => row.map(cell => `"${cell}"`).join(','))
                                .join('\n')
                              
                              const blob = new Blob([csvContent], { type: 'text/csv' })
                              const url = URL.createObjectURL(blob)
                              const a = document.createElement('a')
                              a.href = url
                              a.download = `search-results-${contentSearchTerm}.csv`
                              a.click()
                              URL.revokeObjectURL(url)
                              
                              toast.success('Search results exported')
                            }}
                          >
                            <Download className="h-3 w-3 mr-1" />
                            Export
                          </Button>
                        </div>
                        {searchResults.map((result) => {
                          const doc = allDocuments.find(d => d.id === result.docId)
                          if (!doc) return null
                          
                          return (
                            <div key={result.docId} className="border rounded-lg p-3 bg-muted/30">
                              <div className="flex items-center justify-between mb-2">
                                <div className="font-medium text-sm truncate">{doc.title}</div>
                                <Badge variant="outline" className="text-xs">
                                  {result.matches.length} matches
                                </Badge>
                              </div>
                              <div className="space-y-2">
                                {result.matches.slice(0, 2).map((match, idx) => (
                                  <div key={idx} className="text-xs bg-background rounded p-2">
                                    <div className="text-muted-foreground">
                                      {match.context.split(new RegExp(`(${contentSearchTerm})`, 'gi')).map((part, i) =>
                                        part.toLowerCase() === contentSearchTerm.toLowerCase() ? (
                                          <mark key={i} className="bg-yellow-200 text-yellow-900 px-1 rounded">
                                            {part}
                                          </mark>
                                        ) : part
                                      )}
                                    </div>
                                  </div>
                                ))}
                                {result.matches.length > 2 && (
                                  <div className="text-xs text-muted-foreground">
                                    +{result.matches.length - 2} more matches
                                  </div>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                    
                    {contentSearchTerm && searchResults.length === 0 && (
                      <div className="text-center py-6 text-muted-foreground">
                        <MagnifyingGlass className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No matches found for "{contentSearchTerm}"</p>
                        <p className="text-xs mt-1">Try different keywords or check spelling</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredDocuments.map((doc) => {
                if (!doc || !doc.id) return null
                
                const docSearchResult = searchResults.find(result => result.docId === doc.id)
                return (
                  <Card key={doc.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-sm font-medium truncate">{doc.title || 'Untitled'}</CardTitle>
                          <div className="flex items-center gap-2 mt-1">
                            <CategoryBadge category={doc.category || 'No'} />
                            {processedDocs.some(p => p && p.id === doc.id) && (
                              <Badge variant="outline" className="text-xs">
                                <GitBranch className="h-3 w-3 mr-1" />
                                Pipeline
                              </Badge>
                            )}
                            {doc.currentVersion && doc.currentVersion > 1 && (
                              <Badge variant="outline" className="text-xs">
                                <Clock className="h-3 w-3 mr-1" />
                                v{doc.currentVersion}
                              </Badge>
                            )}
                            {docSearchResult && (
                              <Badge variant="outline" className="text-xs bg-yellow-50 border-yellow-200">
                                <MagnifyingGlass className="h-3 w-3 mr-1" />
                                {docSearchResult.matches.length}
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
                      
                      {/* Show search snippet if available */}
                      {docSearchResult && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded p-2">
                          <div className="text-xs text-yellow-800 font-medium mb-1">Content matches:</div>
                          <div className="text-xs text-yellow-700">
                            {docSearchResult.matches[0].context.substring(0, 100)}...
                          </div>
                        </div>
                      )}
                      
                      {(doc.children && doc.children.length > 0) && (
                        <div className="flex items-center gap-1 flex-wrap">
                          <Users className="h-3 w-3 text-muted-foreground" />
                          {doc.children.map((child, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">{child}</Badge>
                          ))}
                        </div>
                      )}
                      
                      {(doc.laws && doc.laws.length > 0) && (
                        <div className="flex items-center gap-1 flex-wrap">
                          <Scale className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">{doc.laws.length} law(s)</span>
                        </div>
                      )}
                      
                      <div className="flex justify-between items-center pt-2">
                        <Badge variant={(doc.include || 'NO') === 'YES' ? 'default' : 'secondary'}>
                          {doc.include || 'NO'}
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
                            onClick={() => showVersionHistory(doc)}
                            title="Version History (Ctrl+H)"
                          >
                            <Clock className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => showVersionComparison(doc)}
                            title="Compare Versions (Ctrl+D)"
                          >
                            <GitCompare className="h-3 w-3" />
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
                )
              })}
            </div>

            {filteredDocuments.length === 0 && !isLoadingProcessed && (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No documents found</h3>
                <p className="text-muted-foreground">
                  {allDocuments.length === 0 
                    ? "Add PDF documents to the input/ directory and push to trigger the pipeline, or upload documents locally for testing"
                    : (contentSearchTerm 
                      ? `No documents contain "${contentSearchTerm}". Try different keywords or check the content search.`
                      : "Try adjusting your search or filter criteria. Use Ctrl+H for version history or Ctrl+D for version comparison.")
                  }
                </p>
                {contentSearchTerm && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={() => setContentSearchTerm('')}
                  >
                    Clear content search
                  </Button>
                )}
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
      <Dialog open={!!selectedDoc} onOpenChange={(open) => {
        if (!open) {
          setSelectedDoc(null)
          setDocumentSearchTerm('')
        }
      }}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedDoc?.title}
              {selectedDoc?.currentVersion && selectedDoc.currentVersion > 1 && (
                <Badge variant="outline" className="text-xs">
                  <Clock className="h-3 w-3 mr-1" />
                  v{selectedDoc.currentVersion}
                </Badge>
              )}
              {selectedDoc?.textContent && (
                <Badge variant="outline" className="text-xs">
                  <TextT className="h-3 w-3 mr-1" />
                  Searchable Text
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>
          {selectedDoc && (
            <div className="flex-1 overflow-hidden">
              <Tabs defaultValue="details" className="h-full flex flex-col">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="details">Document Details</TabsTrigger>
                  <TabsTrigger value="content" disabled={!selectedDoc.textContent}>
                    Text Content {selectedDoc.textContent ? `(${Math.round(selectedDoc.textContent.length / 1000)}k chars)` : '(Not Available)'}
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="details" className="flex-1 overflow-y-auto space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold mb-2">Document Details</h4>
                      <div className="space-y-2 text-sm">
                        <div><span className="font-medium">File:</span> {selectedDoc.fileName || 'Unknown'}</div>
                        <div><span className="font-medium">Category:</span> <CategoryBadge category={selectedDoc.category} /></div>
                        <div><span className="font-medium">Include:</span> <Badge variant={(selectedDoc.include || 'NO') === 'YES' ? 'default' : 'secondary'}>{selectedDoc.include || 'NO'}</Badge></div>
                        <div><span className="font-medium">Uploaded:</span> {selectedDoc.uploadedAt ? new Date(selectedDoc.uploadedAt).toLocaleDateString() : 'Unknown'}</div>
                        {selectedDoc.currentVersion && (
                          <div><span className="font-medium">Version:</span> {selectedDoc.currentVersion}</div>
                        )}
                        {selectedDoc.lastModified && (
                          <div><span className="font-medium">Last Modified:</span> {new Date(selectedDoc.lastModified).toLocaleDateString()}</div>
                        )}
                        {selectedDoc.lastModifiedBy && (
                          <div><span className="font-medium">Modified By:</span> {selectedDoc.lastModifiedBy}</div>
                        )}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Placement Rules</h4>
                      <div className="space-y-2 text-sm">
                        <div><span className="font-medium">Master File:</span> {selectedDoc.placement?.masterFile ? '✓' : '✗'}</div>
                        <div><span className="font-medium">Exhibit Bundle:</span> {selectedDoc.placement?.exhibitBundle ? '✓' : '✗'}</div>
                        <div><span className="font-medium">Oversight Packet:</span> {selectedDoc.placement?.oversightPacket ? '✓' : '✗'}</div>
                        <div className="mt-3">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              showVersionHistory(selectedDoc)
                              setSelectedDoc(null)
                            }}
                            className="flex items-center gap-2"
                          >
                            <Clock className="h-3 w-3" />
                            View Version History
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2">Children Identified</h4>
                    <div className="flex gap-2 flex-wrap">
                      {(selectedDoc.children && selectedDoc.children.length > 0)
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
                      {(selectedDoc.laws && selectedDoc.laws.length > 0)
                        ? selectedDoc.laws.map((law, idx) => (
                            <Badge key={idx} variant="outline">{law}</Badge>
                          ))
                        : <span className="text-muted-foreground text-sm">None identified</span>
                      }
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2">Description</h4>
                    <p className="text-sm text-muted-foreground">{selectedDoc.description || 'No description available'}</p>
                  </div>
                </TabsContent>
                
                <TabsContent value="content" className="flex-1 overflow-hidden flex flex-col space-y-4">
                  {selectedDoc.textContent && (
                    <>
                      <div className="relative">
                        <MagnifyingGlass className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search within this document..."
                          value={documentSearchTerm}
                          onChange={(e) => setDocumentSearchTerm(e.target.value)}
                          className="pl-10"
                        />
                        {documentSearchTerm && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                            onClick={() => setDocumentSearchTerm('')}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                      
                      <div className="flex-1 overflow-y-auto border rounded-lg bg-muted/30">
                        <div className="p-4 text-sm font-mono whitespace-pre-wrap leading-relaxed">
                          {documentSearchTerm ? (
                            <div
                              dangerouslySetInnerHTML={{
                                __html: selectedDoc.textContent
                                  .replace(/\n/g, '<br>')
                                  .replace(
                                    new RegExp(`(${documentSearchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'),
                                    '<mark style="background-color: #fef08a; color: #92400e; padding: 1px 2px; border-radius: 2px;">$1</mark>'
                                  )
                              }}
                            />
                          ) : (
                            <div
                              dangerouslySetInnerHTML={{
                                __html: selectedDoc.textContent.replace(/\n/g, '<br>')
                              }}
                            />
                          )}
                        </div>
                      </div>
                      
                      {documentSearchTerm && (
                        <div className="text-xs text-muted-foreground">
                          {(() => {
                            const matches = (selectedDoc.textContent.match(new RegExp(documentSearchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')) || []).length
                            return matches > 0 ? `${matches} matches found` : 'No matches found'
                          })()}
                        </div>
                      )}
                    </>
                  )}
                </TabsContent>
              </Tabs>
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
              
              <div>
                <label className="text-sm font-medium">Change Notes</label>
                <Input
                  placeholder="What changes are you making? (optional)"
                  value={changeNotes}
                  onChange={(e) => setChangeNotes(e.target.value)}
                />
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => {
                  setEditingDoc(null)
                  setChangeNotes('')
                }}>
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

      {/* Version History Dialog */}
      <Dialog open={!!viewingVersionHistory} onOpenChange={() => setViewingVersionHistory(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Version History: {viewingVersionHistory?.title}
            </DialogTitle>
          </DialogHeader>
          {viewingVersionHistory && (() => {
            const versions = getDocumentVersions(viewingVersionHistory.id)
            return (
              <div className="flex-1 overflow-y-auto space-y-4">
                {versions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No version history available for this document</p>
                    <p className="text-xs mt-1">Changes will be tracked going forward</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {versions.map((version, index) => (
                      <Card key={version.id} className={`${index === 0 ? 'ring-2 ring-primary/20' : ''}`}>
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Badge variant={index === 0 ? 'default' : 'outline'}>
                                Version {version.version}
                                {index === 0 && ' (Current)'}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {version.changeType === 'created' && <FileArrowUp className="h-3 w-3 mr-1" />}
                                {version.changeType === 'edited' && <Edit className="h-3 w-3 mr-1" />}
                                {version.changeType === 'imported' && <GitBranch className="h-3 w-3 mr-1" />}
                                {version.changeType}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2">
                              {index > 0 && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    if (window.confirm(`Are you sure you want to revert to version ${version.version}? This will create a new version with the old data.`)) {
                                      revertToVersion(viewingVersionHistory.id, version.id)
                                      setViewingVersionHistory(null)
                                    }
                                  }}
                                >
                                  Revert to this version
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setViewingVersionHistory(null)
                                  showVersionComparison(viewingVersionHistory)
                                }}
                              >
                                <GitCompare className="h-3 w-3 mr-1" />
                                Compare
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="font-medium text-muted-foreground">Changed by:</span>
                              <div className="flex items-center gap-1 mt-1">
                                <User className="h-3 w-3" />
                                {version.changedBy}
                              </div>
                            </div>
                            <div>
                              <span className="font-medium text-muted-foreground">Changed at:</span>
                              <div className="mt-1">
                                {new Date(version.changedAt).toLocaleString()}
                              </div>
                            </div>
                          </div>
                          
                          {version.changeNotes && (
                            <div className="bg-muted/50 rounded p-3">
                              <span className="font-medium text-muted-foreground text-xs">Change Notes:</span>
                              <p className="text-sm mt-1">{version.changeNotes}</p>
                            </div>
                          )}
                          
                          <div className="grid grid-cols-2 gap-4 text-xs">
                            <div>
                              <span className="font-medium">Title:</span> {version.title}
                            </div>
                            <div>
                              <span className="font-medium">Category:</span> {version.category}
                            </div>
                            <div>
                              <span className="font-medium">Include:</span> {version.include}
                            </div>
                            <div>
                              <span className="font-medium">Children:</span> {version.children.join(', ') || 'None'}
                            </div>
                            <div className="col-span-2">
                              <span className="font-medium">Laws:</span> {version.laws.join(', ') || 'None'}
                            </div>
                          </div>
                          
                          <details className="text-xs">
                            <summary className="cursor-pointer font-medium text-muted-foreground hover:text-foreground">
                              Show full description
                            </summary>
                            <div className="mt-2 p-2 bg-muted/30 rounded text-xs">
                              {version.description}
                            </div>
                          </details>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )
          })()}
        </DialogContent>
      </Dialog>

      {/* Document Version Comparison Dialog */}
      {comparingVersions && (
        <DocumentComparison
          document={comparingVersions}
          documentVersions={documentVersions}
          isOpen={!!comparingVersions}
          onClose={() => setComparingVersions(null)}
          onRevertToVersion={revertToVersion}
        />
      )}
    </div>
  )
}

export default App