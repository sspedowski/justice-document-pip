import React, { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from '@/components/ui/chart'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell, LineChart, Line, RadialBarChart, RadialBar, ResponsiveContainer, ComposedChart, Area, AreaChart } from 'recharts'
import { Download, FileText, TrendUp, Users, Scale, Shield, Calendar, AlertTriangle, CheckCircle, Clock, BarChart3, Warning, Target, Gavel, FileCheck, ChartPie, Table, Receipt } from '@phosphor-icons/react'
import { toast } from 'sonner'

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

interface ReportGeneratorProps {
  documents: Document[]
  documentVersions: DocumentVersion[]
  onExportReport: (reportData: any) => void
}

export function ReportGenerator({ documents, documentVersions, onExportReport }: ReportGeneratorProps) {
  const [reportType, setReportType] = useState<'overview' | 'legal' | 'timeline' | 'children' | 'compliance'>('overview')
  const [selectedTimeframe, setSelectedTimeframe] = useState<'all' | '30d' | '90d' | '1y'>('all')

  // Calculate comprehensive report data
  const reportData = useMemo(() => {
    const now = new Date()
    const timeframeDays = {
      all: Infinity,
      '30d': 30,
      '90d': 90,
      '1y': 365
    }[selectedTimeframe]

    const filteredDocs = documents.filter(doc => {
      const docDate = new Date(doc.uploadedAt)
      const daysDiff = (now.getTime() - docDate.getTime()) / (1000 * 60 * 60 * 24)
      return daysDiff <= timeframeDays
    })

    // Handle empty state with sample data for demo
    const hasData = filteredDocs.length > 0

    // Document category distribution
    const categoryData = hasData ? Object.entries(
      filteredDocs.reduce((acc, doc) => {
        acc[doc.category] = (acc[doc.category] || 0) + 1
        return acc
      }, {} as Record<string, number>)
    ).map(([name, value]) => ({
      name,
      value,
      percentage: Math.round((value / filteredDocs.length) * 100),
      fill: name === 'Primary' ? 'hsl(var(--destructive))' : 
            name === 'Supporting' ? 'hsl(var(--primary))' :
            name === 'External' ? 'hsl(var(--accent))' : 'hsl(var(--muted-foreground))'
    })) : [
      { name: 'Primary', value: 0, percentage: 0, fill: 'hsl(var(--destructive))' },
      { name: 'Supporting', value: 0, percentage: 0, fill: 'hsl(var(--primary))' },
      { name: 'External', value: 0, percentage: 0, fill: 'hsl(var(--accent))' },
      { name: 'No', value: 0, percentage: 0, fill: 'hsl(var(--muted-foreground))' }
    ]

    // Enhanced law violations analysis with severity and compliance metrics
    const lawData = Object.entries(
      filteredDocs.reduce((acc, doc) => {
        doc.laws.forEach(law => {
          acc[law] = (acc[law] || 0) + 1
        })
        return acc
      }, {} as Record<string, number>)
    ).map(([name, value]) => {
      const severity = name.includes('Brady') || name.includes('Due Process') ? 'Critical' :
                      name.includes('Perjury') || name.includes('Evidence Tampering') ? 'High' :
                      name.includes('CAPTA') ? 'Medium' : 'Low'
      
      return {
        name: name.replace(' (14th Amendment)', ''),
        fullName: name,
        value,
        severity,
        complianceRisk: value > 5 ? 'High' : value > 2 ? 'Medium' : 'Low',
        percentage: Math.round((value / filteredDocs.length) * 100),
        fill: severity === 'Critical' ? '#dc2626' : 
              severity === 'High' ? '#ea580c' :
              severity === 'Medium' ? '#d97706' : '#65a30d'
      }
    }).sort((a, b) => b.value - a.value)

    // Legal violation severity distribution
    const severityData = [
      { 
        name: 'Critical', 
        value: lawData.filter(l => l.severity === 'Critical').reduce((sum, l) => sum + l.value, 0),
        color: '#dc2626'
      },
      { 
        name: 'High', 
        value: lawData.filter(l => l.severity === 'High').reduce((sum, l) => sum + l.value, 0),
        color: '#ea580c'
      },
      { 
        name: 'Medium', 
        value: lawData.filter(l => l.severity === 'Medium').reduce((sum, l) => sum + l.value, 0),
        color: '#d97706'
      },
      { 
        name: 'Low', 
        value: lawData.filter(l => l.severity === 'Low').reduce((sum, l) => sum + l.value, 0),
        color: '#65a30d'
      }
    ].filter(item => item.value > 0)

    // Compliance risk analysis
    const complianceRiskData = [
      {
        name: 'High Risk',
        value: lawData.filter(l => l.complianceRisk === 'High').length,
        violations: lawData.filter(l => l.complianceRisk === 'High').reduce((sum, l) => sum + l.value, 0),
        fill: 'hsl(var(--destructive))'
      },
      {
        name: 'Medium Risk',
        value: lawData.filter(l => l.complianceRisk === 'Medium').length,
        violations: lawData.filter(l => l.complianceRisk === 'Medium').reduce((sum, l) => sum + l.value, 0),
        fill: 'hsl(355, 75%, 60%)'
      },
      {
        name: 'Low Risk',
        value: lawData.filter(l => l.complianceRisk === 'Low').length,
        violations: lawData.filter(l => l.complianceRisk === 'Low').reduce((sum, l) => sum + l.value, 0),
        fill: 'hsl(var(--accent))'
      }
    ]

    // Document processing quality metrics
    const qualityMetrics = {
      textExtractionRate: Math.round((filteredDocs.filter(doc => doc.textContent).length / Math.max(filteredDocs.length, 1)) * 100),
      childrenIdentificationRate: Math.round((filteredDocs.filter(doc => doc.children.length > 0).length / Math.max(filteredDocs.length, 1)) * 100),
      lawIdentificationRate: Math.round((filteredDocs.filter(doc => doc.laws.length > 0).length / Math.max(filteredDocs.length, 1)) * 100),
      categoryAccuracy: Math.round((filteredDocs.filter(doc => doc.category !== 'No').length / Math.max(filteredDocs.length, 1)) * 100),
      versionControlCoverage: Math.round((new Set(documentVersions.map(v => v.documentId)).size / Math.max(filteredDocs.length, 1)) * 100)
    }

    // Enhanced children involvement analysis
    const childrenData = Object.entries(
      filteredDocs.reduce((acc, doc) => {
        doc.children.forEach(child => {
          if (!acc[child]) {
            acc[child] = {
              documents: 0,
              laws: new Set(),
              primaryEvidence: 0,
              riskLevel: 'Low'
            }
          }
          acc[child].documents += 1
          doc.laws.forEach(law => acc[child].laws.add(law))
          if (doc.category === 'Primary') acc[child].primaryEvidence += 1
        })
        return acc
      }, {} as Record<string, any>)
    ).map(([name, data]) => ({
      name,
      documents: data.documents,
      lawsInvolved: data.laws.size,
      primaryEvidence: data.primaryEvidence,
      riskLevel: data.primaryEvidence > 0 && data.laws.size > 2 ? 'High' :
                 data.documents > 3 || data.laws.size > 1 ? 'Medium' : 'Low',
      complianceScore: Math.min(100, (data.primaryEvidence * 30) + (data.laws.size * 20) + (data.documents * 10))
    })).sort((a, b) => b.complianceScore - a.complianceScore)

    // Timeline with enhanced data points
    const timelineData = Object.entries(
      filteredDocs.reduce((acc, doc) => {
        const month = new Date(doc.uploadedAt).toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'short' 
        })
        if (!acc[month]) {
          acc[month] = {
            documents: 0,
            primary: 0,
            violations: 0,
            children: new Set()
          }
        }
        acc[month].documents += 1
        if (doc.category === 'Primary') acc[month].primary += 1
        acc[month].violations += doc.laws.length
        doc.children.forEach(child => acc[month].children.add(child))
        return acc
      }, {} as Record<string, any>)
    ).map(([month, data]) => ({
      month,
      documents: data.documents,
      primary: data.primary,
      violations: data.violations,
      childrenAffected: data.children.size,
      complianceScore: Math.max(0, 100 - (data.violations * 5))
    })).sort((a, b) => new Date(a.month + ' 1').getTime() - new Date(b.month + ' 1').getTime())

    // Inclusion status with reasons
    const inclusionData = [
      {
        name: 'Included',
        value: filteredDocs.filter(doc => doc.include === 'YES').length,
        fill: 'hsl(var(--accent))'
      },
      {
        name: 'Excluded',
        value: filteredDocs.filter(doc => doc.include === 'NO').length,
        fill: 'hsl(var(--muted-foreground))'
      }
    ]

    // Enhanced placement analysis
    const placementData = [
      {
        name: 'Master File',
        value: filteredDocs.filter(doc => doc.placement.masterFile).length,
        percentage: Math.round((filteredDocs.filter(doc => doc.placement.masterFile).length / Math.max(filteredDocs.length, 1)) * 100),
        fill: 'hsl(var(--primary))'
      },
      {
        name: 'Exhibit Bundle',
        value: filteredDocs.filter(doc => doc.placement.exhibitBundle).length,
        percentage: Math.round((filteredDocs.filter(doc => doc.placement.exhibitBundle).length / Math.max(filteredDocs.length, 1)) * 100),
        fill: 'hsl(var(--accent))'
      },
      {
        name: 'Oversight Packet',
        value: filteredDocs.filter(doc => doc.placement.oversightPacket).length,
        percentage: Math.round((filteredDocs.filter(doc => doc.placement.oversightPacket).length / Math.max(filteredDocs.length, 1)) * 100),
        fill: 'hsl(var(--destructive))'
      }
    ]

    // Version history analysis with change patterns
    const versionData = Object.entries(
      documentVersions.reduce((acc, version) => {
        const month = new Date(version.changedAt).toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'short' 
        })
        if (!acc[month]) {
          acc[month] = {
            changes: 0,
            created: 0,
            edited: 0,
            imported: 0
          }
        }
        acc[month].changes += 1
        acc[month][version.changeType] += 1
        return acc
      }, {} as Record<string, any>)
    ).map(([month, data]) => ({ 
      month, 
      changes: data.changes,
      created: data.created,
      edited: data.edited,
      imported: data.imported
    })).sort((a, b) => new Date(a.month + ' 1').getTime() - new Date(b.month + ' 1').getTime())

    // Enhanced key metrics with compliance scores
    const metrics = {
      totalDocuments: filteredDocs.length,
      primaryEvidence: filteredDocs.filter(doc => doc.category === 'Primary').length,
      includedDocuments: filteredDocs.filter(doc => doc.include === 'YES').length,
      childrenInvolved: new Set(filteredDocs.flatMap(doc => doc.children)).size,
      lawsViolated: new Set(filteredDocs.flatMap(doc => doc.laws)).size,
      oversightReady: filteredDocs.filter(doc => doc.placement.oversightPacket).length,
      totalVersions: documentVersions.length,
      avgVersionsPerDoc: documents.length > 0 ? (documentVersions.length / documents.length).toFixed(1) : '0',
      
      // Compliance metrics
      inclusionRate: Math.round((filteredDocs.filter(doc => doc.include === 'YES').length / Math.max(filteredDocs.length, 1)) * 100),
      oversightReadiness: Math.round((filteredDocs.filter(doc => doc.placement.oversightPacket).length / Math.max(filteredDocs.length, 1)) * 100),
      evidenceCompleteness: Math.round((filteredDocs.filter(doc => doc.category === 'Primary').length / Math.max(filteredDocs.length, 1)) * 100),
      legalCoverage: Math.round((filteredDocs.filter(doc => doc.laws.length > 0).length / Math.max(filteredDocs.length, 1)) * 100),
      
      // Risk assessment
      criticalViolations: lawData.filter(l => l.severity === 'Critical').reduce((sum, l) => sum + l.value, 0),
      highRiskCompliance: lawData.filter(l => l.complianceRisk === 'High').length,
      overallComplianceScore: Math.max(0, 100 - (lawData.reduce((sum, l) => sum + l.value, 0) * 2))
    }

    return {
      categoryData,
      lawData,
      severityData,
      complianceRiskData,
      qualityMetrics,
      childrenData,
      timelineData,
      inclusionData,
      placementData,
      versionData,
      metrics,
      filteredDocuments: filteredDocs
    }
  }, [documents, documentVersions, selectedTimeframe])

  const generateFullReport = () => {
    const report = {
      title: 'Justice Document Manager - Comprehensive Legal Analysis Report',
      subtitle: 'Detailed Legal Violation Statistics and Compliance Metrics',
      generatedAt: new Date().toISOString(),
      timeframe: selectedTimeframe,
      summary: reportData.metrics,
      
      // Executive Summary
      executiveSummary: {
        totalDocuments: reportData.metrics.totalDocuments,
        criticalFindings: reportData.metrics.criticalViolations,
        complianceScore: reportData.metrics.overallComplianceScore,
        recommendedActions: reportData.metrics.highRiskCompliance > 0 ? 
          'Immediate legal review required for high-risk violations' :
          'Continue monitoring and maintain documentation standards'
      },
      
      // Legal Analysis
      legalAnalysis: {
        violationsByLaw: reportData.lawData.map(law => ({
          law: law.fullName,
          occurrences: law.value,
          severity: law.severity,
          complianceRisk: law.complianceRisk,
          percentage: law.percentage,
          recommendedAction: law.severity === 'Critical' ? 'Immediate legal consultation required' :
                            law.severity === 'High' ? 'Priority legal review needed' :
                            'Standard documentation and monitoring'
        })),
        severityDistribution: reportData.severityData,
        complianceRiskAssessment: reportData.complianceRiskData
      },
      
      // Quality Metrics
      qualityMetrics: {
        processingQuality: reportData.qualityMetrics,
        documentCompleteness: {
          textExtracted: reportData.qualityMetrics.textExtractionRate,
          childrenIdentified: reportData.qualityMetrics.childrenIdentificationRate,
          lawsIdentified: reportData.qualityMetrics.lawIdentificationRate,
          properlyClassified: reportData.qualityMetrics.categoryAccuracy
        }
      },
      
      // Children Impact Analysis
      childrenImpactAnalysis: {
        totalChildrenAffected: reportData.metrics.childrenInvolved,
        detailedImpact: reportData.childrenData.map(child => ({
          name: child.name,
          documentsInvolved: child.documents,
          lawViolationsConnected: child.lawsInvolved,
          primaryEvidenceCount: child.primaryEvidence,
          riskLevel: child.riskLevel,
          complianceScore: child.complianceScore
        })),
        riskAssessment: {
          highRisk: reportData.childrenData.filter(c => c.riskLevel === 'High').length,
          mediumRisk: reportData.childrenData.filter(c => c.riskLevel === 'Medium').length,
          lowRisk: reportData.childrenData.filter(c => c.riskLevel === 'Low').length
        }
      },
      
      // Compliance Dashboard
      complianceDashboard: {
        inclusionRate: reportData.metrics.inclusionRate,
        oversightReadiness: reportData.metrics.oversightReadiness,
        evidenceCompleteness: reportData.metrics.evidenceCompleteness,
        legalCoverage: reportData.metrics.legalCoverage,
        overallScore: reportData.metrics.overallComplianceScore
      },
      
      // Data Exports
      data: {
        categoryDistribution: reportData.categoryData,
        lawViolations: reportData.lawData,
        childrenInvolvement: reportData.childrenData,
        uploadTimeline: reportData.timelineData,
        inclusionStatus: reportData.inclusionData,
        placementAnalysis: reportData.placementData,
        versionHistory: reportData.versionData
      },
      
      // Document Details
      documentSummary: reportData.filteredDocuments.map(doc => ({
        fileName: doc.fileName,
        title: doc.title,
        category: doc.category,
        children: doc.children,
        laws: doc.laws,
        include: doc.include,
        uploadedAt: doc.uploadedAt,
        currentVersion: doc.currentVersion,
        hasTextContent: !!doc.textContent,
        placementSettings: doc.placement
      })),
      
      // Recommendations
      recommendations: generateRecommendations(reportData)
    }

    onExportReport(report)
    toast.success('Comprehensive legal analysis report generated and exported')
  }

  const generateRecommendations = (data: any) => {
    const recommendations = []
    
    if (data.metrics.criticalViolations > 0) {
      recommendations.push({
        priority: 'Critical',
        category: 'Legal Compliance',
        issue: `${data.metrics.criticalViolations} critical legal violations identified`,
        action: 'Immediate legal consultation and violation remediation required',
        timeframe: 'Immediate (within 24-48 hours)'
      })
    }
    
    if (data.metrics.oversightReadiness < 75) {
      recommendations.push({
        priority: 'High',
        category: 'Oversight Preparation',
        issue: `Only ${data.metrics.oversightReadiness}% of documents are oversight-ready`,
        action: 'Review and prepare additional documents for oversight packets',
        timeframe: 'Within 1-2 weeks'
      })
    }
    
    if (data.qualityMetrics.textExtractionRate < 90) {
      recommendations.push({
        priority: 'Medium',
        category: 'Data Quality',
        issue: `Text extraction rate is ${data.qualityMetrics.textExtractionRate}%`,
        action: 'Review and reprocess documents with poor text extraction',
        timeframe: 'Within 1 month'
      })
    }
    
    if (data.childrenData.filter((c: any) => c.riskLevel === 'High').length > 0) {
      recommendations.push({
        priority: 'High',
        category: 'Child Protection',
        issue: `${data.childrenData.filter((c: any) => c.riskLevel === 'High').length} children identified as high-risk`,
        action: 'Prioritize documentation and protection measures for high-risk children',
        timeframe: 'Immediate priority'
      })
    }
    
    return recommendations
  }

  const exportChartData = (chartType: string, data: any[]) => {
    const headers = chartType === 'Law Violations' ? 
      ['Law', 'Occurrences', 'Severity', 'Compliance Risk', 'Percentage'] :
      chartType === 'Children Involvement' ?
      ['Child', 'Documents', 'Laws Involved', 'Primary Evidence', 'Risk Level', 'Compliance Score'] :
      chartType === 'Timeline Data' ?
      ['Month', 'Documents', 'Primary Evidence', 'Violations', 'Children Affected', 'Compliance Score'] :
      [chartType, 'Count']

    const csvContent = [
      headers,
      ...data.map(item => {
        if (chartType === 'Law Violations') {
          return [
            item.fullName || item.name,
            item.value || 0,
            item.severity || 'Unknown',
            item.complianceRisk || 'Unknown',
            `${item.percentage || 0}%`
          ]
        } else if (chartType === 'Children Involvement') {
          return [
            item.name,
            item.documents || 0,
            item.lawsInvolved || 0,
            item.primaryEvidence || 0,
            item.riskLevel || 'Unknown',
            item.complianceScore || 0
          ]
        } else if (chartType === 'Timeline Data') {
          return [
            item.month,
            item.documents || 0,
            item.primary || 0,
            item.violations || 0,
            item.childrenAffected || 0,
            item.complianceScore || 0
          ]
        } else {
          return [
            item.name || item.month,
            item.value || item.documents || item.changes || 0
          ]
        }
      })
    ]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${chartType.toLowerCase().replace(/\s+/g, '-')}-detailed-analysis.csv`
    a.click()
    URL.revokeObjectURL(url)

    toast.success(`${chartType} detailed analysis exported`)
  }

  const exportComplianceReport = () => {
    const complianceData = {
      reportTitle: 'Legal Compliance Assessment Report',
      generatedAt: new Date().toISOString(),
      overallComplianceScore: reportData.metrics.overallComplianceScore,
      
      criticalFindings: {
        criticalViolations: reportData.metrics.criticalViolations,
        highRiskItems: reportData.metrics.highRiskCompliance,
        oversightReadiness: reportData.metrics.oversightReadiness
      },
      
      qualityAssessment: reportData.qualityMetrics,
      
      complianceBreakdown: {
        inclusion: `${reportData.metrics.inclusionRate}%`,
        evidenceCompleteness: `${reportData.metrics.evidenceCompleteness}%`,
        legalCoverage: `${reportData.metrics.legalCoverage}%`,
        versionControl: `${reportData.qualityMetrics.versionControlCoverage}%`
      },
      
      riskMatrix: reportData.complianceRiskData,
      recommendations: generateRecommendations(reportData)
    }

    const jsonBlob = new Blob([JSON.stringify(complianceData, null, 2)], { type: 'application/json' })
    const jsonUrl = URL.createObjectURL(jsonBlob)
    const jsonLink = document.createElement('a')
    jsonLink.href = jsonUrl
    jsonLink.download = `compliance-assessment-${new Date().toISOString().split('T')[0]}.json`
    jsonLink.click()
    URL.revokeObjectURL(jsonUrl)

    // Also create a summary CSV
    const summaryData = [
      ['Metric', 'Value', 'Status'],
      ['Overall Compliance Score', `${reportData.metrics.overallComplianceScore}%`, 
       reportData.metrics.overallComplianceScore >= 80 ? 'Good' : 
       reportData.metrics.overallComplianceScore >= 60 ? 'Needs Attention' : 'Critical'],
      ['Critical Violations', reportData.metrics.criticalViolations, 
       reportData.metrics.criticalViolations === 0 ? 'Good' : 'Critical'],
      ['Inclusion Rate', `${reportData.metrics.inclusionRate}%`,
       reportData.metrics.inclusionRate >= 80 ? 'Good' : 'Needs Improvement'],
      ['Oversight Readiness', `${reportData.metrics.oversightReadiness}%`,
       reportData.metrics.oversightReadiness >= 75 ? 'Good' : 'Needs Improvement'],
      ['Evidence Completeness', `${reportData.metrics.evidenceCompleteness}%`,
       reportData.metrics.evidenceCompleteness >= 70 ? 'Good' : 'Needs Improvement'],
      ['Legal Coverage', `${reportData.metrics.legalCoverage}%`,
       reportData.metrics.legalCoverage >= 60 ? 'Good' : 'Needs Improvement']
    ]

    const csvContent = summaryData
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n')

    const csvBlob = new Blob([csvContent], { type: 'text/csv' })
    const csvUrl = URL.createObjectURL(csvBlob)
    const csvLink = document.createElement('a')
    csvLink.href = csvUrl
    csvLink.download = `compliance-summary-${new Date().toISOString().split('T')[0]}.csv`
    csvLink.click()
    URL.revokeObjectURL(csvUrl)

    toast.success('Compliance assessment report exported')
  }

  const MetricCard = ({ title, value, icon: Icon, subtitle, trend }: {
    title: string
    value: string | number
    icon: any
    subtitle?: string
    trend?: 'up' | 'down' | 'stable'
  }) => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <div className="flex items-center gap-2">
              <p className="text-2xl font-bold">{value}</p>
              {trend && (
                <TrendUp className={`h-4 w-4 ${
                  trend === 'up' ? 'text-green-500' : 
                  trend === 'down' ? 'text-red-500' : 'text-muted-foreground'
                }`} />
              )}
            </div>
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
            )}
          </div>
          <Icon className="h-8 w-8 text-muted-foreground" />
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Automated Reports & Analytics</h2>
          <p className="text-muted-foreground">Generate comprehensive reports with data visualizations</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedTimeframe} onValueChange={(value: any) => setSelectedTimeframe(value)}>
            <SelectTrigger className="w-32">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="1y">Last Year</SelectItem>
              <SelectItem value="90d">Last 90 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            onClick={exportComplianceReport} 
            variant="outline"
            className="flex items-center gap-2"
          >
            <Receipt className="h-4 w-4" />
            Compliance Report
          </Button>
          <Button onClick={generateFullReport} className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export Full Report
          </Button>
        </div>
      </div>

      {/* Enhanced Key Metrics Dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          title="Total Documents"
          value={reportData.metrics.totalDocuments}
          icon={FileText}
          subtitle="Documents processed"
          trend="up"
        />
        <MetricCard
          title="Critical Violations"
          value={reportData.metrics.criticalViolations}
          icon={Warning}
          subtitle="Require immediate attention"
          trend={reportData.metrics.criticalViolations > 0 ? "down" : "stable"}
        />
        <MetricCard
          title="Compliance Score"
          value={`${reportData.metrics.overallComplianceScore}%`}
          icon={Target}
          subtitle={reportData.metrics.overallComplianceScore >= 80 ? "Good standing" : 
                   reportData.metrics.overallComplianceScore >= 60 ? "Needs attention" : "Critical review needed"}
          trend={reportData.metrics.overallComplianceScore >= 80 ? "up" : 
                reportData.metrics.overallComplianceScore >= 60 ? "stable" : "down"}
        />
        <MetricCard
          title="Children At Risk"
          value={reportData.childrenData.filter(c => c.riskLevel === 'High').length}
          icon={Users}
          subtitle={`of ${reportData.metrics.childrenInvolved} total children`}
          trend={reportData.childrenData.filter(c => c.riskLevel === 'High').length === 0 ? "stable" : "down"}
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          title="Inclusion Rate"
          value={`${reportData.metrics.inclusionRate}%`}
          icon={CheckCircle}
          subtitle={`${reportData.metrics.includedDocuments} included`}
          trend={reportData.metrics.inclusionRate >= 80 ? "up" : "stable"}
        />
        <MetricCard
          title="Oversight Ready"
          value={`${reportData.metrics.oversightReadiness}%`}
          icon={Shield}
          subtitle={`${reportData.metrics.oversightReady} packets prepared`}
          trend={reportData.metrics.oversightReadiness >= 75 ? "up" : "stable"}
        />
        <MetricCard
          title="Legal Coverage"
          value={`${reportData.metrics.legalCoverage}%`}
          icon={Gavel}
          subtitle="Documents with legal analysis"
          trend={reportData.metrics.legalCoverage >= 60 ? "up" : "stable"}
        />
        <MetricCard
          title="Quality Score"
          value={`${Math.round((reportData.qualityMetrics.textExtractionRate + reportData.qualityMetrics.categoryAccuracy) / 2)}%`}
          icon={FileCheck}
          subtitle="Processing accuracy"
          trend="up"
        />
      </div>

      {/* Report Tabs */}
      <Tabs value={reportType} onValueChange={(value: any) => setReportType(value)}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="legal">Legal Analysis</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="children">Children Impact</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Document Categories */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">Document Categories</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => exportChartData('Document Categories', reportData.categoryData)}
                >
                  <Download className="h-3 w-3" />
                </Button>
              </CardHeader>
              <CardContent>
                <ChartContainer config={{
                  Primary: { label: 'Primary Evidence', color: 'hsl(var(--destructive))' },
                  Supporting: { label: 'Supporting Documents', color: 'hsl(var(--primary))' },
                  External: { label: 'External Sources', color: 'hsl(var(--accent))' },
                  No: { label: 'Excluded', color: 'hsl(var(--muted-foreground))' }
                }}>
                  <PieChart>
                    <Pie
                      data={reportData.categoryData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {reportData.categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </PieChart>
                </ChartContainer>
              </CardContent>
            </Card>

            {/* Inclusion Status */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">Document Inclusion Status</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => exportChartData('Inclusion Status', reportData.inclusionData)}
                >
                  <Download className="h-3 w-3" />
                </Button>
              </CardHeader>
              <CardContent>
                <ChartContainer config={{
                  included: { label: 'Included', color: 'hsl(var(--accent))' },
                  excluded: { label: 'Excluded', color: 'hsl(var(--muted-foreground))' }
                }}>
                  <RadialBarChart cx="50%" cy="50%" innerRadius="60%" outerRadius="90%" data={reportData.inclusionData}>
                    <RadialBar dataKey="value" cornerRadius={10} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </RadialBarChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>

          {/* Placement Analysis */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Document Placement Analysis</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportChartData('Document Placement', reportData.placementData)}
              >
                <Download className="h-3 w-3" />
              </Button>
            </CardHeader>
            <CardContent>
              <ChartContainer config={{
                value: { label: 'Documents', color: 'hsl(var(--primary))' }
              }}>
                <BarChart data={reportData.placementData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="legal" className="space-y-6">
          {/* Legal Violation Severity Analysis */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">Violation Severity Distribution</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => exportChartData('Severity Distribution', reportData.severityData)}
                >
                  <Download className="h-3 w-3" />
                </Button>
              </CardHeader>
              <CardContent>
                <ChartContainer config={{
                  Critical: { label: 'Critical', color: '#dc2626' },
                  High: { label: 'High', color: '#ea580c' },
                  Medium: { label: 'Medium', color: '#d97706' },
                  Low: { label: 'Low', color: '#65a30d' }
                }}>
                  <PieChart>
                    <Pie
                      data={reportData.severityData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {reportData.severityData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </PieChart>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">Compliance Risk Assessment</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => exportChartData('Compliance Risk', reportData.complianceRiskData)}
                >
                  <Download className="h-3 w-3" />
                </Button>
              </CardHeader>
              <CardContent>
                <ChartContainer config={{
                  value: { label: 'Risk Items', color: 'hsl(var(--destructive))' }
                }}>
                  <BarChart data={reportData.complianceRiskData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>

          {/* Enhanced Law Violations */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Detailed Legal Violations Analysis</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportChartData('Law Violations', reportData.lawData)}
              >
                <Download className="h-3 w-3" />
              </Button>
            </CardHeader>
            <CardContent>
              <ChartContainer config={{
                value: { label: 'Violations', color: 'hsl(var(--destructive))' }
              }}>
                <BarChart data={reportData.lawData} margin={{ left: 20, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    angle={-45}
                    textAnchor="end"
                    height={100}
                    interval={0}
                  />
                  <YAxis />
                  <ChartTooltip 
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload
                        return (
                          <div className="bg-background border rounded-lg p-3 shadow-lg">
                            <p className="font-medium">{data.fullName}</p>
                            <p className="text-sm text-muted-foreground">
                              Occurrences: {data.value} ({data.percentage}%)
                            </p>
                            <p className="text-sm">
                              <span className={`font-medium ${
                                data.severity === 'Critical' ? 'text-red-600' :
                                data.severity === 'High' ? 'text-orange-600' :
                                data.severity === 'Medium' ? 'text-yellow-600' : 'text-green-600'
                              }`}>
                                {data.severity} Severity
                              </span>
                            </p>
                            <p className="text-sm">
                              Compliance Risk: {data.complianceRisk}
                            </p>
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                  <Bar 
                    dataKey="value" 
                    radius={[4, 4, 0, 0]}
                    fill={(entry: any) => entry.fill}
                  />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Enhanced Law Violations Summary with Risk Assessment */}
          <Card>
            <CardHeader>
              <CardTitle>Legal Violations Risk Matrix</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {reportData.lawData.slice(0, 8).map((law, index) => (
                  <div key={law.fullName} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <Badge variant="outline">{index + 1}</Badge>
                      <div className="flex-1">
                        <div className="font-medium">{law.fullName}</div>
                        <div className="text-sm text-muted-foreground">
                          Found in {law.value} document{law.value !== 1 ? 's' : ''} ({law.percentage}% of total)
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge 
                            variant={law.severity === 'Critical' ? 'destructive' : 'outline'}
                            className={
                              law.severity === 'Critical' ? '' :
                              law.severity === 'High' ? 'border-orange-500 text-orange-700' :
                              law.severity === 'Medium' ? 'border-yellow-500 text-yellow-700' :
                              'border-green-500 text-green-700'
                            }
                          >
                            {law.severity}
                          </Badge>
                          <Badge 
                            variant="outline"
                            className={
                              law.complianceRisk === 'High' ? 'border-red-500 text-red-700' :
                              law.complianceRisk === 'Medium' ? 'border-yellow-500 text-yellow-700' :
                              'border-green-500 text-green-700'
                            }
                          >
                            {law.complianceRisk} Risk
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-lg">{law.value}</div>
                      <div className="text-xs text-muted-foreground">violations</div>
                      <Progress 
                        value={law.percentage} 
                        className="w-16 h-2 mt-1"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Legal Compliance Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                Compliance Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {generateRecommendations(reportData).map((rec, index) => (
                  <div 
                    key={index}
                    className={`p-4 border-l-4 rounded-lg ${
                      rec.priority === 'Critical' ? 'border-red-500 bg-red-50' :
                      rec.priority === 'High' ? 'border-orange-500 bg-orange-50' :
                      'border-yellow-500 bg-yellow-50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge 
                            variant={rec.priority === 'Critical' ? 'destructive' : 'outline'}
                            className={
                              rec.priority === 'High' ? 'border-orange-500 text-orange-700' :
                              rec.priority === 'Medium' ? 'border-yellow-500 text-yellow-700' : ''
                            }
                          >
                            {rec.priority} Priority
                          </Badge>
                          <Badge variant="secondary">{rec.category}</Badge>
                        </div>
                        <div className="font-medium text-sm mb-1">{rec.issue}</div>
                        <div className="text-sm text-muted-foreground mb-2">{rec.action}</div>
                        <div className="text-xs text-muted-foreground">
                          <Clock className="h-3 w-3 inline mr-1" />
                          {rec.timeframe}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {generateRecommendations(reportData).length === 0 && (
                  <div className="text-center py-6 text-muted-foreground">
                    <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                    <p className="font-medium">No critical recommendations at this time</p>
                    <p className="text-sm">System compliance appears to be within acceptable parameters</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timeline" className="space-y-6">
          {/* Enhanced Timeline with Multiple Metrics */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Document Processing Timeline</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportChartData('Timeline Data', reportData.timelineData)}
              >
                <Download className="h-3 w-3" />
              </Button>
            </CardHeader>
            <CardContent>
              <ChartContainer config={{
                documents: { label: 'Total Documents', color: 'hsl(var(--primary))' },
                primary: { label: 'Primary Evidence', color: 'hsl(var(--destructive))' },
                violations: { label: 'Violations Found', color: 'hsl(355, 75%, 50%)' },
                childrenAffected: { label: 'Children Affected', color: 'hsl(var(--accent))' }
              }}>
                <ComposedChart data={reportData.timelineData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <ChartTooltip 
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload
                        return (
                          <div className="bg-background border rounded-lg p-3 shadow-lg">
                            <p className="font-medium">{label}</p>
                            <p className="text-sm">Documents: {data.documents}</p>
                            <p className="text-sm">Primary Evidence: {data.primary}</p>
                            <p className="text-sm">Violations: {data.violations}</p>
                            <p className="text-sm">Children Affected: {data.childrenAffected}</p>
                            <p className="text-sm">Compliance Score: {data.complianceScore}%</p>
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                  <Bar yAxisId="left" dataKey="documents" fill="hsl(var(--primary))" />
                  <Bar yAxisId="left" dataKey="primary" fill="hsl(var(--destructive))" />
                  <Line 
                    yAxisId="right" 
                    type="monotone" 
                    dataKey="complianceScore" 
                    stroke="hsl(var(--accent))" 
                    strokeWidth={3}
                    dot={{ fill: 'hsl(var(--accent))', strokeWidth: 2, r: 4 }}
                  />
                </ComposedChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Compliance Score Trend */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Compliance Score Trend</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportChartData('Compliance Trend', reportData.timelineData.map(d => ({
                  month: d.month,
                  score: d.complianceScore
                })))}
              >
                <Download className="h-3 w-3" />
              </Button>
            </CardHeader>
            <CardContent>
              <ChartContainer config={{
                complianceScore: { label: 'Compliance Score', color: 'hsl(var(--accent))' }
              }}>
                <AreaChart data={reportData.timelineData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis domain={[0, 100]} />
                  <ChartTooltip 
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const score = payload[0].value as number
                        return (
                          <div className="bg-background border rounded-lg p-3 shadow-lg">
                            <p className="font-medium">{label}</p>
                            <p className="text-sm">Compliance Score: {score}%</p>
                            <p className={`text-sm font-medium ${
                              score >= 80 ? 'text-green-600' :
                              score >= 60 ? 'text-yellow-600' : 'text-red-600'
                            }`}>
                              Status: {score >= 80 ? 'Good' : score >= 60 ? 'Needs Attention' : 'Critical'}
                            </p>
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="complianceScore" 
                    stroke="hsl(var(--accent))" 
                    fill="hsl(var(--accent))"
                    fillOpacity={0.3}
                  />
                </AreaChart>
              </ChartContainer>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
          <Card>
              <Buttonw items-center justify-between">
                variant="outline"
                size="sm"
                onClick={() => exportChartData('Children Involvement', reportData.childrenData)}
              >
                <Download className="h-3 w-3" />
              </Button>
            </CardHeader>
            <CardContent>
              <ChartContainer config={{
            <CardContent>
              <ChartContainer config={{
                created: { label: 'Created', color: 'hsl(var(--accent))' },
              }}>d', color: 'hsl(var(--primary))' },
                imported: { label: 'Imported', color: 'hsl(var(--muted-foreground))' }
                  <CartesianGrid strokeDasharray="3 3" />
                <BarChart data={reportData.versionData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <ChartTooltip 
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload
                        return (
                          <div className="bg-background border rounded-lg p-3 shadow-lg">
                            <p className="font-medium">{label}</p>
                            <p className="text-sm">Total Changes: {data.changes}</p>
                            <p className="text-sm">Created: {data.created}</p>
                            <p className="text-sm">Edited: {data.edited}</p>
                            <p className="text-sm">Imported: {data.imported}</p>
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                  <Bar dataKey="created" stackId="a" fill="hsl(var(--accent))" />
                  <Bar dataKey="edited" stackId="a" fill="hsl(var(--primary))" />
                  <Bar dataKey="imported" stackId="a" fill="hsl(var(--muted-foreground))" />
                  />hartLegendContent />} />
                </BarChart>
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
            </CardHeader>
            <CardContent>d">Peak Upload Month</p>
                    <p className="text-lg font-bold">
                {reportData.childrenData.map((child, index) => (
                        ? reportData.timelineData.reduce((max, curr) => 
                            curr.documents > max.documents ? curr : max
                          ).month
                        : 'N/A'
                          {index + 1}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {reportData.timelineData.length > 0 
                        ? reportData.timelineData.reduce((max, curr) => 
                            curr.documents > max.documents ? curr : max
                          ).documents + ' documents'
                        : 'No data'
                      }
                    </p>
                  </div>
                  <TrendUp className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                        </div>
                      </div>
                    <p className="text-sm font-medium text-muted-foreground">Best Compliance Month</p>
                    <p className="text-lg font-bold">
                      {reportData.timelineData.length > 0 
                        ? reportData.timelineData.reduce((max, curr) => 
                            curr.complianceScore > max.complianceScore ? curr : max
                    </div>
                    
                      }
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {reportData.timelineData.length > 0 
                        ? reportData.timelineData.reduce((max, curr) => 
                            curr.complianceScore > max.complianceScore ? curr : max
                          ).complianceScore + '% score'
                        : 'No data'
                      }
                    </p>
                  </div>
                  <Target className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Changes</p>
                    <p className="text-lg font-bold">
                      {reportData.versionData.reduce((sum, curr) => sum + curr.changes, 0)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Across {reportData.versionData.length} months
                    </p>
                  </div>
                  <Clock className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Average Monthly Documents</p>
                  </div>-bold">
                ))}   {reportData.timelineData.length > 0 
                {reportData.childrenData.length === 0 && (
                        : '0'
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No children identified in documents</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="children" className="space-y-6">
          {/* Children Risk Assessment Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">High Risk Children</p>
                    <p className="text-2xl font-bold text-red-600">
                      {reportData.childrenData.filter(c => c.riskLevel === 'High').length}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">Require immediate attention</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-red-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Medium Risk Children</p>
                    <p className="text-2xl font-bold text-orange-600">
                      {reportData.childrenData.filter(c => c.riskLevel === 'Medium').length}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">Monitor closely</p>
                  </div>
                  <Warning className="h-8 w-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Children</p>
                    <p className="text-2xl font-bold">{reportData.metrics.childrenInvolved}</p>
                    <p className="text-xs text-muted-foreground mt-1">Identified in documents</p>
                  </div>
                  <Users className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Children Document Involvement Chart */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Children Document Involvement Analysis</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportChartData('Children Involvement', reportData.childrenData)}
              >
                <Download className="h-3 w-3" />
              </Button>
            </CardHeader>
            <CardContent>
              <ChartContainer config={{
                documents: { label: 'Documents', color: 'hsl(var(--primary))' },
                lawsInvolved: { label: 'Laws Involved', color: 'hsl(var(--destructive))' },
                primaryEvidence: { label: 'Primary Evidence', color: 'hsl(var(--accent))' }
              }}>
                <BarChart data={reportData.childrenData} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={80} />
                  <ChartTooltip 
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload
                        return (
                          <div className="bg-background border rounded-lg p-3 shadow-lg">
                            <p className="font-medium">{data.name}</p>
                            <p className="text-sm">Documents: {data.documents}</p>
                            <p className="text-sm">Laws Involved: {data.lawsInvolved}</p>
                            <p className="text-sm">Primary Evidence: {data.primaryEvidence}</p>
                            <p className={`text-sm font-medium ${
                              data.riskLevel === 'High' ? 'text-red-600' :
                              data.riskLevel === 'Medium' ? 'text-orange-600' : 'text-green-600'
                            }`}>
                              Risk Level: {data.riskLevel}
                            </p>
                            <p className="text-sm">Compliance Score: {data.complianceScore}</p>
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                  <Bar dataKey="documents" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
        </TabsContent>

        <TabsContent value="compliance" className="space-y-6">
          {/* Compliance Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Evidence Collection</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">Primary Evidence</span>
                    <Badge variant="default">{reportData.metrics.primaryEvidence}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Supporting Documents</span>
                    <Badge variant="secondary">
                      {reportData.categoryData.find(c => c.name === 'Supporting')?.value || 0}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">External Sources</span>
                    <Badge variant="outline">
                      {reportData.categoryData.find(c => c.name === 'External')?.value || 0}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Legal Documentation</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">Brady Violations</span>
                    <Badge variant="destructive">
                      {reportData.lawData.find(l => l.fullName === 'Brady v. Maryland')?.value || 0}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Due Process Issues</span>
                    <Badge variant="destructive">
                      {reportData.lawData.find(l => l.fullName === 'Due Process (14th Amendment)')?.value || 0}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Evidence Tampering</span>
                    <Badge variant="destructive">
                      {reportData.lawData.find(l => l.fullName === 'Evidence Tampering')?.value || 0}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Oversight Readiness</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">Packet Ready</span>
                    <Badge variant="default">{reportData.metrics.oversightReady}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Master File</span>
                    <Badge variant="secondary">
                      {reportData.placementData.find(p => p.name === 'Master File')?.value || 0}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Quality Control</span>
                    <Badge variant="outline">{reportData.metrics.totalVersions} versions</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Compliance Status */}
          <Card>
            <CardHeader>
              <CardTitle>Document Processing Compliance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <div>
                      <div className="font-medium">Document Classification</div>
                      <div className="text-sm text-muted-foreground">All documents categorized</div>
                    </div>
                  </div>
                  <Badge variant="default">100%</Badge>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <div>
                      <div className="font-medium">Legal Analysis</div>
                      <div className="text-sm text-muted-foreground">Law violations identified</div>
                    </div>
                  </div>
                  <Badge variant="default">{reportData.metrics.lawsViolated} laws</Badge>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <div>
                      <div className="font-medium">Version Tracking</div>
                      <div className="text-sm text-muted-foreground">Change history maintained</div>
                    </div>
                  </div>
                  <Badge variant="default">{reportData.metrics.avgVersionsPerDoc} avg/doc</Badge>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Shield className="h-5 w-5 text-blue-500" />
                    <div>
                      <div className="font-medium">Oversight Preparation</div>
                      <div className="text-sm text-muted-foreground">Documents ready for review</div>
                    </div>
                  </div>
                  <Badge variant="secondary">{reportData.metrics.oversightReady} packets</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}              </ChartContainer>
            </CardContent>
          </Card>

          {/* Detailed Children Impact Assessment */}
          <Card>
            <CardHeader>
              <CardTitle>Detailed Children Impact Assessment</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reportData.childrenData.map((child, index) => (
                  <div key={child.name} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-medium text-sm">
                          {index + 1}
                        </div>
                        <div>
                          <h4 className="font-medium text-lg">{child.name}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge 
                              variant={child.riskLevel === 'High' ? 'destructive' : 'outline'}
                              className={
                                child.riskLevel === 'Medium' ? 'border-orange-500 text-orange-700' :
                                child.riskLevel === 'Low' ? 'border-green-500 text-green-700' : ''
                              }
                            >
                              {child.riskLevel} Risk
                            </Badge>
                            <Badge variant="secondary">
                              Score: {child.complianceScore}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-muted-foreground">Compliance Score</div>
                        <div className="text-2xl font-bold">{child.complianceScore}</div>
                        <Progress value={child.complianceScore} className="w-20 h-2 mt-1" />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="text-sm text-muted-foreground">Documents Involved</div>
                          <div className="font-medium">{child.documents}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Scale className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="text-sm text-muted-foreground">Laws Connected</div>
                          <div className="font-medium">{child.lawsInvolved}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="text-sm text-muted-foreground">Primary Evidence</div>
                          <div className="font-medium">{child.primaryEvidence}</div>
                        </div>
                      </div>
                    </div>

                    {child.riskLevel === 'High' && (
                      <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5" />
                          <div>
                            <div className="text-sm font-medium text-red-800">High Priority Action Required</div>
                            <div className="text-sm text-red-700">
                              This child is involved in {child.primaryEvidence} primary evidence documents 
                              with {child.lawsInvolved} different law violations. Immediate review and protection measures recommended.
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                {reportData.childrenData.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No children identified in documents</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Children Protection Summary */}
          {reportData.childrenData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-blue-500" />
                  Child Protection Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium mb-3">Risk Distribution</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">High Risk</span>
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-muted rounded-full h-2">
                            <div 
                              className="bg-red-500 h-2 rounded-full" 
                              style={{ 
                                width: `${(reportData.childrenData.filter(c => c.riskLevel === 'High').length / reportData.childrenData.length) * 100}%` 
                              }}
                            />
                          </div>
                          <span className="text-sm font-medium">
                            {reportData.childrenData.filter(c => c.riskLevel === 'High').length}
                          </span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Medium Risk</span>
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-muted rounded-full h-2">
                            <div 
                              className="bg-orange-500 h-2 rounded-full" 
                              style={{ 
                                width: `${(reportData.childrenData.filter(c => c.riskLevel === 'Medium').length / reportData.childrenData.length) * 100}%` 
                              }}
                            />
                          </div>
                          <span className="text-sm font-medium">
                            {reportData.childrenData.filter(c => c.riskLevel === 'Medium').length}
                          </span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Low Risk</span>
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-muted rounded-full h-2">
                            <div 
                              className="bg-green-500 h-2 rounded-full" 
                              style={{ 
                                width: `${(reportData.childrenData.filter(c => c.riskLevel === 'Low').length / reportData.childrenData.length) * 100}%` 
                              }}
                            />
                          </div>
                          <span className="text-sm font-medium">
                            {reportData.childrenData.filter(c => c.riskLevel === 'Low').length}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-3">Key Statistics</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Average Documents per Child:</span>
                        <span className="font-medium">
                          {(reportData.childrenData.reduce((sum, child) => sum + child.documents, 0) / reportData.childrenData.length).toFixed(1)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Average Laws per Child:</span>
                        <span className="font-medium">
                          {(reportData.childrenData.reduce((sum, child) => sum + child.lawsInvolved, 0) / reportData.childrenData.length).toFixed(1)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Average Compliance Score:</span>
                        <span className="font-medium">
                          {(reportData.childrenData.reduce((sum, child) => sum + child.complianceScore, 0) / reportData.childrenData.length).toFixed(0)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Children with Primary Evidence:</span>
                        <span className="font-medium">
                          {reportData.childrenData.filter(c => c.primaryEvidence > 0).length}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="compliance" className="space-y-6">
          {/* Compliance Overview Dashboard */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Overall Compliance</p>
                    <p className={`text-2xl font-bold ${
                      reportData.metrics.overallComplianceScore >= 80 ? 'text-green-600' :
                      reportData.metrics.overallComplianceScore >= 60 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {reportData.metrics.overallComplianceScore}%
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {reportData.metrics.overallComplianceScore >= 80 ? 'Excellent' :
                       reportData.metrics.overallComplianceScore >= 60 ? 'Good' : 'Needs Improvement'}
                    </p>
                  </div>
                  <Target className={`h-8 w-8 ${
                    reportData.metrics.overallComplianceScore >= 80 ? 'text-green-500' :
                    reportData.metrics.overallComplianceScore >= 60 ? 'text-yellow-500' : 'text-red-500'
                  }`} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Text Extraction</p>
                    <p className="text-2xl font-bold">{reportData.qualityMetrics.textExtractionRate}%</p>
                    <p className="text-xs text-muted-foreground mt-1">Processing accuracy</p>
                  </div>
                  <FileText className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Legal Coverage</p>
                    <p className="text-2xl font-bold">{reportData.metrics.legalCoverage}%</p>
                    <p className="text-xs text-muted-foreground mt-1">Documents with legal analysis</p>
                  </div>
                  <Scale className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Version Control</p>
                    <p className="text-2xl font-bold">{reportData.qualityMetrics.versionControlCoverage}%</p>
                    <p className="text-xs text-muted-foreground mt-1">Documents tracked</p>
                  </div>
                  <Clock className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quality Metrics Detailed Analysis */}
          <Card>
            <CardHeader>
              <CardTitle>Document Processing Quality Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium mb-4">Processing Accuracy</h4>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm">Text Extraction Rate</span>
                          <span className="text-sm font-medium">{reportData.qualityMetrics.textExtractionRate}%</span>
                        </div>
                        <Progress value={reportData.qualityMetrics.textExtractionRate} className="h-2" />
                      </div>
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm">Children Identification</span>
                          <span className="text-sm font-medium">{reportData.qualityMetrics.childrenIdentificationRate}%</span>
                        </div>
                        <Progress value={reportData.qualityMetrics.childrenIdentificationRate} className="h-2" />
                      </div>
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm">Law Identification</span>
                          <span className="text-sm font-medium">{reportData.qualityMetrics.lawIdentificationRate}%</span>
                        </div>
                        <Progress value={reportData.qualityMetrics.lawIdentificationRate} className="h-2" />
                      </div>
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm">Category Accuracy</span>
                          <span className="text-sm font-medium">{reportData.qualityMetrics.categoryAccuracy}%</span>
                        </div>
                        <Progress value={reportData.qualityMetrics.categoryAccuracy} className="h-2" />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-4">Compliance Status</h4>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm">Inclusion Rate</span>
                          <span className="text-sm font-medium">{reportData.metrics.inclusionRate}%</span>
                        </div>
                        <Progress value={reportData.metrics.inclusionRate} className="h-2" />
                      </div>
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm">Oversight Readiness</span>
                          <span className="text-sm font-medium">{reportData.metrics.oversightReadiness}%</span>
                        </div>
                        <Progress value={reportData.metrics.oversightReadiness} className="h-2" />
                      </div>
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm">Evidence Completeness</span>
                          <span className="text-sm font-medium">{reportData.metrics.evidenceCompleteness}%</span>
                        </div>
                        <Progress value={reportData.metrics.evidenceCompleteness} className="h-2" />
                      </div>
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm">Version Control Coverage</span>
                          <span className="text-sm font-medium">{reportData.qualityMetrics.versionControlCoverage}%</span>
                        </div>
                        <Progress value={reportData.qualityMetrics.versionControlCoverage} className="h-2" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Compliance Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Evidence Collection</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">Primary Evidence</span>
                    <Badge variant="default">{reportData.metrics.primaryEvidence}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Supporting Documents</span>
                    <Badge variant="secondary">
                      {reportData.categoryData.find(c => c.name === 'Supporting')?.value || 0}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">External Sources</span>
                    <Badge variant="outline">
                      {reportData.categoryData.find(c => c.name === 'External')?.value || 0}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Evidence Quality Score</span>
                    <Badge variant={reportData.metrics.evidenceCompleteness >= 70 ? 'default' : 'destructive'}>
                      {reportData.metrics.evidenceCompleteness}%
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Legal Documentation</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">Brady Violations</span>
                    <Badge variant="destructive">
                      {reportData.lawData.find(l => l.fullName === 'Brady v. Maryland')?.value || 0}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Due Process Issues</span>
                    <Badge variant="destructive">
                      {reportData.lawData.find(l => l.fullName === 'Due Process (14th Amendment)')?.value || 0}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Evidence Tampering</span>
                    <Badge variant="destructive">
                      {reportData.lawData.find(l => l.fullName === 'Evidence Tampering')?.value || 0}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Critical Violations</span>
                    <Badge variant={reportData.metrics.criticalViolations > 0 ? 'destructive' : 'default'}>
                      {reportData.metrics.criticalViolations}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Oversight Readiness</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">Packets Ready</span>
                    <Badge variant="default">{reportData.metrics.oversightReady}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Master File</span>
                    <Badge variant="secondary">
                      {reportData.placementData.find(p => p.name === 'Master File')?.value || 0}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Readiness Score</span>
                    <Badge variant={reportData.metrics.oversightReadiness >= 75 ? 'default' : 'destructive'}>
                      {reportData.metrics.oversightReadiness}%
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">High Risk Children</span>
                    <Badge variant={reportData.childrenData.filter(c => c.riskLevel === 'High').length > 0 ? 'destructive' : 'default'}>
                      {reportData.childrenData.filter(c => c.riskLevel === 'High').length}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Enhanced Compliance Status */}
          <Card>
            <CardHeader>
              <CardTitle>Document Processing Compliance Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <div>
                      <div className="font-medium">Document Classification</div>
                      <div className="text-sm text-muted-foreground">All documents categorized and analyzed</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="default">100%</Badge>
                    <div className="text-right">
                      <div className="text-xs text-muted-foreground">
                        {reportData.metrics.totalDocuments} docs
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {reportData.metrics.criticalViolations === 0 ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-red-500" />
                    )}
                    <div>
                      <div className="font-medium">Critical Violations Assessment</div>
                      <div className="text-sm text-muted-foreground">
                        {reportData.metrics.criticalViolations === 0 
                          ? 'No critical violations identified'
                          : `${reportData.metrics.criticalViolations} critical violations require immediate attention`
                        }
                      </div>
                    </div>
                  </div>
                  <Badge variant={reportData.metrics.criticalViolations === 0 ? 'default' : 'destructive'}>
                    {reportData.metrics.criticalViolations} critical
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <div>
                      <div className="font-medium">Legal Analysis Coverage</div>
                      <div className="text-sm text-muted-foreground">
                        {reportData.metrics.lawsViolated} types of law violations identified across documents
                      </div>
                    </div>
                  </div>
                  <Badge variant="default">{reportData.metrics.legalCoverage}% coverage</Badge>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <div>
                      <div className="font-medium">Version Tracking</div>
                      <div className="text-sm text-muted-foreground">
                        Change history maintained with {reportData.metrics.avgVersionsPerDoc} average versions per document
                      </div>
                    </div>
                  </div>
                  <Badge variant="default">{reportData.qualityMetrics.versionControlCoverage}% tracked</Badge>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Shield className="h-5 w-5 text-blue-500" />
                    <div>
                      <div className="font-medium">Oversight Preparation</div>
                      <div className="text-sm text-muted-foreground">
                        {reportData.metrics.oversightReady} documents ready for oversight review and submission
                      </div>
                    </div>
                  </div>
                  <Badge variant={reportData.metrics.oversightReadiness >= 75 ? 'default' : 'secondary'}>
                    {reportData.metrics.oversightReadiness}% ready
                  </Badge>
                </div>

                {reportData.childrenData.filter(c => c.riskLevel === 'High').length > 0 && (
                  <div className="flex items-center justify-between p-4 border border-red-200 bg-red-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="h-5 w-5 text-red-500" />
                      <div>
                        <div className="font-medium text-red-800">Child Protection Alert</div>
                        <div className="text-sm text-red-700">
                          {reportData.childrenData.filter(c => c.riskLevel === 'High').length} children identified as high-risk
                        </div>
                      </div>
                    </div>
                    <Badge variant="destructive">
                      Priority Review Required
                    </Badge>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Compliance Action Items */}
          {generateRecommendations(reportData).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Table className="h-5 w-5 text-blue-500" />
                  Compliance Action Items
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {generateRecommendations(reportData).map((rec, index) => (
                    <div 
                      key={index}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${
                          rec.priority === 'Critical' ? 'bg-red-500' :
                          rec.priority === 'High' ? 'bg-orange-500' : 'bg-yellow-500'
                        }`} />
                        <div>
                          <div className="font-medium text-sm">{rec.issue}</div>
                          <div className="text-xs text-muted-foreground">{rec.category}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge 
                          variant={rec.priority === 'Critical' ? 'destructive' : 'outline'}
                          className={`text-xs ${
                            rec.priority === 'High' ? 'border-orange-500 text-orange-700' :
                            rec.priority === 'Medium' ? 'border-yellow-500 text-yellow-700' : ''
                          }`}
                        >
                          {rec.priority}
                        </Badge>
                        <div className="text-xs text-muted-foreground mt-1">{rec.timeframe}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}