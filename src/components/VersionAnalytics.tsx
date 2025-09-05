import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { 
  Activity, 
  ChartBar, 
  Calendar, 
  Clock, 
  Pencil, 
  FileArrowUp, 
  GitBranch, 
  TrendUp, 
  Users 
} from '@phosphor-icons/react'

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

interface VersionAnalyticsProps {
  documents: Document[]
  documentVersions: DocumentVersion[]
}

const getChangeTypeColor = (type: string) => {
  switch (type) {
    case 'created': return 'bg-green-100 text-green-800'
    case 'edited': return 'bg-blue-100 text-blue-800'
    case 'imported': return 'bg-purple-100 text-purple-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

const getChangeTypeIcon = (type: string) => {
  switch (type) {
    case 'created': return <FileArrowUp className="h-3 w-3" />
    case 'edited': return <Pencil className="h-3 w-3" />
    case 'imported': return <GitBranch className="h-3 w-3" />
    default: return <Clock className="h-3 w-3" />
  }
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export function VersionAnalytics({ documents, documentVersions }: VersionAnalyticsProps) {
  const analytics = useMemo(() => {
    const totalVersions = documentVersions.length
    const totalCreations = documentVersions.filter(v => v.changeType === 'created').length
    const totalEdits = documentVersions.filter(v => v.changeType === 'edited').length
    const totalImports = documentVersions.filter(v => v.changeType === 'imported').length
    
    // User activity
    const userCounts = documentVersions.reduce((acc, version) => {
      acc[version.changedBy] = (acc[version.changedBy] || 0) + 1
      return acc
    }, {} as { [key: string]: number })
    
    const mostActiveUser = Object.entries(userCounts)
      .sort(([,a], [,b]) => b - a)[0] || ['None', 0]
    
    // Recent activity (last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    const recentActivity = documentVersions
      .filter(v => new Date(v.changedAt) >= sevenDaysAgo)
      .sort((a, b) => new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime())
    
    // Average versions per document
    const averageVersionsPerDocument = documents.length > 0 ? totalVersions / documents.length : 0
    
    // Monthly trends
    const monthlyTrends = Object.entries(
      documentVersions.reduce((acc, version) => {
        const monthKey = new Date(version.changedAt).toISOString().slice(0, 7) // YYYY-MM format
        if (!acc[monthKey]) {
          acc[monthKey] = { versions: 0, documents: new Set<string>() }
        }
        acc[monthKey].versions++
        acc[monthKey].documents.add(version.documentId)
        return acc
      }, {} as { [key: string]: { versions: number, documents: Set<string> } })
    )
      .map(([month, data]) => ({
        month,
        versions: data.versions,
        documents: data.documents.size
      }))
      .sort(([a], [b]) => a.localeCompare(b))
    
    // Category analysis
    const categoryVersions = documentVersions.reduce((acc, version) => {
      acc[version.category] = (acc[version.category] || 0) + 1
      return acc
    }, {} as { [key: string]: number })
    
    // Change type distribution
    const changeTypeDistribution = {
      created: totalCreations,
      edited: totalEdits,
      imported: totalImports
    }
    
    return {
      totalVersions,
      totalCreations,
      totalEdits,
      totalImports,
      userCounts,
      mostActiveUser: { user: mostActiveUser[0], count: mostActiveUser[1] },
      averageVersionsPerDocument,
      recentActivity: recentActivity.slice(0, 10),
      monthlyTrends,
      categoryVersions,
      changeTypeDistribution,
      activeUsers: Object.keys(userCounts).length
    }
  }, [documents, documentVersions])

  if (documentVersions.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-semibold mb-2">No Version Data Yet</h3>
          <p className="text-muted-foreground">
            Version tracking starts when you edit documents. Make changes to see analytics here.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Edits</CardTitle>
            <Pencil className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalEdits}</div>
            <p className="text-xs text-muted-foreground">
              {analytics.totalEdits} edits made
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Versions</CardTitle>
            <ChartBar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.averageVersionsPerDocument.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">
              {analytics.averageVersionsPerDocument.toFixed(1)} avg per document
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Most Active User</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.mostActiveUser.count}</div>
            <p className="text-xs text-muted-foreground">
              changes by {analytics.mostActiveUser.user}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.recentActivity.length}</div>
            <p className="text-xs text-muted-foreground">
              changes in last 7 days
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="activity" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="activity">Recent Activity</TabsTrigger>
          <TabsTrigger value="distribution">Change Types</TabsTrigger>
          <TabsTrigger value="trends">Monthly Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Recent Changes
                <Badge variant="outline">{analytics.recentActivity.length} in last 7 days</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {analytics.recentActivity.length > 0 ? (
                <div className="space-y-3">
                  {analytics.recentActivity.map((version) => {
                    const document = documents.find(d => d.id === version.documentId)
                    return (
                      <div key={version.id} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                        <Badge className={getChangeTypeColor(version.changeType)}>
                          {getChangeTypeIcon(version.changeType)}
                          <span className="ml-1 capitalize">{version.changeType}</span>
                        </Badge>
                        <div className="min-w-0 flex-1">
                          <div className="font-medium truncate">
                            {document?.title || 'Unknown Document'}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            by {version.changedBy}
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {formatDate(version.changedAt)}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No recent activity</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="distribution" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ChartBar className="h-5 w-5" />
                  Change Types
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(analytics.changeTypeDistribution).map(([type, count]) => {
                    const percentage = analytics.totalVersions > 0 ? (count / analytics.totalVersions) * 100 : 0
                    return (
                      <div key={type} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge className={getChangeTypeColor(type)}>
                              {getChangeTypeIcon(type)}
                              <span className="ml-1 capitalize">{type}</span>
                            </Badge>
                            <span className="text-sm text-muted-foreground">{count} changes</span>
                          </div>
                          <span className="text-sm font-medium">{percentage.toFixed(1)}%</span>
                        </div>
                        <Progress value={percentage} className="h-2" />
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  User Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(analytics.userCounts)
                    .sort(([,a], [,b]) => b - a)
                    .map(([user, count]) => {
                      const percentage = analytics.totalVersions > 0 ? (count / analytics.totalVersions) * 100 : 0
                      return (
                        <div key={user} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">
                                <Users className="h-3 w-3 mr-1" />
                                {user}
                              </Badge>
                              <span className="text-sm text-muted-foreground">{count} changes</span>
                            </div>
                            <span className="text-sm font-medium">{percentage.toFixed(1)}%</span>
                          </div>
                          <Progress value={percentage} className="h-2" />
                        </div>
                      )
                    })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendUp className="h-5 w-5" />
                Monthly Activity Trends
              </CardTitle>
            </CardHeader>
            <CardContent>
              {analytics.monthlyTrends.length > 0 ? (
                <div className="space-y-4">
                  {analytics.monthlyTrends.map((trend) => {
                    const versionPercentage = analytics.totalVersions > 0 ? (trend.versions / analytics.totalVersions) * 100 : 0
                    return (
                      <div key={trend.month} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              {new Date(trend.month + '-01').toLocaleDateString('en-US', { 
                                year: 'numeric', 
                                month: 'short' 
                              })}
                            </span>
                            <Badge variant="outline">
                              {trend.versions} versions, {trend.documents} docs
                            </Badge>
                          </div>
                          <span className="text-sm font-medium">
                            {(trend.versions / trend.documents).toFixed(1)} avg per doc
                          </span>
                        </div>
                        <Progress value={versionPercentage} className="h-3" />
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No trend data available yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}