import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { 
  GitCompare, 
  AlertTriangle, 
  Search, 
  Calendar, 
  FileText, 
  Download,
  CheckCircle,
  XCircle,
  Clock,
  Zap
} from '@phosphor-icons/react'

interface Document {
  id: string
  fileName: string
  title: string
  description: string
  category: 'Primary' | 'Supporting' | 'External' | 'No'
  children: string[]
  laws: string[]
  uploadedAt: string
  textContent?: string
  lastModified: string
  lastModifiedBy: string
}

interface DocumentVersion {
  id: string
  documentId: string
  version: number
  title: string
  description: string
  category: 'Primary' | 'Supporting' | 'External' | 'No'
  children: string[]
  laws: string[]
  changedBy: string
  changedAt: string
  changeNotes?: string
  changeType: 'created' | 'edited' | 'imported'
}

interface TamperingResult {
  id: string
  date: string
  documentsFound: number
  suspiciousChanges: number
  nameChanges: Array<{
    name: string
    beforeCount: number
    afterCount: number
    delta: number
  }>
  numericChanges: Array<{
    type: 'added' | 'removed'
    numbers: string[]
  }>
  significantDifferences: Array<{
    type: 'major_text_change' | 'timeline_inconsistency' | 'metadata_mismatch'
    severity: 'low' | 'medium' | 'high' | 'critical'
    description: string
    evidence: string
  }>
  documents: Array<{
    id: string
    fileName: string
    isBaseline: boolean
    changesSummary: string
  }>
}

interface TamperingDetectorProps {
  documents: Document[]
  documentVersions: DocumentVersion[]
  isOpen: boolean
  onClose: () => void
}

// Extract date from document text or filename
const extractDocumentDate = (doc: Document): string | null => {
  const text = doc.textContent || ''
  const filename = doc.fileName
  
  // Try various date patterns
  const datePatterns = [
    /\b(0?[1-9]|1[0-2])[\/\-](0?[1-9]|[12][0-9]|3[01])[\/\-](20\d{2}|19\d{2})\b/g,
    /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+([12]?\d|3[01]),\s*(20\d{2}|19\d{2})\b/gi,
    /\b(20\d{2}|19\d{2})-(0?[1-9]|1[0-2])-(0?[1-9]|[12]\d|3[01])\b/g
  ]
  
  // Check document text first
  for (const pattern of datePatterns) {
    const matches = text.match(pattern)
    if (matches && matches.length > 0) {
      return normalizeDate(matches[0])
    }
  }
  
  // Check filename
  for (const pattern of datePatterns) {
    const matches = filename.match(pattern)
    if (matches && matches.length > 0) {
      return normalizeDate(matches[0])
    }
  }
  
  return null
}

const normalizeDate = (dateStr: string): string => {
  try {
    const date = new Date(dateStr)
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0]
    }
  } catch {
    // Try to parse manually for different formats
    const patterns = [
      /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/,
      /(\d{4})-(\d{1,2})-(\d{1,2})/
    ]
    
    for (const pattern of patterns) {
      const match = dateStr.match(pattern)
      if (match) {
        let [, m, d, y] = match
        if (pattern === patterns[0]) {
          // MM/DD/YYYY format
          const date = new Date(parseInt(y), parseInt(m) - 1, parseInt(d))
          if (!isNaN(date.getTime())) {
            return date.toISOString().split('T')[0]
          }
        } else {
          // YYYY-MM-DD format
          return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
        }
      }
    }
  }
  return dateStr
}

// Tokenize text for comparison
const tokenize = (text: string): string[] => {
  return text.toLowerCase().match(/\w+|[^\w\s]/g) || []
}

// Count mentions of target names
const countNameMentions = (text: string, names: string[]): Record<string, number> => {
  const counts: Record<string, number> = {}
  const lowerText = text.toLowerCase()
  
  names.forEach(name => {
    const pattern = new RegExp(`\\b${name.toLowerCase()}\\b`, 'gi')
    const matches = lowerText.match(pattern) || []
    counts[name] = matches.length
  })
  
  return counts
}

// Extract numbers from text
const extractNumbers = (text: string): string[] => {
  return text.match(/\b\d+(?:\.\d+)?\b/g) || []
}

// Calculate text similarity
const calculateSimilarity = (text1: string, text2: string): number => {
  const tokens1 = new Set(tokenize(text1))
  const tokens2 = new Set(tokenize(text2))
  
  const intersection = new Set([...tokens1].filter(x => tokens2.has(x)))
  const union = new Set([...tokens1, ...tokens2])
  
  return union.size > 0 ? intersection.size / union.size : 0
}

// Main tampering detection function
const detectTampering = (documents: Document[]): TamperingResult[] => {
  const targetNames = ['Noel', 'Andy Maki', 'Banister', 'Russell', 'Verde']
  const results: TamperingResult[] = []
  
  // Group documents by extracted date
  const documentsByDate = new Map<string, Document[]>()
  
  documents.forEach(doc => {
    const date = extractDocumentDate(doc)
    if (date) {
      if (!documentsByDate.has(date)) {
        documentsByDate.set(date, [])
      }
      documentsByDate.get(date)!.push(doc)
    }
  })
  
  // Analyze each date group with 2+ documents
  documentsByDate.forEach((docsForDate, date) => {
    if (docsForDate.length < 2) return
    
    // Sort by modification time (earliest first)
    const sortedDocs = docsForDate.sort((a, b) => 
      new Date(a.lastModified).getTime() - new Date(b.lastModified).getTime()
    )
    
    const baseline = sortedDocs[0]
    const comparisons = sortedDocs.slice(1)
    
    let suspiciousChanges = 0
    const nameChanges: TamperingResult['nameChanges'] = []
    const numericChanges: TamperingResult['numericChanges'] = []
    const significantDifferences: TamperingResult['significantDifferences'] = []
    
    comparisons.forEach(doc => {
      // Compare name mentions
      const baselineCounts = countNameMentions(baseline.textContent || '', targetNames)
      const docCounts = countNameMentions(doc.textContent || '', targetNames)
      
      targetNames.forEach(name => {
        const beforeCount = baselineCounts[name] || 0
        const afterCount = docCounts[name] || 0
        const delta = afterCount - beforeCount
        
        if (delta !== 0) {
          nameChanges.push({
            name,
            beforeCount,
            afterCount,
            delta
          })
          
          if (Math.abs(delta) > 2) {
            suspiciousChanges++
            significantDifferences.push({
              type: 'major_text_change',
              severity: Math.abs(delta) > 5 ? 'critical' : 'high',
              description: `Significant change in mentions of "${name}" (${delta > 0 ? '+' : ''}${delta})`,
              evidence: `Baseline: ${beforeCount} mentions, Modified: ${afterCount} mentions`
            })
          }
        }
      })
      
      // Compare numbers
      const baselineNumbers = new Set(extractNumbers(baseline.textContent || ''))
      const docNumbers = new Set(extractNumbers(doc.textContent || ''))
      
      const addedNumbers = [...docNumbers].filter(n => !baselineNumbers.has(n))
      const removedNumbers = [...baselineNumbers].filter(n => !docNumbers.has(n))
      
      if (addedNumbers.length > 0) {
        numericChanges.push({ type: 'added', numbers: addedNumbers })
      }
      if (removedNumbers.length > 0) {
        numericChanges.push({ type: 'removed', numbers: removedNumbers })
      }
      
      // Calculate text similarity
      const similarity = calculateSimilarity(
        baseline.textContent || '', 
        doc.textContent || ''
      )
      
      if (similarity < 0.7) {
        suspiciousChanges++
        significantDifferences.push({
          type: 'major_text_change',
          severity: similarity < 0.5 ? 'critical' : 'high',
          description: `Major text changes detected (${Math.round((1 - similarity) * 100)}% different)`,
          evidence: `Text similarity: ${Math.round(similarity * 100)}%`
        })
      }
      
      // Check metadata inconsistencies
      if (baseline.category !== doc.category) {
        suspiciousChanges++
        significantDifferences.push({
          type: 'metadata_mismatch',
          severity: 'medium',
          description: `Category changed from "${baseline.category}" to "${doc.category}"`,
          evidence: `Document classification altered`
        })
      }
      
      // Check timeline inconsistencies
      const timeDiff = new Date(doc.lastModified).getTime() - new Date(baseline.lastModified).getTime()
      if (timeDiff < 60000 && significantDifferences.length > 0) { // Less than 1 minute apart
        significantDifferences.push({
          type: 'timeline_inconsistency',
          severity: 'high',
          description: 'Multiple versions created within short timeframe',
          evidence: `${Math.round(timeDiff / 1000)} seconds between versions`
        })
      }
    })
    
    if (suspiciousChanges > 0 || nameChanges.length > 0 || numericChanges.length > 0) {
      results.push({
        id: `tampering-${date}`,
        date,
        documentsFound: docsForDate.length,
        suspiciousChanges,
        nameChanges,
        numericChanges,
        significantDifferences,
        documents: sortedDocs.map((doc, index) => ({
          id: doc.id,
          fileName: doc.fileName,
          isBaseline: index === 0,
          changesSummary: index === 0 ? 'Baseline document' : `${suspiciousChanges} suspicious changes detected`
        }))
      })
    }
  })
  
  return results.sort((a, b) => b.suspiciousChanges - a.suspiciousChanges)
}

export const TamperingDetector: React.FC<TamperingDetectorProps> = ({
  documents,
  documentVersions,
  isOpen,
  onClose
}) => {
  const tamperingResults = useMemo(() => {
    return detectTampering(documents)
  }, [documents])
  
  const totalSuspiciousDocuments = tamperingResults.reduce((acc, result) => acc + result.documentsFound, 0)
  const totalViolations = tamperingResults.reduce((acc, result) => acc + result.suspiciousChanges, 0)
  const criticalFindings = tamperingResults.reduce((acc, result) => 
    acc + result.significantDifferences.filter(d => d.severity === 'critical').length, 0
  )
  
  const exportResults = () => {
    const exportData = {
      summary: {
        analysisDate: new Date().toISOString(),
        totalDocuments: documents.length,
        suspiciousDocuments: totalSuspiciousDocuments,
        totalViolations,
        criticalFindings,
        datesAnalyzed: tamperingResults.length
      },
      findings: tamperingResults,
      methodology: {
        targetNames: ['Noel', 'Andy Maki', 'Banister', 'Russell', 'Verde'],
        detectionMethods: [
          'Name mention frequency analysis',
          'Numeric content comparison',
          'Text similarity analysis',
          'Metadata consistency checks',
          'Timeline inconsistency detection'
        ],
        severityLevels: {
          critical: 'Major alterations that significantly impact document integrity',
          high: 'Substantial changes that may indicate tampering',
          medium: 'Moderate changes requiring investigation',
          low: 'Minor changes that may be legitimate edits'
        }
      }
    }
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `tampering-analysis-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }
  
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200'
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }
  
  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            Document Tampering & Alteration Analysis
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto space-y-6">
          {/* Summary Section */}
          <Card className="bg-gradient-to-r from-orange-50 to-red-50 border-orange-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Zap className="h-5 w-5 text-orange-600" />
                Analysis Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{totalSuspiciousDocuments}</div>
                  <div className="text-muted-foreground">Documents Analyzed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{totalViolations}</div>
                  <div className="text-muted-foreground">Suspicious Changes</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{criticalFindings}</div>
                  <div className="text-muted-foreground">Critical Findings</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{tamperingResults.length}</div>
                  <div className="text-muted-foreground">Dates with Issues</div>
                </div>
              </div>
              
              <div className="mt-4 flex items-center justify-between">
                <div className="text-xs text-muted-foreground">
                  Analysis covers name mention changes, numeric alterations, and content modifications
                </div>
                <Button onClick={exportResults} size="sm" variant="outline">
                  <Download className="h-3 w-3 mr-1" />
                  Export Analysis
                </Button>
              </div>
            </CardContent>
          </Card>
          
          {/* Results Section */}
          {tamperingResults.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-green-700 mb-2">No Tampering Detected</h3>
                <p className="text-muted-foreground">
                  Analysis complete. No suspicious document alterations were found based on current detection criteria.
                </p>
                <div className="mt-4 text-xs text-muted-foreground">
                  Analyzed {documents.length} documents using name frequency, numeric content, and text similarity analysis.
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {tamperingResults.map((result, index) => (
                <Card key={result.id} className="border-l-4 border-l-orange-500">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="bg-orange-50 text-orange-700">
                          <Calendar className="h-3 w-3 mr-1" />
                          {result.date}
                        </Badge>
                        <Badge variant="destructive">
                          {result.suspiciousChanges} suspicious changes
                        </Badge>
                        {result.significantDifferences.some(d => d.severity === 'critical') && (
                          <Badge className="bg-red-600 text-white">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            CRITICAL
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {result.documentsFound} documents found
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <Tabs defaultValue="changes" className="w-full">
                      <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="changes">Changes</TabsTrigger>
                        <TabsTrigger value="names">Names</TabsTrigger>
                        <TabsTrigger value="numbers">Numbers</TabsTrigger>
                        <TabsTrigger value="documents">Documents</TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="changes" className="space-y-3">
                        {result.significantDifferences.length > 0 ? (
                          result.significantDifferences.map((diff, idx) => (
                            <Alert key={idx} className={getSeverityColor(diff.severity)}>
                              <AlertTriangle className="h-4 w-4" />
                              <AlertDescription>
                                <div className="flex items-center justify-between">
                                  <div>
                                    <div className="font-medium">{diff.description}</div>
                                    <div className="text-xs opacity-80 mt-1">{diff.evidence}</div>
                                  </div>
                                  <Badge variant="outline" className={getSeverityColor(diff.severity)}>
                                    {diff.severity.toUpperCase()}
                                  </Badge>
                                </div>
                              </AlertDescription>
                            </Alert>
                          ))
                        ) : (
                          <div className="text-center py-4 text-muted-foreground">
                            No significant differences detected
                          </div>
                        )}
                      </TabsContent>
                      
                      <TabsContent value="names" className="space-y-3">
                        {result.nameChanges.length > 0 ? (
                          <div className="space-y-2">
                            {result.nameChanges.map((change, idx) => (
                              <div key={idx} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                                <div>
                                  <div className="font-medium">{change.name}</div>
                                  <div className="text-sm text-muted-foreground">
                                    {change.beforeCount} → {change.afterCount} mentions
                                  </div>
                                </div>
                                <Badge variant={change.delta > 0 ? "default" : "secondary"}>
                                  {change.delta > 0 ? '+' : ''}{change.delta}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-4 text-muted-foreground">
                            No changes in name mentions detected
                          </div>
                        )}
                      </TabsContent>
                      
                      <TabsContent value="numbers" className="space-y-3">
                        {result.numericChanges.length > 0 ? (
                          <div className="space-y-2">
                            {result.numericChanges.map((change, idx) => (
                              <div key={idx} className="p-3 bg-muted/30 rounded-lg">
                                <div className="font-medium mb-2">
                                  Numbers {change.type}:
                                </div>
                                <div className="flex flex-wrap gap-1">
                                  {change.numbers.map((num, numIdx) => (
                                    <Badge key={numIdx} variant="outline" className={
                                      change.type === 'added' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                                    }>
                                      {num}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-4 text-muted-foreground">
                            No numeric changes detected
                          </div>
                        )}
                      </TabsContent>
                      
                      <TabsContent value="documents" className="space-y-3">
                        <div className="space-y-2">
                          {result.documents.map((doc, idx) => (
                            <div key={doc.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                              <div className="flex items-center gap-3">
                                <div>
                                  <div className="font-medium">{doc.fileName}</div>
                                  <div className="text-sm text-muted-foreground">{doc.changesSummary}</div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {doc.isBaseline && (
                                  <Badge variant="outline" className="bg-blue-50 text-blue-700">
                                    <Clock className="h-3 w-3 mr-1" />
                                    Baseline
                                  </Badge>
                                )}
                                <Button size="sm" variant="ghost">
                                  <FileText className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}