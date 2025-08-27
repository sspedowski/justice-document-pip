/**
 * Pattern Analysis Display Component
 * 
 * Displays comprehensive pattern analysis results for systematic document alterations
 */

import React, { useState, useEffect, useMemo } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Warning, 
  Shield, 
  Clock, 
  Users, 
  Eye, 
  Download, 
  ChartLine,
  GitBranch,
  Scales,
  X,
  CheckCircle,
  AlertTriangle,
  FileText,
  Target
} from '@phosphor-icons/react'
import { toast } from 'sonner'
import type { Document, DocumentVersion } from '@/lib/types'
import { 
  analyzeDocumentPatterns, 
  type PatternAnalysisResult, 
  type SystematicPattern,
  type CrossDocumentInconsistency,
  type LegalImplication
} from '@/lib/patternAnalyzer'

interface PatternAnalysisDisplayProps {
  documents: Document[]
  documentVersions: DocumentVersion[]
  isOpen: boolean
  onClose: () => void
}

export default function PatternAnalysisDisplay({
  documents,
  documentVersions,
  isOpen,
  onClose
}: PatternAnalysisDisplayProps) {
  const [analysisResult, setAnalysisResult] = useState<PatternAnalysisResult | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [selectedPattern, setSelectedPattern] = useState<SystematicPattern | null>(null)
  const [activeTab, setActiveTab] = useState('overview')

  // Run analysis when dialog opens
  useEffect(() => {
    if (isOpen && documents.length > 0) {
      runPatternAnalysis()
    }
  }, [isOpen, documents, documentVersions])

  const runPatternAnalysis = async () => {
    setIsAnalyzing(true)
    setAnalysisResult(null)
    
    try {
      // Add a delay to show the analysis process
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const result = analyzeDocumentPatterns(documents, documentVersions)
      setAnalysisResult(result)
      
      if (result.overallRisk === 'CRITICAL') {
        toast.error(`🚨 CRITICAL RISK DETECTED: ${result.systematicPatterns.length} systematic patterns found`, {
          description: 'Immediate investigation required. Legal violations detected.',
          duration: 8000
        })
      } else if (result.overallRisk === 'HIGH') {
        toast.warning(`⚠️ HIGH RISK: ${result.systematicPatterns.length} patterns detected`, {
          description: 'Detailed examination recommended.',
          duration: 6000
        })
      } else {
        toast.success(`✅ Analysis complete: ${result.overallRisk} risk level`, {
          description: `${result.systematicPatterns.length} patterns found across ${documents.length} documents`
        })
      }
    } catch (error) {
      console.error('Pattern analysis error:', error)
      toast.error('Failed to complete pattern analysis')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const exportAnalysisReport = () => {
    if (!analysisResult) return

    const reportData = {
      analysis: analysisResult,
      metadata: {
        generatedAt: new Date().toISOString(),
        documentsAnalyzed: documents.length,
        versionsAnalyzed: documentVersions.length,
        systemVersion: '1.0.0'
      }
    }

    // Export JSON
    const jsonBlob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' })
    const jsonUrl = URL.createObjectURL(jsonBlob)
    const jsonLink = document.createElement('a')
    jsonLink.href = jsonUrl
    jsonLink.download = `pattern-analysis-${new Date().toISOString().split('T')[0]}.json`
    jsonLink.click()
    URL.revokeObjectURL(jsonUrl)

    // Export executive summary
    const executiveSummary = generateExecutiveSummary(analysisResult)
    const textBlob = new Blob([executiveSummary], { type: 'text/plain' })
    const textUrl = URL.createObjectURL(textBlob)
    const textLink = document.createElement('a')
    textLink.href = textUrl
    textLink.download = `pattern-analysis-executive-summary-${new Date().toISOString().split('T')[0]}.txt`
    textLink.click()
    URL.revokeObjectURL(textUrl)

    toast.success('Pattern analysis reports exported')
  }

  const generateExecutiveSummary = (result: PatternAnalysisResult): string => {
    return `
PATTERN ANALYSIS EXECUTIVE SUMMARY
Generated: ${new Date().toLocaleString()}
System: Justice Document Manager - Advanced Pattern Detection

OVERALL RISK ASSESSMENT: ${result.overallRisk}
CONFIDENCE LEVEL: ${Math.round(result.confidence * 100)}%

SUMMARY STATISTICS:
• Documents Analyzed: ${documents.length}
• Systematic Patterns Detected: ${result.systematicPatterns.length}
• Cross-Document Inconsistencies: ${result.crossDocumentInconsistencies.length}
• Temporal Anomalies: ${result.temporalAnomalies.length}
• Legal Implications: ${result.legalImplications.length}

SYSTEMATIC PATTERNS DETECTED:
${result.systematicPatterns.map((pattern, index) => `
${index + 1}. ${pattern.type.toUpperCase().replace(/_/g, ' ')}
   Severity: ${pattern.severity}
   Confidence: ${Math.round(pattern.confidence * 100)}%
   Documents Affected: ${pattern.affectedDocuments.length}
   Description: ${pattern.description}
   Legal Implications: ${pattern.legalImplications.join('; ')}
`).join('')}

LEGAL IMPLICATIONS:
${result.legalImplications.map((impl, index) => `
${index + 1}. ${impl.violation} (${impl.severity})
   Description: ${impl.description}
   Affected Rights: ${impl.affectedRights.join(', ')}
   Precedents: ${impl.precedents.join(', ')}
`).join('')}

RECOMMENDATIONS:
${result.recommendations.map((rec, index) => `${index + 1}. ${rec}`).join('\n')}

${result.overallRisk === 'CRITICAL' ? `
🚨 CRITICAL ALERT: This analysis has detected systematic patterns consistent with 
coordinated evidence tampering and legal violations. Immediate federal oversight 
intervention is required. This report constitutes evidence of potential criminal activity.
` : result.overallRisk === 'HIGH' ? `
⚠️ HIGH RISK ALERT: Significant patterns detected that warrant immediate investigation
and potential legal action. Administrative and judicial oversight required.
` : `
Analysis completed. Patterns detected require review and potential corrective action.
`}

Generated by Justice Document Manager Pattern Analysis System
Suitable for: Legal proceedings, oversight submission, forensic examination
`.trim()
  }

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'CRITICAL': return 'text-red-800 bg-red-100 border-red-300'
      case 'HIGH': return 'text-orange-800 bg-orange-100 border-orange-300'
      case 'MODERATE': return 'text-yellow-800 bg-yellow-100 border-yellow-300'
      case 'LOW': return 'text-green-800 bg-green-100 border-green-300'
      default: return 'text-gray-800 bg-gray-100 border-gray-300'
    }
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return <Warning className="h-4 w-4 text-red-600" />
      case 'HIGH': return <AlertTriangle className="h-4 w-4 text-orange-600" />
      case 'MODERATE': return <Eye className="h-4 w-4 text-yellow-600" />
      case 'LOW': return <CheckCircle className="h-4 w-4 text-green-600" />
      default: return <FileText className="h-4 w-4 text-gray-600" />
    }
  }

  const PatternTypeIcon = ({ type }: { type: string }) => {
    switch (type) {
      case 'coordinated_alterations': return <GitBranch className="h-4 w-4" />
      case 'evidence_suppression': return <Shield className="h-4 w-4" />
      case 'witness_manipulation': return <Users className="h-4 w-4" />
      case 'timeline_manipulation': return <Clock className="h-4 w-4" />
      case 'status_changes': return <Target className="h-4 w-4" />
      default: return <Warning className="h-4 w-4" />
    }
  }

  if (!isOpen) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[95vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ChartLine className="h-5 w-5" />
            Advanced Pattern Analysis - Systematic Document Alterations
            {analysisResult && (
              <Badge className={getRiskColor(analysisResult.overallRisk)}>
                {analysisResult.overallRisk} RISK
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          {isAnalyzing ? (
            <div className="flex flex-col items-center justify-center h-full space-y-6">
              <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              <div className="text-center space-y-2">
                <h3 className="text-lg font-semibold">Analyzing Document Patterns...</h3>
                <p className="text-muted-foreground">
                  Examining {documents.length} documents and {documentVersions.length} versions for systematic alterations
                </p>
                <div className="w-80 space-y-2">
                  <Progress value={75} className="h-2" />
                  <div className="text-xs text-muted-foreground">
                    Detecting coordinated alterations, evidence suppression, and temporal anomalies...
                  </div>
                </div>
              </div>
            </div>
          ) : analysisResult ? (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
              <div className="flex items-center justify-between">
                <TabsList className="grid grid-cols-6 w-auto">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="patterns">
                    Patterns {analysisResult.systematicPatterns.length > 0 && `(${analysisResult.systematicPatterns.length})`}
                  </TabsTrigger>
                  <TabsTrigger value="inconsistencies">
                    Inconsistencies {analysisResult.crossDocumentInconsistencies.length > 0 && `(${analysisResult.crossDocumentInconsistencies.length})`}
                  </TabsTrigger>
                  <TabsTrigger value="timeline">Timeline</TabsTrigger>
                  <TabsTrigger value="legal">Legal</TabsTrigger>
                  <TabsTrigger value="findings">Findings</TabsTrigger>
                </TabsList>
                
                <div className="flex gap-2">
                  <Button onClick={exportAnalysisReport} variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Export Report
                  </Button>
                  <Button onClick={runPatternAnalysis} variant="outline" size="sm">
                    <ChartLine className="h-4 w-4 mr-2" />
                    Re-analyze
                  </Button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto mt-4">
                <TabsContent value="overview" className="space-y-6 m-0">
                  {/* Risk Assessment Card */}
                  <Card className={`border-2 ${getRiskColor(analysisResult.overallRisk)}`}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        {getSeverityIcon(analysisResult.overallRisk)}
                        Overall Risk Assessment: {analysisResult.overallRisk}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-primary">{Math.round(analysisResult.confidence * 100)}%</div>
                          <div className="text-sm text-muted-foreground">Confidence</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-red-600">{analysisResult.systematicPatterns.length}</div>
                          <div className="text-sm text-muted-foreground">Systematic Patterns</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-orange-600">{analysisResult.crossDocumentInconsistencies.length}</div>
                          <div className="text-sm text-muted-foreground">Inconsistencies</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-yellow-600">{analysisResult.temporalAnomalies.length}</div>
                          <div className="text-sm text-muted-foreground">Temporal Anomalies</div>
                        </div>
                      </div>
                      
                      {analysisResult.overallRisk === 'CRITICAL' && (
                        <Alert className="border-red-200 bg-red-50">
                          <Warning className="h-4 w-4 text-red-600" />
                          <AlertDescription className="text-red-800">
                            <strong>CRITICAL RISK DETECTED:</strong> Systematic evidence tampering patterns identified. 
                            Immediate federal oversight intervention required. This analysis constitutes evidence of potential criminal activity.
                          </AlertDescription>
                        </Alert>
                      )}
                      
                      {analysisResult.overallRisk === 'HIGH' && (
                        <Alert className="border-orange-200 bg-orange-50">
                          <AlertTriangle className="h-4 w-4 text-orange-600" />
                          <AlertDescription className="text-orange-800">
                            <strong>HIGH RISK:</strong> Significant systematic patterns detected requiring immediate investigation 
                            and potential legal action. Administrative and judicial oversight required.
                          </AlertDescription>
                        </Alert>
                      )}
                    </CardContent>
                  </Card>

                  {/* Summary Statistics */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          Documents Analyzed
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{documents.length}</div>
                        <div className="text-sm text-muted-foreground">
                          {documentVersions.length} versions tracked
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <GitBranch className="h-4 w-4" />
                          Pattern Categories
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {new Set(analysisResult.systematicPatterns.map(p => p.type)).size}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {analysisResult.systematicPatterns.length} total instances
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Scales className="h-4 w-4" />
                          Legal Implications
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{analysisResult.legalImplications.length}</div>
                        <div className="text-sm text-muted-foreground">
                          Violations identified
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Quick Patterns Overview */}
                  {analysisResult.systematicPatterns.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Key Pattern Types Detected</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {analysisResult.systematicPatterns.map((pattern, index) => (
                            <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                              <div className="flex items-center gap-3">
                                <PatternTypeIcon type={pattern.type} />
                                <div>
                                  <div className="font-medium">
                                    {pattern.type.replace(/_/g, ' ').toUpperCase()}
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    {pattern.affectedDocuments.length} documents affected
                                  </div>
                                </div>
                              </div>
                              <Badge className={getRiskColor(pattern.severity)}>
                                {pattern.severity}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="patterns" className="space-y-4 m-0">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Systematic Patterns Detected</h3>
                    <Badge variant="outline">
                      {analysisResult.systematicPatterns.length} patterns found
                    </Badge>
                  </div>

                  {analysisResult.systematicPatterns.length === 0 ? (
                    <Card>
                      <CardContent className="text-center py-12">
                        <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No Systematic Patterns Detected</h3>
                        <p className="text-muted-foreground">
                          Document analysis did not reveal coordinated alteration patterns or systematic tampering.
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-4">
                      {analysisResult.systematicPatterns.map((pattern, index) => (
                        <Card key={index} className="cursor-pointer hover:shadow-md transition-shadow"
                              onClick={() => setSelectedPattern(pattern)}>
                          <CardHeader>
                            <div className="flex items-center justify-between">
                              <CardTitle className="flex items-center gap-2">
                                <PatternTypeIcon type={pattern.type} />
                                {pattern.type.replace(/_/g, ' ').toUpperCase()}
                              </CardTitle>
                              <div className="flex items-center gap-2">
                                <Badge className={getRiskColor(pattern.severity)}>
                                  {pattern.severity}
                                </Badge>
                                <Badge variant="outline">
                                  {Math.round(pattern.confidence * 100)}% confidence
                                </Badge>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <p className="text-sm text-muted-foreground mb-3">
                              {pattern.description}
                            </p>
                            
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="font-medium">Affected Documents:</span>
                                <div className="text-muted-foreground">
                                  {pattern.affectedDocuments.length} documents
                                </div>
                              </div>
                              <div>
                                <span className="font-medium">Evidence Items:</span>
                                <div className="text-muted-foreground">
                                  {pattern.evidence.length} pieces of evidence
                                </div>
                              </div>
                            </div>
                            
                            <div className="mt-3">
                              <span className="font-medium text-sm">Legal Implications:</span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {pattern.legalImplications.slice(0, 3).map((impl, idx) => (
                                  <Badge key={idx} variant="secondary" className="text-xs">
                                    {impl}
                                  </Badge>
                                ))}
                                {pattern.legalImplications.length > 3 && (
                                  <Badge variant="secondary" className="text-xs">
                                    +{pattern.legalImplications.length - 3} more
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="inconsistencies" className="space-y-4 m-0">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Cross-Document Inconsistencies</h3>
                    <Badge variant="outline">
                      {analysisResult.crossDocumentInconsistencies.length} inconsistencies found
                    </Badge>
                  </div>

                  {analysisResult.crossDocumentInconsistencies.length === 0 ? (
                    <Card>
                      <CardContent className="text-center py-12">
                        <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No Cross-Document Inconsistencies</h3>
                        <p className="text-muted-foreground">
                          Documents appear to be internally consistent with no contradictory statements detected.
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-4">
                      {analysisResult.crossDocumentInconsistencies.map((inconsistency, index) => (
                        <Card key={index}>
                          <CardHeader>
                            <div className="flex items-center justify-between">
                              <CardTitle className="flex items-center gap-2">
                                {getSeverityIcon(inconsistency.severity)}
                                {inconsistency.type.replace(/_/g, ' ').toUpperCase()}
                              </CardTitle>
                              <div className="flex items-center gap-2">
                                <Badge className={getRiskColor(inconsistency.severity)}>
                                  {inconsistency.severity}
                                </Badge>
                                <Badge variant="outline">
                                  {Math.round(inconsistency.confidence * 100)}% confidence
                                </Badge>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <p className="text-sm text-muted-foreground mb-4">
                              {inconsistency.description}
                            </p>
                            
                            <div className="space-y-3">
                              <span className="font-medium text-sm">Conflicting Statements:</span>
                              {inconsistency.involvedDocuments.map((doc, idx) => (
                                <div key={idx} className="bg-muted/50 rounded p-3">
                                  <div className="font-medium text-sm">{doc.context}</div>
                                  <div className="text-sm text-muted-foreground mt-1">
                                    {doc.statement}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="timeline" className="space-y-4 m-0">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Manipulation Timeline</h3>
                    <Badge variant="outline">
                      {analysisResult.manipulationTimeline.length} events
                    </Badge>
                  </div>

                  <Card>
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        {analysisResult.manipulationTimeline.length === 0 ? (
                          <div className="text-center py-8 text-muted-foreground">
                            <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p>No timeline events to display</p>
                          </div>
                        ) : (
                          analysisResult.manipulationTimeline.map((event, index) => (
                            <div key={index} className="flex items-start gap-4">
                              <div className="flex flex-col items-center">
                                <div className={`w-3 h-3 rounded-full ${
                                  event.severity === 'CRITICAL' ? 'bg-red-500' :
                                  event.severity === 'HIGH' ? 'bg-orange-500' :
                                  event.severity === 'MODERATE' ? 'bg-yellow-500' : 'bg-green-500'
                                }`} />
                                {index < analysisResult.manipulationTimeline.length - 1 && (
                                  <div className="w-0.5 h-8 bg-muted mt-2" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <span className="font-medium text-sm">
                                    {event.type.toUpperCase()}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {new Date(event.timestamp).toLocaleString()}
                                  </span>
                                </div>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {event.description}
                                </p>
                                {event.indicators.length > 0 && (
                                  <div className="mt-2">
                                    <div className="text-xs font-medium">Indicators:</div>
                                    <div className="text-xs text-muted-foreground">
                                      {event.indicators.join(', ')}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="legal" className="space-y-4 m-0">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Legal Implications & Violations</h3>
                    <Badge variant="outline">
                      {analysisResult.legalImplications.length} violations identified
                    </Badge>
                  </div>

                  {analysisResult.legalImplications.length === 0 ? (
                    <Card>
                      <CardContent className="text-center py-12">
                        <Scales className="h-12 w-12 text-green-600 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No Legal Violations Detected</h3>
                        <p className="text-muted-foreground">
                          Current analysis does not indicate clear legal violations requiring immediate action.
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-4">
                      {analysisResult.legalImplications.map((implication, index) => (
                        <Card key={index}>
                          <CardHeader>
                            <div className="flex items-center justify-between">
                              <CardTitle className="flex items-center gap-2">
                                <Scales className="h-5 w-5" />
                                {implication.violation}
                              </CardTitle>
                              <Badge className={getRiskColor(implication.severity)}>
                                {implication.severity}
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <p className="text-sm text-muted-foreground">
                              {implication.description}
                            </p>
                            
                            <div>
                              <span className="font-medium text-sm">Affected Rights:</span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {implication.affectedRights.map((right, idx) => (
                                  <Badge key={idx} variant="secondary" className="text-xs">
                                    {right}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                            
                            <div>
                              <span className="font-medium text-sm">Legal Precedents:</span>
                              <div className="mt-1 text-sm text-muted-foreground">
                                {implication.precedents.join(', ')}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}

                  {/* Recommendations */}
                  {analysisResult.recommendations.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Recommended Actions</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {analysisResult.recommendations.map((recommendation, index) => (
                            <div key={index} className="flex items-start gap-2">
                              <Badge variant="outline" className="text-xs mt-0.5">
                                {index + 1}
                              </Badge>
                              <span className="text-sm">{recommendation}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="findings" className="space-y-4 m-0">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Detailed Findings</h3>
                    <Badge variant="outline">
                      {analysisResult.detailedFindings.length} findings
                    </Badge>
                  </div>

                  <div className="space-y-4">
                    {analysisResult.detailedFindings.map((finding, index) => (
                      <Card key={index}>
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-base">{finding.category}</CardTitle>
                            <Badge variant="outline">
                              {Math.round(finding.confidence * 100)}% confidence
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <p className="text-sm">{finding.description}</p>
                          
                          <div>
                            <span className="font-medium text-sm">Evidence:</span>
                            <ul className="mt-1 text-sm text-muted-foreground list-disc list-inside">
                              {finding.evidence.map((evidence, idx) => (
                                <li key={idx}>{evidence}</li>
                              ))}
                            </ul>
                          </div>
                          
                          <div>
                            <span className="font-medium text-sm">Legal Relevance:</span>
                            <p className="text-sm text-muted-foreground mt-1">
                              {finding.legalRelevance}
                            </p>
                          </div>
                          
                          <div>
                            <span className="font-medium text-sm">Recommended Action:</span>
                            <p className="text-sm text-muted-foreground mt-1">
                              {finding.recommendedAction}
                            </p>
                          </div>
                          
                          <div>
                            <span className="font-medium text-sm">Affected Documents:</span>
                            <div className="text-xs text-muted-foreground mt-1">
                              {finding.affectedDocuments.length} documents affected
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>
              </div>
            </Tabs>
          ) : (
            <div className="flex flex-col items-center justify-center h-full space-y-4">
              <ChartLine className="h-16 w-16 text-muted-foreground" />
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">Pattern Analysis Ready</h3>
                <p className="text-muted-foreground mb-4">
                  Ready to analyze {documents.length} documents for systematic alteration patterns
                </p>
                <Button onClick={runPatternAnalysis}>
                  <ChartLine className="h-4 w-4 mr-2" />
                  Start Pattern Analysis
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Pattern Detail Dialog */}
        {selectedPattern && (
          <Dialog open={!!selectedPattern} onOpenChange={() => setSelectedPattern(null)}>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <PatternTypeIcon type={selectedPattern.type} />
                  {selectedPattern.type.replace(/_/g, ' ').toUpperCase()} - Detailed Analysis
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Badge className={getRiskColor(selectedPattern.severity)}>
                    {selectedPattern.severity}
                  </Badge>
                  <Badge variant="outline">
                    {Math.round(selectedPattern.confidence * 100)}% confidence
                  </Badge>
                  <Badge variant="outline">
                    {selectedPattern.affectedDocuments.length} documents affected
                  </Badge>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Description</h4>
                  <p className="text-sm text-muted-foreground">
                    {selectedPattern.description}
                  </p>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Evidence</h4>
                  <div className="space-y-2">
                    {selectedPattern.evidence.map((evidence, idx) => (
                      <div key={idx} className="bg-muted/50 rounded p-3">
                        <div className="font-medium text-sm">{evidence.type.toUpperCase()}</div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {evidence.description}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Location: {evidence.location} | Confidence: {Math.round(evidence.confidence * 100)}%
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Legal Implications</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedPattern.legalImplications.map((impl, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {impl}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                {selectedPattern.timeline.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Timeline</h4>
                    <div className="text-sm text-muted-foreground">
                      {selectedPattern.timeline.map(date => new Date(date).toLocaleString()).join(', ')}
                    </div>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        )}
      </DialogContent>
    </Dialog>
  )
}