import { useState, useEffect, useMemo } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  AlertTriangle, 
  Shield, 
  FileText, 
  Clock, 
  Users, 
  Download, 
  GitCompare, 
  Eye, 
  X, 
  WarningCircle, 
  CheckCircle, 
  ExclamationMark,
  Calendar,
  Zap,
  Search
} from '@phosphor-icons/react'
import { toast } from 'sonner'
import { 
  analyzeTampering, 
  generateTamperingReport, 
  type DocumentForAnalysis, 
  type TamperingFlag,
  type DateGroupAnalysis 
} from '@/lib/tamperingAnalyzer'

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
  currentVersion: number
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

interface TamperingDetectorProps {
  documents: Document[]
  documentVersions: DocumentVersion[]
  isOpen: boolean
  onClose: () => void
}

export const TamperingDetector: React.FC<TamperingDetectorProps> = ({
  documents,
  documentVersions,
  isOpen,
  onClose
}) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisProgress, setAnalysisProgress] = useState(0)
  const [analysisResults, setAnalysisResults] = useState<ReturnType<typeof analyzeTampering> | null>(null)
  const [selectedDateGroup, setSelectedDateGroup] = useState<DateGroupAnalysis | null>(null)
  const [reportText, setReportText] = useState('')

  // Convert documents to analysis format
  const documentsForAnalysis: DocumentForAnalysis[] = useMemo(() => {
    return documents.map(doc => ({
      id: doc.id,
      fileName: doc.fileName,
      title: doc.title,
      description: doc.description,
      textContent: doc.textContent,
      uploadedAt: doc.uploadedAt,
      category: doc.category,
      children: doc.children,
      laws: doc.laws,
      lastModified: doc.lastModified,
      lastModifiedBy: doc.lastModifiedBy,
      currentVersion: doc.currentVersion || 1
    }))
  }, [documents])

  // Run analysis when dialog opens or documents change
  useEffect(() => {
    if (isOpen && documentsForAnalysis.length > 0) {
      runTamperingAnalysis()
    }
  }, [isOpen, documentsForAnalysis])

  const runTamperingAnalysis = async () => {
    setIsAnalyzing(true)
    setAnalysisProgress(0)
    
    try {
      // Simulate progress for UX
      const progressSteps = [
        { progress: 20, message: 'Extracting document dates...' },
        { progress: 40, message: 'Grouping documents by date...' },
        { progress: 60, message: 'Analyzing name mentions...' },
        { progress: 80, message: 'Detecting content changes...' },
        { progress: 90, message: 'Checking timeline consistency...' },
        { progress: 100, message: 'Analysis complete!' }
      ]
      
      for (const step of progressSteps) {
        await new Promise(resolve => setTimeout(resolve, 300))
        setAnalysisProgress(step.progress)
      }
      
      // Run the actual analysis
      const results = analyzeTampering(documentsForAnalysis)
      setAnalysisResults(results)
      
      // Generate the detailed report
      const report = generateTamperingReport(results, documentsForAnalysis)
      setReportText(report)
      
      const { overallRiskAssessment } = results
      if (overallRiskAssessment.criticalFlags > 0) {
        toast.error(`🚨 CRITICAL: ${overallRiskAssessment.criticalFlags} critical tampering indicators detected!`)
      } else if (overallRiskAssessment.totalFlags > 0) {
        toast.warning(`⚠️ ${overallRiskAssessment.totalFlags} potential tampering indicators found`)
      } else {
        toast.success('✅ No significant tampering indicators detected')
      }
    } catch (error) {
      console.error('Analysis error:', error)
      toast.error('Analysis failed: ' + (error instanceof Error ? error.message : 'Unknown error'))
    } finally {
      setIsAnalyzing(false)
    }
  }

  const exportReport = () => {
    if (!analysisResults || !reportText) {
      toast.error('No analysis results to export')
      return
    }

    // Export detailed JSON
    const jsonBlob = new Blob([JSON.stringify(analysisResults, null, 2)], { type: 'application/json' })
    const jsonUrl = URL.createObjectURL(jsonBlob)
    const jsonLink = document.createElement('a')
    jsonLink.href = jsonUrl
    jsonLink.download = `tampering-analysis-${new Date().toISOString().split('T')[0]}.json`
    jsonLink.click()
    URL.revokeObjectURL(jsonUrl)

    // Export markdown report
    const mdBlob = new Blob([reportText], { type: 'text/markdown' })
    const mdUrl = URL.createObjectURL(mdBlob)
    const mdLink = document.createElement('a')
    mdLink.href = mdUrl
    mdLink.download = `tampering-report-${new Date().toISOString().split('T')[0]}.md`
    mdLink.click()
    URL.revokeObjectURL(mdUrl)

    toast.success('Analysis reports exported')
  }

  const getSeverityColor = (severity: TamperingFlag['severity']) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200'
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getRiskLevelColor = (risk: DateGroupAnalysis['riskLevel']) => {
    switch (risk) {
      case 'critical': return 'bg-red-600 text-white'
      case 'high': return 'bg-orange-600 text-white'
      case 'medium': return 'bg-yellow-600 text-white'
      case 'low': return 'bg-green-600 text-white'
      default: return 'bg-gray-600 text-white'
    }
  }

  const getTypeIcon = (type: TamperingFlag['type']) => {
    switch (type) {
      case 'content_change': return <FileText className="h-4 w-4" />
      case 'metadata_inconsistency': return <AlertTriangle className="h-4 w-4" />
      case 'timeline_conflict': return <Clock className="h-4 w-4" />
      case 'name_discrepancy': return <Users className="h-4 w-4" />
      case 'evidence_omission': return <ExclamationMark className="h-4 w-4" />
      default: return <WarningCircle className="h-4 w-4" />
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-7xl max-h-[95vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            Advanced Document Tampering Detection
            {analysisResults && (
              <Badge className={analysisResults.overallRiskAssessment.criticalFlags > 0 ? 'bg-red-600' : 'bg-orange-600'}>
                {analysisResults.overallRiskAssessment.totalFlags} flags detected
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden flex flex-col">
          {isAnalyzing ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center space-y-4 max-w-md">
                <Zap className="h-12 w-12 text-orange-600 mx-auto animate-pulse" />
                <h3 className="text-lg font-semibold">Analyzing Documents for Tampering</h3>
                <p className="text-muted-foreground">
                  Running comprehensive analysis on {documentsForAnalysis.length} documents...
                </p>
                <Progress value={analysisProgress} className="w-full" />
                <div className="text-sm text-muted-foreground">
                  {analysisProgress < 100 ? 'Processing...' : 'Complete!'}
                </div>
              </div>
            </div>
          ) : analysisResults ? (
            <Tabs defaultValue="overview" className="flex-1 flex flex-col">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="date-groups">Date Groups</TabsTrigger>
                <TabsTrigger value="timeline">Timeline Issues</TabsTrigger>
                <TabsTrigger value="report">Full Report</TabsTrigger>
              </TabsList>

              <div className="flex-1 overflow-y-auto space-y-4 mt-4">
                <TabsContent value="overview" className="space-y-4 mt-0">
                  {/* Risk Summary */}
                  <Card className="bg-gradient-to-r from-orange-50 to-red-50 border-orange-200">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Shield className="h-5 w-5 text-orange-600" />
                        Risk Assessment Summary
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">{documentsForAnalysis.length}</div>
                          <div className="text-muted-foreground">Documents Analyzed</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-orange-600">{analysisResults.overallRiskAssessment.totalFlags}</div>
                          <div className="text-muted-foreground">Total Flags</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-red-600">{analysisResults.overallRiskAssessment.criticalFlags}</div>
                          <div className="text-muted-foreground">Critical Issues</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-purple-600">{analysisResults.dateGroupAnalyses.length}</div>
                          <div className="text-muted-foreground">Date Groups</div>
                        </div>
                      </div>
                      
                      <Alert className={
                        analysisResults.overallRiskAssessment.criticalFlags > 0 ? 'border-red-200 bg-red-50' : 
                        analysisResults.overallRiskAssessment.totalFlags > 0 ? 'border-orange-200 bg-orange-50' : 
                        'border-green-200 bg-green-50'
                      }>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          <div className="font-medium">{analysisResults.overallRiskAssessment.summary}</div>
                        </AlertDescription>
                      </Alert>
                      
                      <div className="mt-4 flex justify-between items-center">
                        <div className="text-xs text-muted-foreground">
                          Analysis includes date-based comparison, name mention tracking, and timeline verification
                        </div>
                        <div className="flex gap-2">
                          <Button onClick={runTamperingAnalysis} size="sm" variant="outline">
                            <Search className="h-3 w-3 mr-1" />
                            Re-analyze
                          </Button>
                          <Button onClick={exportReport} size="sm" variant="outline">
                            <Download className="h-3 w-3 mr-1" />
                            Export Report
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* High Risk Documents */}
                  {analysisResults.overallRiskAssessment.highRiskDocuments.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                          <WarningCircle className="h-5 w-5 text-red-600" />
                          High-Risk Documents Requiring Immediate Review
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {analysisResults.overallRiskAssessment.highRiskDocuments.map(docId => {
                            const doc = documentsForAnalysis.find(d => d.id === docId)
                            if (!doc) return null
                            
                            return (
                              <div key={docId} className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
                                <div>
                                  <div className="font-medium">{doc.title}</div>
                                  <div className="text-sm text-muted-foreground">{doc.fileName}</div>
                                </div>
                                <Badge className="bg-red-600 text-white">
                                  High Risk
                                </Badge>
                              </div>
                            )
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="date-groups" className="space-y-4 mt-0">
                  {analysisResults.dateGroupAnalyses.length === 0 ? (
                    <Card>
                      <CardContent className="py-12 text-center">
                        <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No Date Groups Found</h3>
                        <p className="text-muted-foreground">
                          No documents with matching dates were found for comparison analysis.
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-4">
                      {analysisResults.dateGroupAnalyses.map((group, index) => (
                        <Card key={`${group.date}-${index}`} className={`border-l-4 ${
                          group.riskLevel === 'critical' ? 'border-l-red-500' :
                          group.riskLevel === 'high' ? 'border-l-orange-500' :
                          group.riskLevel === 'medium' ? 'border-l-yellow-500' :
                          'border-l-green-500'
                        }`}>
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <Badge variant="outline" className="bg-blue-50 text-blue-700">
                                  <Calendar className="h-3 w-3 mr-1" />
                                  {group.date}
                                </Badge>
                                <Badge className={getRiskLevelColor(group.riskLevel)}>
                                  {group.riskLevel.toUpperCase()} RISK
                                </Badge>
                                <Badge variant="outline">
                                  {group.tamperingIndicators.length} flags
                                </Badge>
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {group.documents.length} documents
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            {/* Document List */}
                            <div>
                              <h4 className="font-medium mb-2">Documents in this group:</h4>
                              <div className="space-y-1">
                                {group.documents.map(doc => (
                                  <div key={doc.id} className="text-sm text-muted-foreground">
                                    • {doc.title} ({doc.fileName})
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Tampering Indicators */}
                            {group.tamperingIndicators.length > 0 && (
                              <div>
                                <h4 className="font-medium mb-2">Tampering Indicators:</h4>
                                <div className="space-y-2">
                                  {group.tamperingIndicators.map((flag, idx) => (
                                    <Alert key={idx} className={getSeverityColor(flag.severity)}>
                                      <div className="flex items-center gap-2">
                                        {getTypeIcon(flag.type)}
                                        <div className="flex-1">
                                          <div className="font-medium">{flag.description}</div>
                                          <div className="text-xs mt-1">
                                            Confidence: {flag.confidence}% • Type: {flag.type.replace('_', ' ')}
                                          </div>
                                          {flag.evidence.length > 0 && (
                                            <details className="mt-2">
                                              <summary className="cursor-pointer text-xs font-medium">Evidence</summary>
                                              <ul className="mt-1 space-y-1">
                                                {flag.evidence.map((evidence, eIdx) => (
                                                  <li key={eIdx} className="text-xs">• {evidence}</li>
                                                ))}
                                              </ul>
                                            </details>
                                          )}
                                        </div>
                                        <Badge variant="outline" className={getSeverityColor(flag.severity)}>
                                          {flag.severity}
                                        </Badge>
                                      </div>
                                    </Alert>
                                  ))}
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="timeline" className="space-y-4 mt-0">
                  {analysisResults.timelineFlags.length === 0 ? (
                    <Card>
                      <CardContent className="py-12 text-center">
                        <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-green-700 mb-2">No Timeline Issues</h3>
                        <p className="text-muted-foreground">
                          No suspicious timeline inconsistencies detected in document modification history.
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-3">
                      {analysisResults.timelineFlags.map((flag, index) => (
                        <Alert key={index} className={getSeverityColor(flag.severity)}>
                          <Clock className="h-4 w-4" />
                          <AlertDescription>
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <div className="font-medium">{flag.description}</div>
                                <Badge variant="outline" className={getSeverityColor(flag.severity)}>
                                  {flag.severity} • {flag.confidence}%
                                </Badge>
                              </div>
                              {flag.evidence.length > 0 && (
                                <div className="text-xs space-y-1">
                                  {flag.evidence.map((evidence, eIdx) => (
                                    <div key={eIdx}>• {evidence}</div>
                                  ))}
                                </div>
                              )}
                              {flag.location && (
                                <div className="text-xs text-muted-foreground">
                                  Location: {flag.location}
                                </div>
                              )}
                            </div>
                          </AlertDescription>
                        </Alert>
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="report" className="space-y-4 mt-0">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Detailed Analysis Report
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Textarea
                        value={reportText}
                        readOnly
                        className="min-h-[400px] font-mono text-xs"
                        placeholder="Analysis report will appear here..."
                      />
                      <div className="mt-3 flex justify-end">
                        <Button onClick={exportReport} size="sm">
                          <Download className="h-3 w-3 mr-1" />
                          Export Full Report
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </div>
            </Tabs>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center space-y-4">
                <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto" />
                <h3 className="text-lg font-semibold">Ready to Analyze</h3>
                <p className="text-muted-foreground">
                  Click the button below to start comprehensive tampering detection analysis
                </p>
                <Button onClick={runTamperingAnalysis}>
                  <Search className="h-4 w-4 mr-2" />
                  Start Analysis
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}