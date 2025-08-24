import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  GitBranch, 
  Users, 
  TrendingUp, 
  Edit, 
  BarChart3,
  Activity,
  Clock,
  FileArrowUp,
  PieChart,
  Calendar
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

export function VersionAnalytics({ documents, documentVersions }: VersionAnalyticsProps) {
  const analytics = useMemo(() => {
    const totalVersions = documentVersions.length
    const totalEdits = documentVersions.filter(v => v.changeType === 'edited').length
    const totalImports = documentVersions.filter(v => v.changeType === 'imported').length
    const totalCreations = documentVersions.filter(v => v.changeType === 'created').length
    
    const userCounts = documentVersions.reduce((acc, version) => {
      acc[version.changedBy] = (acc[version.changedBy] || 0) + 1
      return acc
    }, {} as { [key: string]: number })
    
    const mostActiveUser = Object.entries(userCounts)
      .sort(([,a], [,b]) => b - a)[0] || 
      { user: 'None', count: 0 }
    
    const documentsWithMultipleVersions = documents.filter(doc => doc.currentVersion > 1).length
    const averageVersionsPerDocument = documents.length > 0 ? totalVersions / documents.length : 0
    
    // Recent activity (last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    const recentActivity = documentVersions
      .filter(v => new Date(v.changedAt) >= sevenDaysAgo)
      .sort((a, b) => new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime())
      .slice(0, 10)
    
    // Daily version activity
    const versionsByDay = documentVersions.reduce((acc, version) => {
      const date = new Date(version.changedAt).toISOString().split('T')[0]
      acc[date] = (acc[date] || 0) + 1
      return acc
    }, {} as { [key: string]: number })
    
    // Change type distribution
    const changeTypeDistribution = documentVersions.reduce((acc, version) => {
      acc[version.changeType] = (acc[version.changeType] || 0) + 1
      return acc
    }, {} as { [key: string]: number })
    
    // User activity breakdown
    const userActivityBreakdown = documentVersions.reduce((acc, version) => {
      if (!acc[version.changedBy]) {
        acc[version.changedBy] = { created: 0, edited: 0, imported: 0 }
      }
      acc[version.changedBy][version.changeType]++
      return acc
    }, {} as { [key: string]: { created: number; edited: number; imported: number } })
    
    // Category-based version analysis
    const categoryVersions = documentVersions.reduce((acc, version) => {
      acc[version.category] = (acc[version.category] || 0) + 1
      return acc
    }, {} as { [key: string]: number })
    
    // Monthly trends
    const monthlyData = documentVersions.reduce((acc, version) => {
      const date = new Date(version.changedAt)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      if (!acc[monthKey]) {
        acc[monthKey] = { versions: 0, documents: new Set() }
      }
      acc[monthKey].versions++
      acc[monthKey].documents.add(version.documentId)
      return acc
    }, {} as { [key: string]: { versions: number; documents: Set<string> } })
    
    const monthlyTrends = Object.entries(monthlyData)
      .map(([month, data]) => ({
        month,
        versions: data.versions,
        documents: data.documents.size
      }))
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-6) // Last 6 months
    
    return {
      totalVersions,
      totalEdits,
      totalImports,
      totalCreations,
      activeUsers: Object.keys(userCounts),
      mostActiveUser: { user: mostActiveUser[0], count: mostActiveUser[1] },
      averageVersionsPerDocument,
      documentsWithMultipleVersions,
      recentActivity,
      versionsByDay,
      changeTypeDistribution,
      userActivityBreakdown,
      categoryVersions,
      monthlyTrends
    }
  }, [documents, documentVersions])

  const getChangeTypeIcon = (type: string) => {
    switch (type) {
      case 'created': return <FileArrowUp className="h-3 w-3" />
      case 'edited': return <Edit className="h-3 w-3" />
      case 'imported': return <GitBranch className="h-3 w-3" />
      default: return <Activity className="h-3 w-3" />
    }
  }

  const getChangeTypeColor = (type: string) => {
    switch (type) {
      case 'created': return 'bg-green-100 text-green-800'
      case 'edited': return 'bg-blue-100 text-blue-800'
      case 'imported': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Primary': return 'bg-red-100 text-red-800'
      case 'Supporting': return 'bg-blue-100 text-blue-800'
      case 'External': return 'bg-green-100 text-green-800'
      case 'No': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
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

  const formatMonth = (monthString: string) => {
    const [year, month] = monthString.split('-')
    return new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short'
    })
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Key Metrics Cards */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Versions</CardTitle>
            <GitBranch className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalVersions}</div>
            <p className="text-xs text-muted-foreground">
              Across {documents.length} documents
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Documents</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.documentsWithMultipleVersions}</div>
            <p className="text-xs text-muted-foreground">
              {Math.round((analytics.documentsWithMultipleVersions / documents.length) * 100)}% with multiple versions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.activeUsers.length}</div>
            <p className="text-xs text-muted-foreground">
              Most active: {analytics.mostActiveUser.user}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Versions</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.averageVersionsPerDocument.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">
              Per document
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="users">User Analytics</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Change Type Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Change Type Distribution
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-4">
                  {Object.entries(analytics.changeTypeDistribution).map(([type, count]) => {
                    const percentage = (count / analytics.totalVersions) * 100
                    return (
                      <div key={type} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge className={getChangeTypeColor(type)}>
                              {getChangeTypeIcon(type)}
                              <span className="ml-1 capitalize">{type}</span>
                            </Badge>
                            <span className="text-sm text-muted-foreground">{count}</span>
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

            {/* Category Version Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Versions by Category
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {Object.entries(analytics.categoryVersions).map(([category, count]) => {
                  const percentage = (count / analytics.totalVersions) * 100
                  return (
                    <div key={category} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge className={getCategoryColor(category)}>
                            {category}
                          </Badge>
                          <span className="text-sm text-muted-foreground">{count} versions</span>
                        </div>
                        <span className="text-sm font-medium">{percentage.toFixed(1)}%</span>
                      </div>
                      <Progress value={percentage} className="h-2" />
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Recent Version Activity
                <Badge variant="outline" className="ml-2">Last 7 days</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {analytics.recentActivity.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No recent activity in the last 7 days</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {analytics.recentActivity.map((version) => {
                    const document = documents.find(d => d.id === version.documentId)
                    return (
                      <div key={version.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <Badge className={getChangeTypeColor(version.changeType)}>
                            {getChangeTypeIcon(version.changeType)}
                            <span className="ml-1 capitalize">{version.changeType}</span>
                          </Badge>
                          <div className="min-w-0 flex-1">
                            <div className="font-medium text-sm truncate">
                              {document?.title || 'Unknown Document'}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              v{version.version} by {version.changedBy}
                            </div>
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatDate(version.changedAt)}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                User Activity Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(analytics.userActivityBreakdown).map(([user, activity]) => {
                  const total = activity.created + activity.edited + activity.imported
                  return (
                    <div key={user} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="font-medium">{user}</div>
                          <Badge variant="outline">{total} total</Badge>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="text-center p-2 bg-green-50 rounded">
                          <div className="text-sm font-medium text-green-800">{activity.created}</div>
                          <div className="text-xs text-green-600">Created</div>
                        </div>
                        <div className="text-center p-2 bg-blue-50 rounded">
                          <div className="text-sm font-medium text-blue-800">{activity.edited}</div>
                          <div className="text-xs text-blue-600">Edited</div>
                        </div>
                        <div className="text-center p-2 bg-purple-50 rounded">
                          <div className="text-sm font-medium text-purple-800">{activity.imported}</div>
                          <div className="text-xs text-purple-600">Imported</div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Monthly Trends
                <Badge variant="outline" className="ml-2">Last 6 months</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {analytics.monthlyTrends.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Not enough data for trend analysis</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {analytics.monthlyTrends.map((trend, index) => {
                    const maxVersions = Math.max(...analytics.monthlyTrends.map(t => t.versions))
                    const versionPercentage = maxVersions > 0 ? (trend.versions / maxVersions) * 100 : 0
                    
                    return (
                      <div key={trend.month} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="font-medium">{formatMonth(trend.month)}</div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>{trend.versions} versions</span>
                            <span>{trend.documents} documents</span>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <Progress value={versionPercentage} className="h-3" />
                          <div className="text-xs text-muted-foreground">
                            {(trend.versions / trend.documents).toFixed(1)} avg versions per document
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Daily Activity Heatmap */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Daily Activity Pattern
              </CardTitle>
            </CardHeader>
            <CardContent>
              {Object.keys(analytics.versionsByDay).length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No daily activity data available</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {Object.entries(analytics.versionsByDay)
                    .sort(([a], [b]) => b.localeCompare(a))
                    .slice(0, 14) // Last 14 days
                    .map(([date, count]) => {
                      const maxCount = Math.max(...Object.values(analytics.versionsByDay))
                      const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0
                      
                      return (
                        <div key={date} className="flex items-center gap-4">
                          <div className="text-sm text-muted-foreground w-20">
                            {new Date(date).toLocaleDateString('en-US', { 
                              month: 'short',
                              day: 'numeric' 
                            })}
                          </div>
                          <div className="flex-1">
                            <Progress value={percentage} className="h-3" />
                          </div>
                          <div className="text-sm font-medium w-8 text-right">
                            {count}
                          </div>
                        </div>
                      )
                    })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}