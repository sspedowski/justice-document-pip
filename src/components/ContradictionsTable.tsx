import React, { useState, useEffect } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Progress } from '@/components/ui/progress'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Download, Eye, AlertTriangle, Scale } from '@phosphor-icons/react'
import { toast } from 'sonner'

interface Contradiction {
  contradiction_id: string
  type: string
  severity: string
  title: string
  description: string
  before?: string
  after?: string
  documents: string[]
  impact?: string
  legalImplications?: string[]
  evidenceLocation?: string
  score: number
  confidence: number
}

interface ContradictionsTableProps {
  contradictions?: Contradiction[]
}

export default function ContradictionsTable({ contradictions = [] }: ContradictionsTableProps) {
  const [data, setData] = useState<Contradiction[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (contradictions.length > 0) {
      setData(contradictions)
    } else {
      // Use fallback sample data for demonstration
      const sampleData = [
        {
          contradiction_id: "sample_001",
          type: "name_change",
          severity: "critical",
          title: "Child Victim Identity Alteration",
          description: "Child's name systematically changed between CPS report versions from Nicholas Williams to Owen Williams",
          before: "Nicholas Williams (age 6)",
          after: "Owen Williams (age 6)",
          documents: ["Initial_CPS_Report.pdf", "Amended_CPS_Report.pdf"],
          impact: "Child victim identity tampering",
          score: 95,
          confidence: 1.0
        },
        {
          contradiction_id: "sample_002",
          type: "witness_removal",
          severity: "critical",
          title: "Key Witness Statement Suppression",
          description: "Critical witness statement completely removed from amended report",
          before: "Neighbor: Noel Johnson (provided statement)",
          after: "Witness statement section deleted",
          documents: ["Initial_CPS_Report.pdf", "Amended_CPS_Report.pdf"],
          impact: "Critical witness testimony suppression",
          score: 92,
          confidence: 1.0
        },
        {
          contradiction_id: "sample_003",
          type: "content_alteration",
          severity: "moderate",
          title: "Minor Text Change",
          description: "Small text modification",
          before: "Original text",
          after: "Modified text", 
          documents: ["doc1.pdf"],
          score: 85,
          confidence: 0.67
        }
      ]
      setData(sampleData)
    }
  }, []) // Only run once on mount

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'moderate':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'name_change':
        return <AlertTriangle className="h-4 w-4" />
      case 'witness_removal':
        return <Eye className="h-4 w-4" />
      case 'status_change':
        return <Scale className="h-4 w-4" />
      default:
        return <AlertTriangle className="h-4 w-4" />
    }
  }

  const exportContradictions = () => {
    const csv = [
      ['ID', 'Type', 'Severity', 'Title', 'Score', 'Confidence', 'Description', 'Documents'].join(','),
      ...data.map(c => [
        c.contradiction_id,
        c.type,
        c.severity,
        `"${c.title}"`,
        c.score,
        c.confidence.toFixed(3),
        `"${c.description}"`,
        `"${c.documents.join('; ')}"`
      ].join(','))
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `contradictions-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Contradictions exported to CSV')
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading contradictions data...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Contradictions Analysis ({data.length})
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Detected contradictions with confidence scores and impact assessment
            </p>
          </div>
          <Button onClick={exportContradictions} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No contradictions detected in current analysis</p>
            <p className="text-sm">Upload documents and run analysis to see results</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">Type</TableHead>
                  <TableHead className="w-[100px]">Severity</TableHead>
                  <TableHead className="min-w-[200px]">Title</TableHead>
                  <TableHead className="w-[80px]">Score</TableHead>
                  <TableHead className="w-[120px]">Confidence</TableHead>
                  <TableHead className="min-w-[300px]">Description</TableHead>
                  <TableHead className="min-w-[150px]">Documents</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((contradiction) => (
                  <TableRow key={contradiction.contradiction_id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getTypeIcon(contradiction.type)}
                        <span className="text-xs font-mono">
                          {contradiction.type.replace('_', ' ')}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline" 
                        className={getSeverityColor(contradiction.severity)}
                      >
                        {contradiction.severity}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{contradiction.title}</div>
                      {contradiction.impact && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {contradiction.impact}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="font-mono text-sm font-medium">
                        {contradiction.score}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-2">
                        <Progress 
                          value={contradiction.confidence * 100} 
                          className="h-2 w-full"
                        />
                        <div className="text-xs text-center font-mono">
                          {(contradiction.confidence * 100).toFixed(1)}%
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm max-w-md">
                        {contradiction.description}
                        {contradiction.before && contradiction.after && (
                          <div className="mt-2 text-xs">
                            <div className="text-muted-foreground">Before:</div>
                            <div className="text-red-600 mb-1">{contradiction.before}</div>
                            <div className="text-muted-foreground">After:</div>
                            <div className="text-green-600">{contradiction.after}</div>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-xs space-y-1">
                        {contradiction.documents.map((doc, index) => (
                          <div key={index} className="font-mono text-blue-600">
                            {doc}
                          </div>
                        ))}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}