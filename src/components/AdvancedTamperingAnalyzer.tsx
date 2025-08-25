import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { AlertTriangle, FileText, GitCompare, Eye, Download, Clock, TrendingUp, Shield, Database, ChartLine } from '@phosphor-icons/react'
import { analyzeAdvancedTampering, exportForensicReport, type TamperingReport } from '@/lib/advancedTamperingDetector'
import { sampleDocumentsWithDates, documentMetadata } from '@/data/sampleDocumentsWithDates'
import { toast } from 'sonner'

interface Document {
  id: string
  fileName: string
  title: string
  description: string
  textContent?: string
  uploadedAt: string
  lastModified: string
  lastModifiedBy: string
  currentVersion: number
  category: string
  children: string[]
  laws: string[]
}

interface Props {
  documents: Document[]
  isOpen: boolean
  onClose: () => void
}

const AdvancedTamperingAnalyzer: React.FC<Props> = ({ documents, isOpen, onClose }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisProgress, setAnalysisProgress] = useState(0)
  const [currentReport, setCurrentReport] = useState<TamperingReport | null>(null)
  const [selectedPattern, setSelectedPattern] = useState<string | null>(null)
  const [showForensicExport, setShowForensicExport] = useState(false)
  const [useSampleData, setUseSampleData] = useState(false)

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (!isOpen) {
      setCurrentReport(null)
      setAnalysisProgress(0)
      setSelectedPattern(null)
    }
  }, [isOpen])

  const runAdvancedAnalysis = async (useTestData = false) => {
    setIsAnalyzing(true)
    setAnalysisProgress(0)
    
    try {
      // Use either real documents or test data
      const analyzeData = useTestData ? sampleDocumentsWithDates : documents.filter(doc => doc.textContent)
      
      if (analyzeData.length === 0) {
        toast.error('No documents with text content found for analysis')
        setIsAnalyzing(false)
        return
      }

      // Simulate analysis progress
      setAnalysisProgress(10)
      toast.info(`Starting advanced analysis on ${analyzeData.length} documents...`)
      
      await new Promise(resolve => setTimeout(resolve, 500))
      setAnalysisProgress(30)
      
      // Run the advanced tampering analysis
      const report = analyzeAdvancedTampering(analyzeData)
      
      setAnalysisProgress(70)
      await new Promise(resolve => setTimeout(resolve, 300))
      
      setAnalysisProgress(100)
      setCurrentReport(report)
      
      // Show results summary
      const { riskLevel, patternsDetected } = report
      if (riskLevel === 'critical') {
        toast.error(`🚨 CRITICAL: ${patternsDetected.filter(p => p.severity === 'critical').length} critical tampering indicators detected!`)
      } else if (riskLevel === 'high') {
        toast.warning(`⚠️ HIGH RISK: ${patternsDetected.filter(p => p.severity === 'high').length} high-severity patterns found`)
      } else if (patternsDetected.length > 0) {
        toast.warning(`ℹ️ ${patternsDetected.length} potential tampering indicators detected`)
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

  const exportForensicReports = () => {
    if (!currentReport) return
    
    try {
      const { executiveReport, technicalReport, evidenceLog } = exportForensicReport(currentReport)
      const timestamp = new Date().toISOString().split('T')[0]
      
      // Export Executive Summary
      const execBlob = new Blob([executiveReport], { type: 'text/plain' })
      const execUrl = URL.createObjectURL(execBlob)
      const execLink = document.createElement('a')
      execLink.href = execUrl
      execLink.download = `EXECUTIVE-SUMMARY-Tampering-${timestamp}.txt`
      execLink.click()
      URL.revokeObjectURL(execUrl)
      
      // Export Technical Report
      const techBlob = new Blob([technicalReport], { type: 'text/plain' })
      const techUrl = URL.createObjectURL(techBlob)
      const techLink = document.createElement('a')
      techLink.href = techUrl
      techLink.download = `TECHNICAL-REPORT-Tampering-${timestamp}.txt`
      techLink.click()
      URL.revokeObjectURL(techUrl)
      
      // Export Evidence Log CSV
      const csvBlob = new Blob([evidenceLog], { type: 'text/csv' })
      const csvUrl = URL.createObjectURL(csvBlob)
      const csvLink = document.createElement('a')
      csvLink.href = csvUrl
      csvLink.download = `EVIDENCE-LOG-Tampering-${timestamp}.csv`
      csvLink.click()
      URL.revokeObjectURL(csvUrl)
      
      toast.success('Forensic reports exported successfully')
    } catch (error) {
      toast.error('Export failed: ' + (error instanceof Error ? error.message : 'Unknown error'))
    }
  }

  const loadSampleDataForTesting = () => {
    // Add sample documents to analysis
    setUseSampleData(true)
    toast.success(`Loaded ${sampleDocumentsWithDates.length} sample documents with temporal patterns for tampering detection`)
  }

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200'
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'moderate': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200'
      default: return 'bg-green-100 text-green-800 border-green-200'
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500'
      case 'high': return 'bg-orange-500'
      case 'medium': return 'bg-yellow-500'
      default: return 'bg-blue-500'
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[95vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-6 w-6 text-orange-600" />
            Advanced Evidence Tampering Detection System
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto">
          <Tabs defaultValue="analysis" className="h-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="analysis">Analysis Dashboard</TabsTrigger>
              <TabsTrigger value="patterns">Pattern Details</TabsTrigger>
              <TabsTrigger value="timeline">Timeline Analysis</TabsTrigger>
              <TabsTrigger value="export">Forensic Export</TabsTrigger>
            </TabsList>

            <TabsContent value="analysis" className="space-y-6 mt-6">
              {/* Control Panel */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Analysis Control Panel
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {!currentReport && (
                    <div className="bg-muted/50 rounded-lg p-4">
                      <h4 className="font-semibold mb-2">Document Analysis Options</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground mb-3">
                            Analyze your uploaded documents for tampering indicators including name changes, 
                            evidence alterations, and timeline inconsistencies.
                          </p>
                          <Button 
                            onClick={() => runAdvancedAnalysis(false)}
                            disabled={isAnalyzing || documents.filter(d => d.textContent).length === 0}
                            className="w-full"
                          >
                            <Database className="h-4 w-4 mr-2" />
                            Analyze Your Documents ({documents.filter(d => d.textContent).length} available)
                          </Button>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground mb-3">
                            Test the system with sample documents containing known tampering patterns 
                            and temporal alterations for demonstration purposes.
                          </p>
                          <Button 
                            onClick={() => runAdvancedAnalysis(true)}
                            disabled={isAnalyzing}
                            variant="outline"
                            className="w-full"
                          >
                            <FileText className="h-4 w-4 mr-2" />
                            Analyze Sample Data (Demo)
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {isAnalyzing && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Running Advanced Tampering Analysis...</span>
                        <span className="text-sm text-muted-foreground">{analysisProgress}%</span>
                      </div>
                      <Progress value={analysisProgress} className="w-full" />
                      <div className="text-xs text-muted-foreground">
                        Analyzing document fingerprints, name frequency patterns, evidence consistency, and temporal markers...
                      </div>
                    </div>
                  )}

                  {currentReport && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <Card className={`border-2 ${getRiskLevelColor(currentReport.riskLevel)}`}>
                        <CardContent className="p-4 text-center">
                          <div className="text-2xl font-bold">{currentReport.riskLevel.toUpperCase()}</div>
                          <div className="text-sm">Risk Level</div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4 text-center">
                          <div className="text-2xl font-bold text-blue-600">{currentReport.documentsAnalyzed}</div>
                          <div className="text-sm text-muted-foreground">Documents Analyzed</div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4 text-center">
                          <div className="text-2xl font-bold text-orange-600">{currentReport.patternsDetected.length}</div>
                          <div className="text-sm text-muted-foreground">Patterns Detected</div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4 text-center">
                          <div className="text-2xl font-bold text-purple-600">{currentReport.confidenceScore}%</div>
                          <div className="text-sm text-muted-foreground">Confidence Score</div>
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Executive Summary */}
              {currentReport && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Executive Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-muted/30 rounded-lg p-4">
                      <p className="text-sm">{currentReport.executiveSummary}</p>
                    </div>
                    
                    {currentReport.recommendations.length > 0 && (
                      <div className="mt-4">
                        <h4 className="font-semibold mb-2">Immediate Recommendations:</h4>
                        <ul className="space-y-1 text-sm">
                          {currentReport.recommendations.slice(0, 3).map((rec, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <span className="text-orange-600 mt-1">•</span>
                              <span>{rec}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Pattern Overview */}
              {currentReport && currentReport.patternsDetected.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <GitCompare className="h-5 w-5" />
                      Detected Patterns Overview
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {currentReport.patternsDetected.slice(0, 6).map((pattern, idx) => (
                        <Card key={idx} className="hover:shadow-md transition-shadow cursor-pointer" 
                              onClick={() => setSelectedPattern(pattern.type)}>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-2">
                              <Badge className={getSeverityColor(pattern.severity) + ' text-white'}>
                                {pattern.severity.toUpperCase()}
                              </Badge>
                              <span className="text-xs text-muted-foreground">{pattern.confidence}%</span>
                            </div>
                            <h4 className="font-medium text-sm mb-1">
                              {pattern.type.replace('_', ' ').toUpperCase()}
                            </h4>
                            <p className="text-xs text-muted-foreground">{pattern.description}</p>
                            <div className="mt-2 text-xs">
                              <span className="text-muted-foreground">Location: </span>
                              <span>{pattern.location}</span>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                    
                    {currentReport.patternsDetected.length > 6 && (
                      <div className="mt-4 text-center">
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-2" />
                          View All {currentReport.patternsDetected.length} Patterns
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="patterns" className="space-y-6 mt-6">
              {currentReport && currentReport.patternsDetected.length > 0 ? (
                <div className="space-y-4">
                  {currentReport.patternsDetected.map((pattern, idx) => (
                    <Card key={idx} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Badge className={getSeverityColor(pattern.severity) + ' text-white'}>
                              {pattern.severity.toUpperCase()}
                            </Badge>
                            <div>
                              <h3 className="font-semibold">{pattern.type.replace('_', ' ').toUpperCase()}</h3>
                              <p className="text-sm text-muted-foreground">{pattern.location}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold">{pattern.confidence}%</div>
                            <div className="text-xs text-muted-foreground">Confidence</div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm mb-3">{pattern.description}</p>
                        
                        <div className="bg-muted/30 rounded-lg p-3">
                          <h4 className="font-medium text-sm mb-2">Evidence:</h4>
                          <ul className="space-y-1 text-xs">
                            {pattern.evidence.map((evidence, evidenceIdx) => (
                              <li key={evidenceIdx} className="flex items-start gap-2">
                                <span className="text-muted-foreground mt-0.5">•</span>
                                <span>{evidence}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-semibold mb-2">No Analysis Results</h3>
                  <p className="text-muted-foreground">Run an analysis to see detailed pattern detection results.</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="timeline" className="space-y-6 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Temporal Analysis Dashboard
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-muted/50 rounded-lg p-4">
                    <h4 className="font-semibold mb-2">Timeline-Based Tampering Detection</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      This analysis examines document creation times, modification patterns, and temporal relationships 
                      to identify potential evidence tampering through timeline manipulation.
                    </p>
                    
                    {currentReport && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                          <div>
                            <div className="text-xl font-bold text-blue-600">{currentReport.documentsAnalyzed}</div>
                            <div className="text-xs text-muted-foreground">Documents Analyzed</div>
                          </div>
                          <div>
                            <div className="text-xl font-bold text-orange-600">
                              {currentReport.patternsDetected.filter(p => p.type === 'timestamp_manipulation').length}
                            </div>
                            <div className="text-xs text-muted-foreground">Timestamp Issues</div>
                          </div>
                          <div>
                            <div className="text-xl font-bold text-red-600">
                              {currentReport.patternsDetected.filter(p => p.type === 'content_insertion').length}
                            </div>
                            <div className="text-xs text-muted-foreground">Content Changes</div>
                          </div>
                          <div>
                            <div className="text-xl font-bold text-purple-600">
                              {currentReport.patternsDetected.filter(p => p.type === 'cross_reference_break').length}
                            </div>
                            <div className="text-xs text-muted-foreground">Reference Breaks</div>
                          </div>
                        </div>
                        
                        <div className="border-t pt-4">
                          <h5 className="font-medium mb-2">Sample Data Analysis</h5>
                          <div className="text-sm text-muted-foreground">
                            The sample documents demonstrate temporal patterns including same-day document revisions, 
                            retroactive modifications, and cross-reference inconsistencies that are typical indicators 
                            of evidence tampering.
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="export" className="space-y-6 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Download className="h-5 w-5" />
                    Forensic Report Export
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {currentReport ? (
                    <div>
                      <div className="bg-muted/50 rounded-lg p-4 mb-4">
                        <h4 className="font-semibold mb-2">Professional Forensic Reports</h4>
                        <p className="text-sm text-muted-foreground">
                          Export comprehensive tampering analysis reports suitable for legal proceedings 
                          and oversight agency submission.
                        </p>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card>
                          <CardContent className="p-4 text-center">
                            <ChartLine className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                            <h4 className="font-medium mb-1">Executive Summary</h4>
                            <p className="text-xs text-muted-foreground mb-3">High-level findings for decision makers</p>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="p-4 text-center">
                            <FileText className="h-8 w-8 mx-auto mb-2 text-green-600" />
                            <h4 className="font-medium mb-1">Technical Report</h4>
                            <p className="text-xs text-muted-foreground mb-3">Detailed analysis methodology and results</p>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="p-4 text-center">
                            <Database className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                            <h4 className="font-medium mb-1">Evidence Log</h4>
                            <p className="text-xs text-muted-foreground mb-3">Structured CSV data for database import</p>
                          </CardContent>
                        </Card>
                      </div>
                      
                      <div className="flex justify-center pt-4">
                        <Button onClick={exportForensicReports} className="w-full md:w-auto">
                          <Download className="h-4 w-4 mr-2" />
                          Export All Forensic Reports
                        </Button>
                      </div>
                      
                      <div className="text-xs text-center text-muted-foreground mt-4">
                        Reports include analysis ID: {currentReport.analysisId}<br/>
                        Generated: {new Date(currentReport.timestamp).toLocaleString()}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Download className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                      <h3 className="text-lg font-semibold mb-2">No Analysis Available</h3>
                      <p className="text-muted-foreground">Run a tampering analysis first to generate exportable reports.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default AdvancedTamperingAnalyzer