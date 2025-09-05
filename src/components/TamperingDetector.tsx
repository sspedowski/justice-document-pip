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
  Warning, 
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

    exportComprehensiveReports()
  }

  const exportComprehensiveReports = () => {
    if (!analysisResults) return

    const timestamp = new Date().toISOString().split('T')[0]
    const timeString = new Date().toISOString().replace(/[:.]/g, '-')

    // 1. Executive Summary for Oversight Agencies
    const executiveSummary = generateExecutiveSummary()
    const execBlob = new Blob([executiveSummary], { type: 'text/plain' })
    const execUrl = URL.createObjectURL(execBlob)
    const execLink = document.createElement('a')
    execLink.href = execUrl
    execLink.download = `EXECUTIVE-SUMMARY-Tampering-Analysis-${timestamp}.txt`
    execLink.click()
    URL.revokeObjectURL(execUrl)

    // 2. Detailed Technical Report (Markdown)
    const mdBlob = new Blob([reportText], { type: 'text/markdown' })
    const mdUrl = URL.createObjectURL(mdBlob)
    const mdLink = document.createElement('a')
    mdLink.href = mdUrl
    mdLink.download = `TECHNICAL-REPORT-Tampering-Analysis-${timestamp}.md`
    mdLink.click()
    URL.revokeObjectURL(mdUrl)

    // 3. Evidence Summary CSV
    const evidenceCsv = generateEvidenceCsv()
    const csvBlob = new Blob([evidenceCsv], { type: 'text/csv' })
    const csvUrl = URL.createObjectURL(csvBlob)
    const csvLink = document.createElement('a')
    csvLink.href = csvUrl
    csvLink.download = `EVIDENCE-SUMMARY-Tampering-Analysis-${timestamp}.csv`
    csvLink.click()
    URL.revokeObjectURL(csvUrl)

    // 4. Raw Analysis Data (JSON)
    const enhancedResults = {
      ...analysisResults,
      exportMetadata: {
        generatedAt: new Date().toISOString(),
        generatedBy: 'Justice Document Manager - Tampering Detection System',
        documentCount: documentsForAnalysis.length,
        analysisVersion: '2.0.0',
        purpose: 'Oversight Agency Submission',
        confidentialityLevel: 'RESTRICTED',
        chainOfCustody: {
          analyst: 'Automated System',
          reviewedBy: 'Pending Manual Review',
          approvedBy: 'Pending Supervisor Approval'
        }
      },
      documentManifest: documentsForAnalysis.map(doc => ({
        id: doc.id,
        fileName: doc.fileName,
        title: doc.title,
        category: doc.category,
        uploadedAt: doc.uploadedAt,
        lastModified: doc.lastModified,
        version: doc.currentVersion,
        textContentLength: doc.textContent?.length || 0,
        hasTextContent: !!doc.textContent
      }))
    }

    const jsonBlob = new Blob([JSON.stringify(enhancedResults, null, 2)], { type: 'application/json' })
    const jsonUrl = URL.createObjectURL(jsonBlob)
    const jsonLink = document.createElement('a')
    jsonLink.href = jsonUrl
    jsonLink.download = `RAW-DATA-Tampering-Analysis-${timestamp}.json`
    jsonLink.click()
    URL.revokeObjectURL(jsonUrl)

    // 5. Quick Reference Card for Investigators
    const quickRef = generateQuickReferenceCard()
    const refBlob = new Blob([quickRef], { type: 'text/plain' })
    const refUrl = URL.createObjectURL(refBlob)
    const refLink = document.createElement('a')
    refLink.href = refUrl
    refLink.download = `QUICK-REFERENCE-Tampering-Analysis-${timestamp}.txt`
    refLink.click()
    URL.revokeObjectURL(refUrl)

    toast.success(`📋 Comprehensive tampering detection package exported (5 files)`, {
      description: 'Executive summary, technical report, evidence CSV, raw data, and quick reference generated for oversight submission'
    })
  }

  const generateExecutiveSummary = (): string => {
    const { overallRiskAssessment, dateGroupAnalyses, timelineFlags } = analysisResults!
    const highRiskDocs = overallRiskAssessment.highRiskDocuments.length
    const criticalIssues = overallRiskAssessment.criticalFlags
    
    return `
EXECUTIVE SUMMARY
DOCUMENT TAMPERING DETECTION ANALYSIS
Generated: ${new Date().toLocaleString()}
System: Justice Document Manager - Automated Tampering Detection

==========================================
CRITICAL FINDINGS SUMMARY
==========================================

OVERALL RISK LEVEL: ${criticalIssues > 0 ? 'CRITICAL' : overallRiskAssessment.totalFlags > 5 ? 'HIGH' : overallRiskAssessment.totalFlags > 0 ? 'MODERATE' : 'LOW'}

• Documents Analyzed: ${documentsForAnalysis.length}
• Total Tampering Indicators: ${overallRiskAssessment.totalFlags}
• Critical Security Violations: ${criticalIssues}
• High-Risk Documents Requiring Immediate Review: ${highRiskDocs}
• Date Groups with Suspicious Activity: ${dateGroupAnalyses.filter(g => g.riskLevel === 'critical' || g.riskLevel === 'high').length}
• Timeline Anomalies Detected: ${timelineFlags.length}

==========================================
IMMEDIATE ACTION REQUIRED
==========================================

${criticalIssues > 0 ? `
🚨 CRITICAL ALERT: ${criticalIssues} critical tampering indicators detected.
   Immediate forensic review and investigation recommended.
   
High-Risk Documents:
${overallRiskAssessment.highRiskDocuments.map(id => {
  const doc = documentsForAnalysis.find(d => d.id === id)
  return `   • ${doc?.fileName || id} - ${doc?.title || 'Unknown'}`
}).join('\n')}
` : overallRiskAssessment.totalFlags > 0 ? `
⚠️  MODERATE RISK: ${overallRiskAssessment.totalFlags} potential tampering indicators found.
   Manual review recommended for flagged documents.
` : `
✅ LOW RISK: No significant tampering indicators detected.
   Documents appear to have maintained integrity.
`}

==========================================
KEY FINDINGS BY CATEGORY
==========================================

DATE-BASED ANALYSIS:
${dateGroupAnalyses.length === 0 ? '• No documents with matching dates found for comparison' : 
dateGroupAnalyses.map(group => `
• Date: ${group.date} (${group.documents.length} documents)
  Risk Level: ${group.riskLevel.toUpperCase()}
  Indicators: ${group.tamperingIndicators.length}
  ${group.tamperingIndicators.slice(0, 2).map(ind => `  - ${ind.description} (${ind.confidence}%)`).join('\n  ')}`).join('\n')}

TIMELINE ANALYSIS:
${timelineFlags.length === 0 ? '• No suspicious timeline inconsistencies detected' :
timelineFlags.slice(0, 3).map(flag => `• ${flag.description} (${flag.confidence}% confidence)`).join('\n')}

==========================================
TECHNICAL METHODOLOGY
==========================================

Analysis included:
• Content comparison across documents with matching dates
• Name mention frequency analysis (children: ${Array.from(new Set(documentsForAnalysis.flatMap(d => d.children))).join(', ')})
• Status and number alteration detection
• Timeline consistency verification
• Cross-reference validation

Confidence levels: High (80-100%), Medium (60-79%), Low (40-59%)

==========================================
CHAIN OF CUSTODY & VERIFICATION
==========================================

Analysis Performed: ${new Date().toLocaleString()}
System Version: Justice Document Manager v2.0.0
Analysis Algorithm: Automated Tampering Detection Engine
Manual Review Status: PENDING
Supervisor Approval: PENDING

This automated analysis should be supplemented with manual forensic examination
for any documents flagged as high-risk or critical.

==========================================
RECOMMENDATIONS FOR OVERSIGHT AGENCIES
==========================================

${criticalIssues > 0 ? `
IMMEDIATE ACTIONS:
1. Initiate formal investigation into flagged documents
2. Secure original document sources for comparison
3. Interview personnel with access to flagged documents
4. Implement enhanced document security protocols
5. Consider forensic digital analysis of source systems
` : overallRiskAssessment.totalFlags > 0 ? `
RECOMMENDED ACTIONS:
1. Manual review of flagged documents by trained personnel
2. Cross-reference with original sources where available
3. Document any discrepancies found during manual review
4. Implement monitoring for future document changes
` : `
MAINTENANCE ACTIONS:
1. Continue periodic automated scanning
2. Maintain current document security protocols
3. Archive analysis results for audit trail
`}

END OF EXECUTIVE SUMMARY
Generated by Justice Document Manager Tampering Detection System
`.trim()
  }

  const generateEvidenceCsv = (): string => {
    const headers = [
      'Document ID',
      'Document Title', 
      'File Name',
      'Category',
      'Risk Level',
      'Tampering Indicators',
      'Critical Issues',
      'Evidence Summary',
      'Confidence Score',
      'Date Group',
      'Last Modified',
      'Analysis Notes'
    ]

    const rows: string[][] = []

    // Add date group analysis results
    analysisResults!.dateGroupAnalyses.forEach(group => {
      group.documents.forEach(docId => {
        const doc = documentsForAnalysis.find(d => d.id === docId)
        if (!doc) return

        const docFlags = group.tamperingIndicators
        const criticalFlags = docFlags.filter(f => f.severity === 'critical').length
        const evidence = docFlags.map(f => f.description).join('; ')
        const avgConfidence = docFlags.length > 0 ? 
          Math.round(docFlags.reduce((sum, f) => sum + f.confidence, 0) / docFlags.length) : 0

        rows.push([
          doc.id,
          doc.title,
          doc.fileName,
          doc.category,
          group.riskLevel,
          docFlags.length.toString(),
          criticalFlags.toString(),
          evidence || 'No specific indicators',
          `${avgConfidence}%`,
          group.date,
          doc.lastModified,
          `Analyzed in date group with ${group.documents.length} documents`
        ])
      })
    })

    // Add timeline flag information
    analysisResults!.timelineFlags.forEach(flag => {
      const docId = flag.location?.split(' ')[0] // Try to extract doc ID from location
      const doc = documentsForAnalysis.find(d => d.id === docId || flag.location?.includes(d.fileName))
      
      rows.push([
        doc?.id || 'Unknown',
        doc?.title || 'Timeline Issue',
        doc?.fileName || 'Multiple Documents',
        doc?.category || 'N/A',
        flag.severity,
        '1',
        flag.severity === 'critical' ? '1' : '0',
        flag.description,
        `${flag.confidence}%`,
        'Timeline Analysis',
        doc?.lastModified || 'N/A',
        flag.evidence.join('; ')
      ])
    })

    // Add documents with no issues
    documentsForAnalysis.forEach(doc => {
      const hasIssues = rows.some(row => row[0] === doc.id)
      if (!hasIssues) {
        rows.push([
          doc.id,
          doc.title,
          doc.fileName,
          doc.category,
          'low',
          '0',
          '0',
          'No tampering indicators detected',
          '100%',
          'Clean',
          doc.lastModified,
          'Passed all tampering detection checks'
        ])
      }
    })

    const csvContent = [
      headers,
      ...rows
    ].map(row => 
      row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
    ).join('\n')

    return csvContent
  }

  const generateQuickReferenceCard = (): string => {
    const { overallRiskAssessment } = analysisResults!
    
    return `
QUICK REFERENCE CARD
TAMPERING DETECTION ANALYSIS RESULTS
Generated: ${new Date().toLocaleString()}

┌─────────────────────────────────────────────────┐
│                 RISK SUMMARY                    │
├─────────────────────────────────────────────────┤
│ Overall Risk: ${overallRiskAssessment.criticalFlags > 0 ? 'CRITICAL' : overallRiskAssessment.totalFlags > 5 ? 'HIGH' : overallRiskAssessment.totalFlags > 0 ? 'MODERATE' : 'LOW'}                           │
│ Documents: ${documentsForAnalysis.length.toString().padEnd(3)} │ Critical Issues: ${overallRiskAssessment.criticalFlags.toString().padEnd(3)}       │
│ Total Flags: ${overallRiskAssessment.totalFlags.toString().padEnd(2)} │ High-Risk Docs: ${overallRiskAssessment.highRiskDocuments.length.toString().padEnd(4)}        │
└─────────────────────────────────────────────────┘

${overallRiskAssessment.criticalFlags > 0 ? `
🚨 CRITICAL ISSUES DETECTED
Immediate investigation required for:
${overallRiskAssessment.highRiskDocuments.map(id => {
  const doc = documentsForAnalysis.find(d => d.id === id)
  return `• ${doc?.fileName || id}`
}).slice(0, 5).join('\n')}
${overallRiskAssessment.highRiskDocuments.length > 5 ? `... and ${overallRiskAssessment.highRiskDocuments.length - 5} more` : ''}
` : ''}

┌─────────────────────────────────────────────────┐
│                KEY INDICATORS                   │
├─────────────────────────────────────────────────┤
${analysisResults!.dateGroupAnalyses.map(group => 
`│ ${group.date}: ${group.riskLevel.toUpperCase().padEnd(8)} (${group.tamperingIndicators.length} flags)${' '.repeat(Math.max(0, 12 - group.date.length - group.riskLevel.length))} │`
).slice(0, 3).join('\n')}
${analysisResults!.dateGroupAnalyses.length > 3 ? `│ ... and ${analysisResults!.dateGroupAnalyses.length - 3} more date groups              │` : ''}
└─────────────────────────────────────────────────┘

NEXT STEPS:
${overallRiskAssessment.criticalFlags > 0 ? 
'1. URGENT: Review high-risk documents immediately\n2. Secure original sources for comparison\n3. Notify supervisors and legal team\n4. Begin formal investigation procedures' :
overallRiskAssessment.totalFlags > 0 ?
'1. Manual review of flagged documents\n2. Cross-reference with source materials\n3. Document findings in case file\n4. Monitor for future changes' :
'1. Archive analysis results\n2. Continue periodic monitoring\n3. Maintain security protocols\n4. No immediate action required'}

Contact: System Administrator
Reference: TAMPER-${new Date().toISOString().split('T')[0]}
`.trim()
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
      case 'metadata_inconsistency': return <Warning className="h-4 w-4" />
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
            <Warning className="h-5 w-5 text-orange-600" />
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
                        <Warning className="h-4 w-4" />
                        <AlertDescription>
                          <div className="font-medium">{analysisResults.overallRiskAssessment.summary}</div>
                        </AlertDescription>
                      </Alert>
                      
                      <div className="mt-4 flex justify-between items-center">
                        <div className="text-xs text-muted-foreground">
                          Analysis includes date-based comparison, name mention tracking, and timeline verification.<br/>
                          <span className="font-medium text-blue-600">Export generates 5 files optimized for oversight agency submission</span>
                        </div>
                        <div className="flex gap-2">
                          <Button onClick={runTamperingAnalysis} size="sm" variant="outline">
                            <Search className="h-3 w-3 mr-1" />
                            Re-analyze
                          </Button>
                          <Button onClick={exportReport} size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                            <Download className="h-3 w-3 mr-1" />
                            Export for Oversight
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
                      <div className="mt-3 flex justify-between items-center">
                        <div className="text-xs text-muted-foreground">
                          📋 Comprehensive export includes: Executive Summary, Technical Report, Evidence CSV, Raw Data, and Quick Reference Card
                        </div>
                        <Button onClick={exportReport} size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                          <Download className="h-3 w-3 mr-1" />
                          Export Oversight Package
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
                <Warning className="h-12 w-12 text-muted-foreground mx-auto" />
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