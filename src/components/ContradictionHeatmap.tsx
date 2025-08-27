import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, TrendingUp } from '@phosphor-icons/react'

interface HeatmapDataPoint {
  rule: string
  party: string
  count: number
}

interface ContradictionHeatmapProps {
  className?: string
}

export default function ContradictionHeatmap({ className }: ContradictionHeatmapProps) {
  const [heatmapData, setHeatmapData] = useState<HeatmapDataPoint[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadHeatmapData()
  }, [])

  const loadHeatmapData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/data/heatmap.json')
      if (!response.ok) {
        throw new Error('Failed to load heatmap data')
      }
      const data = await response.json()
      setHeatmapData(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  // Get unique rules and parties for the grid
  const uniqueRules = [...new Set(heatmapData.map(d => d.rule))].sort()
  const uniqueParties = [...new Set(heatmapData.map(d => d.party))].sort()
  
  // Create a lookup map for quick access
  const dataMap = new Map<string, number>()
  heatmapData.forEach(item => {
    dataMap.set(`${item.rule}-${item.party}`, item.count)
  })

  // Calculate max count for color intensity
  const maxCount = Math.max(...heatmapData.map(d => d.count), 1)

  // Get color intensity based on count
  const getColorIntensity = (count: number) => {
    if (count === 0) return 'bg-gray-100'
    const intensity = count / maxCount
    if (intensity <= 0.2) return 'bg-red-100'
    if (intensity <= 0.4) return 'bg-red-200'
    if (intensity <= 0.6) return 'bg-red-300'
    if (intensity <= 0.8) return 'bg-red-400'
    return 'bg-red-500'
  }

  // Get text color based on intensity
  const getTextColor = (count: number) => {
    const intensity = count / maxCount
    return intensity > 0.6 ? 'text-white' : 'text-gray-900'
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Contradiction Heatmap
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <div className="text-muted-foreground">Loading heatmap data...</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Contradiction Heatmap
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  if (heatmapData.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Contradiction Heatmap
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground">
            No contradiction data available
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Contradiction Heatmap
        </CardTitle>
        <div className="text-sm text-muted-foreground">
          Shows where contradictions cluster across rules and parties. 
          Darker cells indicate more contradictions.
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Legend */}
          <div className="flex items-center gap-4 text-sm">
            <span className="font-medium">Intensity:</span>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-100 border rounded"></div>
              <span>None</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-100 border rounded"></div>
              <span>Low</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-300 border rounded"></div>
              <span>Medium</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-500 border rounded"></div>
              <span>High</span>
            </div>
          </div>

          {/* Heatmap Grid */}
          <div className="overflow-x-auto">
            <div className="min-w-[600px]">
              {/* Header row with rule names */}
              <div className="grid grid-cols-[200px_1fr] gap-1 mb-1">
                <div className="p-2 font-medium text-sm bg-gray-50 rounded">
                  Party / Rule
                </div>
                <div className="flex gap-1 overflow-x-auto">
                  {uniqueRules.map(rule => (
                    <div 
                      key={rule} 
                      className="p-2 text-xs font-medium bg-gray-50 rounded text-center min-w-[120px] flex-shrink-0"
                      title={rule}
                    >
                      {rule.replace(/_/g, ' ').split(' ').map(word => 
                        word.charAt(0).toUpperCase() + word.slice(1)
                      ).join(' ')}
                    </div>
                  ))}
                </div>
              </div>

              {/* Data rows */}
              {uniqueParties.map(party => (
                <div key={party} className="grid grid-cols-[200px_1fr] gap-1 mb-1">
                  <div className="p-2 text-sm font-medium bg-gray-50 rounded">
                    {party}
                  </div>
                  <div className="flex gap-1 overflow-x-auto">
                    {uniqueRules.map(rule => {
                      const count = dataMap.get(`${rule}-${party}`) || 0
                      return (
                        <div
                          key={`${rule}-${party}`}
                          className={`p-2 text-xs text-center rounded border transition-colors hover:scale-105 cursor-pointer min-w-[120px] flex-shrink-0 ${getColorIntensity(count)} ${getTextColor(count)}`}
                          title={`${rule} + ${party}: ${count} contradictions`}
                        >
                          {count > 0 ? count : ''}
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-500">
                {heatmapData.reduce((sum, item) => sum + item.count, 0)}
              </div>
              <div className="text-sm text-muted-foreground">Total Contradictions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-500">
                {uniqueRules.length}
              </div>
              <div className="text-sm text-muted-foreground">Rule Types</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-500">
                {uniqueParties.length}
              </div>
              <div className="text-sm text-muted-foreground">Parties Involved</div>
            </div>
          </div>

          {/* Top Issues */}
          <div className="pt-4 border-t">
            <h4 className="font-medium mb-2">Top Issues</h4>
            <div className="space-y-2">
              {heatmapData.slice(0, 3).map((item, index) => (
                <div key={`${item.rule}-${item.party}`} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      #{index + 1}
                    </Badge>
                    <span className="text-sm font-medium">{item.party}</span>
                    <span className="text-xs text-muted-foreground">in</span>
                    <span className="text-xs">{item.rule.replace(/_/g, ' ')}</span>
                  </div>
                  <Badge variant="destructive">
                    {item.count} contradiction{item.count !== 1 ? 's' : ''}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}