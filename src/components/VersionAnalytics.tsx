import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Badge } from '@/components/ui/badge'
  Users, 
import { 
  BarChar
  GitBranch, 
  Edit,
  BarChart3,
  title: stri
  category: 'P
  laws:
    law: st
    par
  }>

    exhibitBundle: b
  }
  textContent?: st
  lastModified:
}
interface DocumentVersion {
  documentId: string
  title: string
  category: 'Primary'
  laws: string[
    law: string
    paragraph: string
  }>
  pl
    exhibitBundle: bool
  }
  changedAt: string
  changeType: 'created' | 

  d
  uploadedAt: string
const getChangeTypeCol
  currentVersion: number
    case 'imported': r
  }


    case 'edited': return <
  id: string
}
const formatDate 
    month: 'sho
    hour: '2-digit',
  })
  children: string[]
  const analytic
    const totalCreati
    const total
    // User acti
      acc[version.cha
    notes: string
    
    
    
    masterFile: boolean
    const recentActivity =
      .sort((a, b) => new Da
   
  changedBy: string
    }
    // Monthly trends
      const monthKey = new Date(version.changed
}

      return acc
    
      .map(([month, data]) => ({
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
    case 'edited': return <Edit className="h-3 w-3" />
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

        <Card>
            <CardTitle className="t
          </CardHeader>
            <div className="text-2xl font-bold">{analytics.totalEdits}</div>
              {analytics.totalEdits} edits made
          </CardContent>
    
          <CardHeader classNa
            <Users className="h-4 w-4 text-muted-foreground" />
          <CardContent>
            <p c
            </p>
    
        <Card>
      .sort(([,a], [,b]) => b - a)[0] || ['None', 0]
    
            <div className="text-2xl font-bold">{analytics.recentActivity.length}</div>
    
          </CardContent>
      </div>
      <Tabs defaultValue="activity" className="space
          <TabsTrigger value="activity">Rec
          <TabsTrigger value="trends">Monthly Trends</Tab

    
    const changeTypeDistribution = {
      created: totalCreations,
      edited: totalEdits,
      imported: totalImports
    }
    
                     
                          {getChangeTypeIcon(version.changeType)}
      const monthKey = new Date(version.changedAt).toISOString().slice(0, 7) // YYYY-MM format
                          <
                          </div>
       
                        </div>
                          {formatDate(version.changed
                
    }, {} as { [key: string]: { versions: number, documents: Set<string> } })
    
                  <Activity className="h-8 w-8 mx-auto mb-2 
                </div>
            </
        </TabsContent>
        <TabsContent value="distributi
         
      .sort(([a], [b]) => a.localeCompare(b))
    
    // Category analysis
    const categoryVersions = documentVersions.reduce((acc, version) => {
      acc[version.category] = (acc[version.category] || 0) + 1
      return acc
    }, {} as { [key: string]: number })
    
            
                    
                     
                 
                  }
      userCounts,

      averageVersionsPerDocument,
      recentActivity: recentActivity.slice(0, 10),
                </CardTitle>
              <CardContent>
                  {Obje
      activeUsers: Object.keys(userCounts)
     
                          <div clas

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
   

          
                    
      {/* Summary Cards */}
                          <div className="flex items-center g
              
                                month: 'short' 
                            </span>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                       
                       
                        </div>
                      </div>
              {analytics.averageVersionsPerDocument.toFixed(1)} avg per document
              ) 
                  <Calen
               

        </Tabs
    </div>
}
            <BarChart3 className="h-4 w-4 text-muted-foreground" />




              {analytics.totalEdits} edits made






            <CardTitle className="text-sm font-medium">Most Active User</CardTitle>



            <div className="text-2xl font-bold">{analytics.mostActiveUser.count}</div>

              changes by {analytics.mostActiveUser.user}






            <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />


            <div className="text-2xl font-bold">{analytics.recentActivity.length}</div>

              changes in last 7 days





      <Tabs defaultValue="activity" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="activity">Recent Activity</TabsTrigger>
          <TabsTrigger value="distribution">Change Types</TabsTrigger>



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







              <CardContent>


                    const percentage = analytics.totalVersions > 0 ? (count / analytics.totalVersions) * 100 : 0























                  <Users className="h-5 w-5" />
                  User Activity


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

                      )
                    })}
                </div>














              {analytics.monthlyTrends.length > 0 ? (

                  {analytics.monthlyTrends.map((trend) => {






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

                          <span className="text-sm font-medium">
                            {(trend.versions / trend.documents).toFixed(1)} avg per doc
                          </span>

                        <Progress value={versionPercentage} className="h-3" />





                <div className="text-center py-6 text-muted-foreground">
                  <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No trend data available yet</p>








