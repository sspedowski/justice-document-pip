import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTri
import { 
  Users, 
import { 
  GitBranch, 
  Users, 
  Calend

  BarChart3,
  TrendingUp,
  FileArrowUp,
  Edit,
  Calendar,
  Activity
  misconduct: Array<{

    notes: string
  include: '
    masterFile: bo
    oversightPa
  uploadedAt: string
  currentVersion: number
  lastModifiedBy: st

  id: string
  version: numb
  description: s
  children: string[]
  misconduct: Arr
    
    notes: string
  include: 'YE
    masterFile: boolean
    oversightPacket: boole
  changedBy: string
  c
}
interface VersionAnaly
  documentVersions: Docu

  switch (type) {
 

}
const getCha
    case 'created': 
    case 'importe
  }

  return new Date(dateString).toLocaleDateString('en-US'
    day: 'numeric',
    minute: '2-d
}
export function
    const totalV
    const totalImport
    
    
    }, {} as { [key: st
    const most
    
    const averageVersionsP
    // Recent activity (last
   
      .filter(v => 
    
      created: totalCr
      imported: totalImports
 

      if (!acc[monthKey]) {
      }
      acc[monthKey].documents.add(ver
 

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

  }, [documents, documentVersions])
  if (documentVersions.length === 0
      <Card>
          <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="text-muted-foreground">
          </p>
    
  }
  return (
      {/* Summar
        <Card>
    
          </CardHeader>
      .sort(([,a], [,b]) => b - a)[0] || ['None', 0]
    
        </Card>
        <Card>
    
          </CardHeader>
            <div className="text-2x
              {analytics.totalEdits} edits made
          </CardContent>
        
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb
    
    const changeTypeDistribution = {
      created: totalCreations,
      edited: totalEdits,
      imported: totalImports
    }
    
                <Badg
            </CardHeader>
      const monthKey = new Date(version.changedAt).toISOString().slice(0, 7) // YYYY-MM format
                    const d
                      <div key={version.id} className="flex i
       
                        </Badg
                          <div className="font-medium
                
    }, {} as { [key: string]: { versions: number, documents: Set<string> } })
    
                          {formatDate(version.changed
      .sort(([a], [b]) => a.localeCompare(b))
                    )
              
                <div className="
                  <p className="text-s
         

    // Category analysis
    const categoryVersions = documentVersions.reduce((acc, version) => {
      acc[version.category] = (acc[version.category] || 0) + 1
      return acc
    }, {} as { [key: string]: number })
    
            
              <CardC
                 
                   
                     
      userCounts,
                              <span className="ml-1 capitalize">{type}</span
                          </div>
      averageVersionsPerDocument,
      recentActivity: recentActivity.slice(0, 10),
                  })}
      monthlyTrends,

      activeUsers: Object.keys(userCounts)
     
                </CardTitle>

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
   

          
                    )
      {/* Summary Cards */}
              ) : (
              
              )}
          </Card>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
  )



              {analytics.averageVersionsPerDocument.toFixed(1)} avg per document



        



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








