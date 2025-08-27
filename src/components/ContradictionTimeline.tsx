import React, { useState, useEffect } from 'react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ChartLine, BarChart3 } from '@phosphor-icons/react'

interface ContradictionTimelineItem {
  date: string
  ids: string[]
  count: number
  rule_names: string[]
  contradictions: any[]
}

interface ContradictionTimelineProps {
  className?: string
}

const ContradictionTimeline: React.FC<ContradictionTimelineProps> = ({ className }) => {
  const [timelineData, setTimelineData] = useState<ContradictionTimelineItem[]>([])
  const [chartType, setChartType] = useState<'line' | 'bar'>('bar')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadTimelineData = async () => {
      try {
        setLoading(true)
        const response = await fetch('/data/contradictions_timeline.json')
        if (!response.ok) {
          throw new Error(`Failed to load timeline data: ${response.statusText}`)
        }
        const data = await response.json()
        setTimelineData(data)
        setError(null)
      } catch (err) {
        console.error('Error loading timeline data:', err)
        setError(err instanceof Error ? err.message : 'Failed to load timeline data')
      } finally {
        setLoading(false)
      }
    }

    loadTimelineData()
  }, [])

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr)
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
      })
    } catch {
      return dateStr
    }
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length > 0) {
      const data = payload[0].payload as ContradictionTimelineItem
      
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg max-w-sm">
          <p className="font-semibold text-gray-900 mb-2">
            {formatDate(label)}
          </p>
          <p className="text-sm text-gray-700 mb-2">
            <strong>{data.count}</strong> contradiction{data.count !== 1 ? 's' : ''}
          </p>
          
          <div className="mb-2">
            <p className="text-xs font-medium text-gray-600 mb-1">Rule Types:</p>
            <div className="flex flex-wrap gap-1">
              {data.rule_names.map((rule, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {rule}
                </Badge>
              ))}
            </div>
          </div>
          
          <div>
            <p className="text-xs font-medium text-gray-600 mb-1">Contradiction IDs:</p>
            <div className="text-xs text-gray-700">
              {data.ids.join(', ')}
            </div>
          </div>
        </div>
      )
    }
    return null
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ChartLine className="h-5 w-5" />
            Contradiction Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
              <p className="text-sm text-gray-600">Loading timeline data...</p>
            </div>
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
            <ChartLine className="h-5 w-5" />
            Contradiction Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <p className="text-sm text-red-600 mb-2">Error loading timeline data</p>
              <p className="text-xs text-gray-500">{error}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (timelineData.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ChartLine className="h-5 w-5" />
            Contradiction Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <p className="text-sm text-gray-600">No contradiction data available</p>
              <p className="text-xs text-gray-500 mt-1">
                Run the analysis script to generate timeline data
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const totalContradictions = timelineData.reduce((sum, item) => sum + item.count, 0)
  const peakDate = timelineData.reduce((peak, item) => 
    item.count > peak.count ? item : peak
  )

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <ChartLine className="h-5 w-5" />
            Contradiction Timeline
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant={chartType === 'bar' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setChartType('bar')}
            >
              <BarChart3 className="h-4 w-4 mr-1" />
              Bar
            </Button>
            <Button
              variant={chartType === 'line' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setChartType('line')}
            >
              <ChartLine className="h-4 w-4 mr-1" />
              Line
            </Button>
          </div>
        </div>
        <div className="flex gap-4 text-sm text-gray-600">
          <span>Total: <strong>{totalContradictions}</strong> contradictions</span>
          <span>Peak: <strong>{peakDate.count}</strong> on {formatDate(peakDate.date)}</span>
          <span>Dates: <strong>{timelineData.length}</strong></span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'line' ? (
              <LineChart data={timelineData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={formatDate}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2 }}
                />
              </LineChart>
            ) : (
              <BarChart data={timelineData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={formatDate}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Bar 
                  dataKey="count" 
                  fill="#3b82f6"
                  radius={[2, 2, 0, 0]}
                />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

export default ContradictionTimeline