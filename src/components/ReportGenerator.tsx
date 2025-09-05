import React, { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from '@/components/ui/chart'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell, LineChart, Line, AreaChart, Area, ResponsiveContainer } from 'recharts'
import { Download, FileText, TrendUp, Users, Scale, Shield, Calendar, Warning, CheckCircle, Clock, ChartBar, Warning, Target, Gavel, FileCheck, ChartPie, Table, GitBranch } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { VersionAnalytics } from './VersionAnalytics'

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
  const [selectedTimeRange, setSelectedTimeRange] = useState('all')
  const [selectedCategory, setSelectedCategory] = useState('all')

  // Generate comprehensive report data
  const reportData = useMemo(() => {
    const now = new Date()
    const filteredDocs = (documents || []).filter(doc => {
      if (!doc) return false
      if (selectedCategory !== 'all' && doc.category !== selectedCategory) return false
      
      if (selectedTimeRange !== 'all') {
        try {
          const docDate = new Date(doc.uploadedAt || now)
          const monthsAgo = selectedTimeRange === '1m' ? 1 : selectedTimeRange === '3m' ? 3 : selectedTimeRange === '6m' ? 6 : 12
          const cutoff = new Date(now.getFullYear(), now.getMonth() - monthsAgo, now.getDate())
          if (docDate < cutoff) return false
        } catch (error) {
          console.warn('Invalid date for document:', doc.fileName, error)
          return true // Include document if date parsing fails
        }
      }
      
      return true
    })

    // Summary statistics
    const summary = {
      totalDocuments: filteredDocs.length,
      primaryEvidence: filteredDocs.filter(d => d && d.category === 'Primary').length,
      supportingEvidence: filteredDocs.filter(d => d && d.category === 'Supporting').length,
      externalEvidence: filteredDocs.filter(d => d && d.category === 'External').length,
      excludedDocuments: filteredDocs.filter(d => d && d.category === 'No').length,
      includedDocuments: filteredDocs.filter(d => d && d.include === 'YES').length,
      masterFileReady: filteredDocs.filter(d => d && d.placement?.masterFile).length,
      exhibitBundleReady: filteredDocs.filter(d => d && d.placement?.exhibitBundle).length,
      oversightReady: filteredDocs.filter(d => d && d.placement?.oversightPacket).length,
      childrenInvolved: [...new Set(filteredDocs.flatMap(d => d && d.children ? d.children : []))].length,
      lawsViolated: [...new Set(filteredDocs.flatMap(d => d && d.laws ? d.laws : []))].length,
      totalVersions: (documentVersions || []).filter(v => v && filteredDocs.some(d => d && d.id === v.documentId)).length
    }

    // Category distribution for pie chart
    const categoryData = [
      { name: 'Primary', value: summary.primaryEvidence, color: 'hsl(var(--destructive))' },
      { name: 'Supporting', value: summary.supportingEvidence, color: 'hsl(var(--primary))' },
      { name: 'External', value: summary.externalEvidence, color: 'hsl(var(--accent))' },
      { name: 'Excluded', value: summary.excludedDocuments, color: 'hsl(var(--muted-foreground))' }
    ].filter(item => item.value > 0)

    // Timeline data for line chart
    const timelineData = Array.from({ length: 12 }, (_, i) => {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthDocs = filteredDocs.filter(doc => {
        const docDate = new Date(doc.uploadedAt)
        return docDate.getMonth() === date.getMonth() && docDate.getFullYear() === date.getFullYear()
      })
      
      return {
        month: date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        documents: monthDocs.length,
        primary: monthDocs.filter(d => d.category === 'Primary').length,
        supporting: monthDocs.filter(d => d.category === 'Supporting').length,
        external: monthDocs.filter(d => d.category === 'External').length
      }
    }).reverse()

    // Children involvement data
    const childrenData = [...new Set(filteredDocs.flatMap(d => d.children))]
      .map(child => ({
        name: child,
        documents: filteredDocs.filter(d => d.children.includes(child)).length,
        primaryDocs: filteredDocs.filter(d => d.children.includes(child) && d.category === 'Primary').length
      }))
      .sort((a, b) => b.documents - a.documents)

    // Laws violation data
    const lawsData = [...new Set(filteredDocs.flatMap(d => d.laws))]
      .map(law => ({
        name: law,
        documents: filteredDocs.filter(d => d.laws.includes(law)).length,
        evidence: filteredDocs.filter(d => d.laws.includes(law) && ['Primary', 'Supporting'].includes(d.category)).length
      }))
      .sort((a, b) => b.documents - a.documents)

    // Version activity data
    const versionData = Array.from({ length: 6 }, (_, i) => {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthVersions = documentVersions.filter(version => {
        const versionDate = new Date(version.changedAt)
        return versionDate.getMonth() === date.getMonth() && versionDate.getFullYear() === date.getFullYear()
      })
      
      return {
        month: date.toLocaleDateString('en-US', { month: 'short' }),
        changes: monthVersions.length,
        created: monthVersions.filter(v => v.changeType === 'created').length,
        edited: monthVersions.filter(v => v.changeType === 'edited').length,
        imported: monthVersions.filter(v => v.changeType === 'imported').length
      }
    }).reverse()

    // Compliance score calculation
    const complianceData = timelineData.map(month => {
      const monthDocs = filteredDocs.filter(doc => {
        const docDate = new Date(doc.uploadedAt)
        const [monthName, year] = month.month.split(' ')
        const monthIndex = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].indexOf(monthName)
        return docDate.getMonth() === monthIndex && docDate.getFullYear() === 2000 + parseInt(year)
      })
      
      let score = 0
      if (monthDocs.length > 0) {
        const primaryRatio = monthDocs.filter(d => d.category === 'Primary').length / monthDocs.length
        const includedRatio = monthDocs.filter(d => d.include === 'YES').length / monthDocs.length
        const oversightRatio = monthDocs.filter(d => d.placement.oversightPacket).length / monthDocs.length
        score = Math.round((primaryRatio * 40 + includedRatio * 35 + oversightRatio * 25) * 100)
      }
      
      return {
        ...month,
        complianceScore: score
      }
    })

    return {
      summary,
      categoryData,
      timelineData,
      childrenData,
      lawsData,
      versionData,
      complianceData,
      generatedAt: now.toISOString()
    }
  }, [documents, documentVersions, selectedTimeRange, selectedCategory])

  const exportChartData = (chartName: string, data: any[]) => {
    const csvContent = [
      Object.keys(data[0] || {}),
      ...data.map(row => Object.values(row))
    ]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${chartName.toLowerCase().replace(/\s+/g, '-')}-data.csv`
    a.click()
    URL.revokeObjectURL(url)
    
    toast.success(`${chartName} data exported`)
  }

  const MetricCard = ({ title, value, subtitle, icon: Icon, trend }: {
    title: string
    value: string | number
    subtitle: string
    icon: any
    trend?: 'up' | 'down' | 'neutral'
  }) => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            <p className={`text-sm ${
              trend === 'up' ? 'text-green-600' :
              trend === 'down' ? 'text-red-600' :
              'text-muted-foreground'
            }`}>
              {subtitle}
            </p>
          </div>
          <Icon className="h-8 w-8 text-muted-foreground" />
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <ChartBar className="h-6 w-6" />
            Justice Analytics Report
          </h2>
          <p className="text-muted-foreground">
            Comprehensive analysis and insights for document management and compliance
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={selectedTimeRange} onValueChange={setSelectedTimeRange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="1m">Last Month</SelectItem>
              <SelectItem value="3m">Last 3 Months</SelectItem>
              <SelectItem value="6m">Last 6 Months</SelectItem>
              <SelectItem value="1y">Last Year</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-40">
              <SelectValue /> 
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="Primary">Primary Only</SelectItem>
              <SelectItem value="Supporting">Supporting Only</SelectItem>
              <SelectItem value="External">External Only</SelectItem>
              <SelectItem value="No">Excluded Only</SelectItem>
            </SelectContent>
          </Select>
          
          <Button onClick={() => onExportReport(reportData)} className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export Report
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
          <TabsTrigger value="evidence">Evidence</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="analysis" className="flex items-center gap-1">
            <Target className="h-3 w-3" />
            Analysis
          </TabsTrigger>
          <TabsTrigger value="versions" className="flex items-center gap-1">
            <GitBranch className="h-3 w-3" />
            Versions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Total Documents"
              value={reportData.summary.totalDocuments}
              subtitle={`${reportData.summary.includedDocuments} included`}
              icon={FileText}
            />
            <MetricCard
              title="Primary Evidence"
              value={reportData.summary.primaryEvidence}
              subtitle={`${Math.round((reportData.summary.primaryEvidence / Math.max(reportData.summary.totalDocuments, 1)) * 100)}% of total`}
              icon={Shield}
            />
            <MetricCard
              title="Children Involved"
              value={reportData.summary.childrenInvolved}
              subtitle={`${reportData.childrenData.length} unique names`}
              icon={Users}
            />
            <MetricCard
              title="Laws Violated"
              value={reportData.summary.lawsViolated}
              subtitle={`${reportData.lawsData.length} distinct violations`}
              icon={Scale}
            />
          </div>

          {/* Category Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Document Categories</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => exportChartData('Document Categories', reportData.categoryData)}
                >
                  <Download className="h-3 w-3" />
                </Button>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    primary: { label: 'Primary', color: 'hsl(var(--destructive))' },
                    supporting: { label: 'Supporting', color: 'hsl(var(--primary))' },
                    external: { label: 'External', color: 'hsl(var(--accent))' },
                    excluded: { label: 'Excluded', color: 'hsl(var(--muted-foreground))' }
                  }}
                  className="h-80"
                >
                  <PieChart>
                    <Pie
                      data={reportData.categoryData}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {reportData.categoryData.map((entry, index) => (
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
                <CardTitle>Document Status</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => exportChartData('Document Status', [
                    { status: 'Included', count: reportData.summary.includedDocuments },
                    { status: 'Excluded', count: reportData.summary.totalDocuments - reportData.summary.includedDocuments },
                    { status: 'Master File Ready', count: reportData.summary.masterFileReady },
                    { status: 'Oversight Ready', count: reportData.summary.oversightReady }
                  ])}
                >
                  <Download className="h-3 w-3" />
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Inclusion Rate</span>
                    <span className="text-sm text-muted-foreground">
                      {Math.round((reportData.summary.includedDocuments / Math.max(reportData.summary.totalDocuments, 1)) * 100)}%
                    </span>
                  </div>
                  <Progress 
                    value={(reportData.summary.includedDocuments / Math.max(reportData.summary.totalDocuments, 1)) * 100} 
                    className="h-2"
                  />
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Master File Readiness</span>
                    <span className="text-sm text-muted-foreground">
                      {Math.round((reportData.summary.masterFileReady / Math.max(reportData.summary.totalDocuments, 1)) * 100)}%
                    </span>
                  </div>
                  <Progress 
                    value={(reportData.summary.masterFileReady / Math.max(reportData.summary.totalDocuments, 1)) * 100} 
                    className="h-2"
                  />
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Oversight Packet Readiness</span>
                    <span className="text-sm text-muted-foreground">
                      {Math.round((reportData.summary.oversightReady / Math.max(reportData.summary.totalDocuments, 1)) * 100)}%
                    </span>
                  </div>
                  <Progress 
                    value={(reportData.summary.oversightReady / Math.max(reportData.summary.totalDocuments, 1)) * 100} 
                    className="h-2"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="timeline" className="space-y-6">
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
              <ChartContainer
                config={{
                  documents: { label: 'Total Documents', color: 'hsl(var(--primary))' },
                  primary: { label: 'Primary', color: 'hsl(var(--destructive))' },
                  supporting: { label: 'Supporting', color: 'hsl(var(--accent))' },
                  external: { label: 'External', color: 'hsl(var(--muted-foreground))' }
                }}
                className="h-80"
              >
                <AreaChart data={reportData.timelineData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area 
                    type="monotone" 
                    dataKey="primary" 
                    stackId="1"
                    stroke="hsl(var(--destructive))" 
                    fill="hsl(var(--destructive))"
                    fillOpacity={0.6}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="supporting" 
                    stackId="1"
                    stroke="hsl(var(--accent))" 
                    fill="hsl(var(--accent))"
                    fillOpacity={0.6}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="external" 
                    stackId="1"
                    stroke="hsl(var(--muted-foreground))" 
                    fill="hsl(var(--muted-foreground))"
                    fillOpacity={0.6}
                  />
                </AreaChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compliance" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Compliance Score Over Time</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportChartData('Compliance Score', reportData.complianceData)}
              >
                <Download className="h-3 w-3" />
              </Button>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  complianceScore: { label: 'Compliance Score', color: 'hsl(var(--accent))' }
                }}
                className="h-80"
              >
                <AreaChart data={reportData.complianceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis domain={[0, 100]} />
                  <ChartTooltip 
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload
                        const score = data.complianceScore
                        const color = score >= 80 ? 'text-green-600' : score >= 60 ? 'text-yellow-600' : 'text-red-600'
                        return (
                          <div className="bg-background border rounded-lg p-3 shadow-lg">
                            <p className="font-medium">{label}</p>
                            <p className={`text-sm font-medium ${color}`}>
                              Compliance Score: {score}%
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
        </TabsContent>

        <TabsContent value="evidence" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Children Involvement</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => exportChartData('Children Involvement', reportData.childrenData)}
                >
                  <Download className="h-3 w-3" />
                </Button>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    documents: {
                      label: "Total Documents",
                      color: "hsl(var(--primary))"
                    },
                    primaryDocs: {
                      label: "Primary Documents", 
                      color: "hsl(var(--destructive))"
                    }
                  }}
                >
                  <BarChart data={reportData.childrenData.slice(0, 10)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="documents" fill="hsl(var(--primary))" />
                    <Bar dataKey="primaryDocs" fill="hsl(var(--destructive))" />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Law Violations</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => exportChartData('Law Violations', reportData.lawsData)}
                >
                  <Download className="h-3 w-3" />
                </Button>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    documents: { label: 'Total Documents', color: 'hsl(var(--accent))' },
                    evidence: { label: 'Evidence Documents', color: 'hsl(var(--primary))' }
                  }}
                  className="h-80"
                >
                  <BarChart data={reportData.lawsData.slice(0, 8)}>
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
                    <Bar dataKey="documents" fill="hsl(var(--accent))" />
                    <Bar dataKey="evidence" fill="hsl(var(--primary))" />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Version Control Activity</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportChartData('Version Activity', reportData.versionData)}
              >
                <Download className="h-3 w-3" />
              </Button>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  created: { label: 'Created', color: 'hsl(var(--accent))' },
                  edited: { label: 'Edited', color: 'hsl(var(--primary))' },
                  imported: { label: 'Imported', color: 'hsl(var(--muted-foreground))' }
                }}
                className="h-80"
              >
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
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <MetricCard
              title="Most Active Month"
              value={reportData.versionData.length > 0 
                ? reportData.versionData.reduce((max, curr) =>
                    curr.changes > max.changes ? curr : max
                  ).month
                : 'N/A'
              }
              subtitle={reportData.versionData.length > 0 
                ? reportData.versionData.reduce((max, curr) =>
                    curr.changes > max.changes ? curr : max
                  ).changes + ' changes'
                : 'No data'
              }
              icon={TrendUp}
            />
            <MetricCard
              title="Peak Upload Month"
              value={reportData.timelineData.length > 0 
                ? reportData.timelineData.reduce((max, curr) =>
                    curr.documents > max.documents ? curr : max
                  ).month
                : 'N/A'
              }
              subtitle={reportData.timelineData.length > 0 
                ? reportData.timelineData.reduce((max, curr) =>
                    curr.documents > max.documents ? curr : max
                  ).documents + ' documents'
                : 'No data'
              }
              icon={Calendar}
            />
            <MetricCard
              title="Avg Compliance Score"
              value={reportData.complianceData.length > 0 
                ? Math.round(reportData.complianceData.reduce((sum, item) => sum + item.complianceScore, 0) / reportData.complianceData.length) + '%'
                : 'N/A'
              }
              subtitle="Last 12 months"
              icon={Target}
            />
          </div>
        </TabsContent>

        <TabsContent value="analysis" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Date-Based Document Comparison
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-muted/50 rounded-lg p-4">
                  <h4 className="font-semibold mb-2">Detect Document Tampering</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Compare documents that share the same date to identify potential alterations, 
                    inconsistencies, or tampering. This tool analyzes word-level differences and 
                    tracks mentions of key individuals.
                  </p>
                  
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span>Text Extraction & Date Detection</span>
                      <Badge variant="outline">Automated</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Word-Level Diff Analysis</span>
                      <Badge variant="outline">Precise</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Name Mention Tracking</span>
                      <Badge variant="outline">Target: Noel, Andy Maki, etc.</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Numerical Change Detection</span>
                      <Badge variant="outline">Forensic</Badge>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <Button 
                    className="w-full" 
                    onClick={() => {
                      toast.info('Date comparison requires Python environment. Use: python scripts/compare_by_date.py')
                      // In a real implementation, this could trigger a server-side process
                    }}
                  >
                    <Target className="h-4 w-4 mr-2" />
                    Run Date-Based Comparison
                  </Button>
                  
                  <div className="text-xs text-muted-foreground">
                    <p><strong>Output:</strong></p>
                    <ul className="list-disc list-inside ml-2 space-y-1">
                      <li>HTML reports with inline diffs</li>
                      <li>CSV summary of all changes</li>
                      <li>Name mention deltas</li>
                      <li>Numerical alterations</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Warning className="h-5 w-5" />
                  Analysis Rules & Detection
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="border rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">High Priority Names</span>
                      <Badge variant="destructive">Monitor</Badge>
                    </div>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <div>• Noel (Primary subject)</div>
                      <div>• Andy Maki (Key witness)</div>
                      <div>• Banister (Officer)</div>
                      <div>• Russell (Medical examiner)</div>
                      <div>• Verde (Authority figure)</div>
                    </div>
                  </div>
                  
                  <div className="border rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">Change Detection</span>
                      <Badge variant="warning">Automatic</Badge>
                    </div>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <div>• Word additions/removals</div>
                      <div>• Numerical modifications</div>
                      <div>• Timeline inconsistencies</div>
                      <div>• Context alterations</div>
                    </div>
                  </div>
                  
                  <div className="border rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">Report Output</span>
                      <Badge variant="outline">Exportable</Badge>
                    </div>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <div>• Interactive HTML viewer</div>
                      <div>• Structured CSV data</div>
                      <div>• Highlighted differences</div>
                      <div>• Confidence scoring</div>
                    </div>
                  </div>
                </div>
                
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => {
                    const instructions = `
DATE-BASED COMPARISON INSTRUCTIONS:

1. Ensure Python environment is set up:
   pip install pdfplumber PyPDF2

2. Place PDF documents in input/ directory

3. Run the comparison script:
   python scripts/compare_by_date.py --names "Noel,Andy Maki,Banister,Russell,Verde"

4. View results in output/date_diffs/:
   - index.html (overview)
   - changes_summary.csv (data)
   - YYYY-MM-DD/ (date-specific diffs)

5. Look for:
   - Added/removed text
   - Name mention changes
   - Numerical alterations
   - Timeline inconsistencies
                    `.trim()
                    
                    navigator.clipboard.writeText(instructions)
                    toast.success('Instructions copied to clipboard!')
                  }}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Copy Setup Instructions
                </Button>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Scale className="h-5 w-5" />
                Potential Evidence of Tampering
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Warning className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-yellow-800 mb-2">What to Look For</h4>
                    <div className="text-sm text-yellow-700 space-y-2">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <strong>Text Modifications:</strong>
                          <ul className="list-disc list-inside ml-2 mt-1 space-y-0.5">
                            <li>Changed conclusions or findings</li>
                            <li>Altered witness statements</li>
                            <li>Modified medical observations</li>
                            <li>Updated incident descriptions</li>
                          </ul>
                        </div>
                        <div>
                          <strong>Numerical Changes:</strong>
                          <ul className="list-disc list-inside ml-2 mt-1 space-y-0.5">
                            <li>Different ages or dates</li>
                            <li>Changed case numbers</li>
                            <li>Modified page references</li>
                            <li>Altered measurement values</li>
                          </ul>
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t border-yellow-300">
                        <strong>Documentation Strategy:</strong> When differences are found, 
                        export the HTML reports and CSV data as evidence. The word-level 
                        highlighting makes it easy to identify exactly what was changed 
                        and when specific individuals were mentioned differently.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="versions" className="space-y-6">
          <VersionAnalytics 
            documents={documents}
            documentVersions={documentVersions}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}