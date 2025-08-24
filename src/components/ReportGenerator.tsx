import React, { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from '@/components/ui/chart'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell, LineChart, Line, RadialBarChart, RadialBar, ResponsiveContainer } from 'recharts'
import { Download, FileText, TrendUp, Users, Scale, Shield, Calendar, AlertTriangle, CheckCircle, Clock, BarChart3 } from '@phosphor-icons/react'
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

  // Calculate report data
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
      fill: name === 'Primary' ? 'hsl(var(--destructive))' : 
            name === 'Supporting' ? 'hsl(var(--primary))' :
            name === 'External' ? 'hsl(var(--accent))' : 'hsl(var(--muted-foreground))'
    })) : [
      { name: 'Primary', value: 0, fill: 'hsl(var(--destructive))' },
      { name: 'Supporting', value: 0, fill: 'hsl(var(--primary))' },
      { name: 'External', value: 0, fill: 'hsl(var(--accent))' },
      { name: 'No', value: 0, fill: 'hsl(var(--muted-foreground))' }
    ]

    // Law violations frequency
    const lawData = Object.entries(
      filteredDocs.reduce((acc, doc) => {
        doc.laws.forEach(law => {
          acc[law] = (acc[law] || 0) + 1
        })
        return acc
      }, {} as Record<string, number>)
    ).map(([name, value]) => ({
      name: name.replace(' (14th Amendment)', ''),
      fullName: name,
      value,
      fill: 'hsl(var(--destructive))'
    })).sort((a, b) => b.value - a.value)

    // Children involvement
    const childrenData = Object.entries(
      filteredDocs.reduce((acc, doc) => {
        doc.children.forEach(child => {
          acc[child] = (acc[child] || 0) + 1
        })
        return acc
      }, {} as Record<string, number>)
    ).map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)

    // Upload timeline (monthly)
    const timelineData = Object.entries(
      filteredDocs.reduce((acc, doc) => {
        const month = new Date(doc.uploadedAt).toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'short' 
        })
        acc[month] = (acc[month] || 0) + 1
        return acc
      }, {} as Record<string, number>)
    ).map(([month, documents]) => ({ month, documents }))
      .sort((a, b) => new Date(a.month + ' 1').getTime() - new Date(b.month + ' 1').getTime())

    // Inclusion status
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

    // Placement analysis
    const placementData = [
      {
        name: 'Master File',
        value: filteredDocs.filter(doc => doc.placement.masterFile).length,
        fill: 'hsl(var(--primary))'
      },
      {
        name: 'Exhibit Bundle',
        value: filteredDocs.filter(doc => doc.placement.exhibitBundle).length,
        fill: 'hsl(var(--accent))'
      },
      {
        name: 'Oversight Packet',
        value: filteredDocs.filter(doc => doc.placement.oversightPacket).length,
        fill: 'hsl(var(--destructive))'
      }
    ]

    // Version history analysis
    const versionData = Object.entries(
      documentVersions.reduce((acc, version) => {
        const month = new Date(version.changedAt).toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'short' 
        })
        acc[month] = (acc[month] || 0) + 1
        return acc
      }, {} as Record<string, number>)
    ).map(([month, changes]) => ({ month, changes }))
      .sort((a, b) => new Date(a.month + ' 1').getTime() - new Date(b.month + ' 1').getTime())

    // Key metrics
    const metrics = {
      totalDocuments: filteredDocs.length,
      primaryEvidence: filteredDocs.filter(doc => doc.category === 'Primary').length,
      includedDocuments: filteredDocs.filter(doc => doc.include === 'YES').length,
      childrenInvolved: new Set(filteredDocs.flatMap(doc => doc.children)).size,
      lawsViolated: new Set(filteredDocs.flatMap(doc => doc.laws)).size,
      oversightReady: filteredDocs.filter(doc => doc.placement.oversightPacket).length,
      totalVersions: documentVersions.length,
      avgVersionsPerDoc: documents.length > 0 ? (documentVersions.length / documents.length).toFixed(1) : '0'
    }

    return {
      categoryData,
      lawData,
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
      title: 'Justice Document Manager - Comprehensive Report',
      generatedAt: new Date().toISOString(),
      timeframe: selectedTimeframe,
      summary: reportData.metrics,
      data: {
        categoryDistribution: reportData.categoryData,
        lawViolations: reportData.lawData,
        childrenInvolvement: reportData.childrenData,
        uploadTimeline: reportData.timelineData,
        inclusionStatus: reportData.inclusionData,
        placementAnalysis: reportData.placementData,
        versionHistory: reportData.versionData
      },
      documents: reportData.filteredDocuments.map(doc => ({
        fileName: doc.fileName,
        title: doc.title,
        category: doc.category,
        children: doc.children,
        laws: doc.laws,
        include: doc.include,
        uploadedAt: doc.uploadedAt,
        currentVersion: doc.currentVersion
      }))
    }

    onExportReport(report)
    toast.success('Comprehensive report generated and exported')
  }

  const exportChartData = (chartType: string, data: any[]) => {
    const csvContent = [
      [chartType, 'Count'],
      ...data.map(item => [item.name || item.month, item.value || item.documents || item.changes])
    ]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${chartType.toLowerCase().replace(/\s+/g, '-')}-data.csv`
    a.click()
    URL.revokeObjectURL(url)

    toast.success(`${chartType} data exported`)
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
          <Button onClick={generateFullReport} className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export Full Report
          </Button>
        </div>
      </div>

      {/* Key Metrics Dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          title="Total Documents"
          value={reportData.metrics.totalDocuments}
          icon={FileText}
          subtitle="Documents processed"
          trend="up"
        />
        <MetricCard
          title="Primary Evidence"
          value={reportData.metrics.primaryEvidence}
          icon={AlertTriangle}
          subtitle="Critical documents"
          trend="up"
        />
        <MetricCard
          title="Children Involved"
          value={reportData.metrics.childrenInvolved}
          icon={Users}
          subtitle="Unique children identified"
        />
        <MetricCard
          title="Law Violations"
          value={reportData.metrics.lawsViolated}
          icon={Scale}
          subtitle="Types of violations"
          trend="up"
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          title="Inclusion Rate"
          value={`${Math.round((reportData.metrics.includedDocuments / Math.max(reportData.metrics.totalDocuments, 1)) * 100)}%`}
          icon={CheckCircle}
          subtitle={`${reportData.metrics.includedDocuments} included`}
        />
        <MetricCard
          title="Oversight Ready"
          value={reportData.metrics.oversightReady}
          icon={Shield}
          subtitle="Packets prepared"
        />
        <MetricCard
          title="Version History"
          value={reportData.metrics.totalVersions}
          icon={Clock}
          subtitle={`Avg ${reportData.metrics.avgVersionsPerDoc} per doc`}
        />
        <MetricCard
          title="Report Type"
          value={reportType.charAt(0).toUpperCase() + reportType.slice(1)}
          icon={BarChart3}
          subtitle="Current view"
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
          {/* Law Violations */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Law Violations Frequency</CardTitle>
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
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Law Violations Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Legal Violations Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {reportData.lawData.slice(0, 5).map((law, index) => (
                  <div key={law.fullName} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">{index + 1}</Badge>
                      <div>
                        <div className="font-medium">{law.fullName}</div>
                        <div className="text-sm text-muted-foreground">
                          Found in {law.value} document{law.value !== 1 ? 's' : ''}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <div className="font-bold">{law.value}</div>
                        <div className="text-xs text-muted-foreground">violations</div>
                      </div>
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: law.fill }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timeline" className="space-y-6">
          {/* Upload Timeline */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Document Upload Timeline</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportChartData('Upload Timeline', reportData.timelineData)}
              >
                <Download className="h-3 w-3" />
              </Button>
            </CardHeader>
            <CardContent>
              <ChartContainer config={{
                documents: { label: 'Documents', color: 'hsl(var(--primary))' }
              }}>
                <LineChart data={reportData.timelineData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line 
                    type="monotone" 
                    dataKey="documents" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--primary))' }}
                  />
                </LineChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Version History Timeline */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Document Changes Timeline</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportChartData('Version Timeline', reportData.versionData)}
              >
                <Download className="h-3 w-3" />
              </Button>
            </CardHeader>
            <CardContent>
              <ChartContainer config={{
                changes: { label: 'Changes', color: 'hsl(var(--accent))' }
              }}>
                <BarChart data={reportData.versionData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar 
                    dataKey="changes" 
                    fill="hsl(var(--accent))" 
                    radius={[4, 4, 0, 0]} 
                  />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="children" className="space-y-6">
          {/* Children Involvement */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Children Document Involvement</CardTitle>
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
                value: { label: 'Documents', color: 'hsl(var(--primary))' }
              }}>
                <BarChart data={reportData.childrenData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="value" />
                  <YAxis dataKey="name" width={80} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar 
                    dataKey="value" 
                    fill="hsl(var(--primary))" 
                    radius={[0, 4, 4, 0]} 
                  />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Children Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Children Impact Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {reportData.childrenData.map((child, index) => (
                  <div key={child.name} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Users className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <div className="font-medium">{child.name}</div>
                        <div className="text-sm text-muted-foreground">
                          Mentioned in documents
                        </div>
                      </div>
                    </div>
                    <Badge variant="secondary">{child.value}</Badge>
                  </div>
                ))}
                {reportData.childrenData.length === 0 && (
                  <div className="col-span-2 text-center py-8 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No children identified in documents</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
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
}