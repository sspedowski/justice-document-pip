import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { ArrowUp, ArrowDown, AlertTriangle, Download } from '@phosphor-icons/react'
import { toast } from 'sonner'

interface Contradiction {
  contradiction_id: string
  type: string
  score: number
  description: string
  ai_note?: string
  event?: string
  party?: string
  person?: string
  case?: string
  location?: string
  date_a?: string
  date_b?: string
  amount_a?: number
  amount_b?: number
  status_a?: string
  status_b?: string
  role_a?: string
  role_b?: string
}

interface ContradictionsTableProps {
  contradictions?: Contradiction[]
  onLoadContradictions?: () => void
}

export function ContradictionsTable({ 
  contradictions: propContradictions, 
  onLoadContradictions 
}: ContradictionsTableProps) {
  const [contradictions, setContradictions] = useState<Contradiction[]>([])
  const [sortField, setSortField] = useState<keyof Contradiction>('score')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [loading, setLoading] = useState(false)

  // Load contradictions from API/file if not provided as props
  useEffect(() => {
    if (propContradictions) {
      setContradictions(propContradictions)
    } else {
      loadContradictions()
    }
  }, [propContradictions])

  const loadContradictions = async () => {
    setLoading(true)
    try {
      // Try to load from the public data directory
      const response = await fetch('/data/contradictions_scored.json')
      if (response.ok) {
        const data = await response.json()
        setContradictions(data)
        onLoadContradictions?.()
      } else {
        toast.error('No contradictions data found. Run analysis first.')
      }
    } catch (error) {
      console.error('Error loading contradictions:', error)
      toast.error('Failed to load contradictions data')
    } finally {
      setLoading(false)
    }
  }

  const handleSort = (field: keyof Contradiction) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  const sortedContradictions = [...contradictions].sort((a, b) => {
    const aVal = a[sortField]
    const bVal = b[sortField]
    
    if (aVal === undefined && bVal === undefined) return 0
    if (aVal === undefined) return 1
    if (bVal === undefined) return -1
    
    const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0
    return sortDirection === 'asc' ? comparison : -comparison
  })

  const getSeverityColor = (score: number) => {
    if (score >= 90) return 'destructive'
    if (score >= 75) return 'destructive'
    if (score >= 60) return 'secondary'
    return 'outline'
  }

  const getTypeDisplayName = (type: string) => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  const exportCSV = () => {
    const headers = [
      'Contradiction ID', 
      'Type', 
      'Score', 
      'AI Note', 
      'Description',
      'Event',
      'Party/Person',
      'Case'
    ]
    
    const csvData = [
      headers.join(','),
      ...sortedContradictions.map(c => [
        c.contradiction_id,
        c.type,
        c.score,
        `"${c.ai_note || ''}"`,
        `"${c.description}"`,
        c.event || '',
        c.party || c.person || '',
        c.case || ''
      ].join(','))
    ].join('\n')
    
    const blob = new Blob([csvData], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `contradictions_${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    toast.success('Contradictions exported to CSV')
  }

  const SortableHeader = ({ field, children }: { field: keyof Contradiction, children: React.ReactNode }) => (
    <TableHead 
      className="cursor-pointer hover:bg-muted/50 select-none"
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center justify-between">
        <span>{children}</span>
        {sortField === field && (
          sortDirection === 'asc' ? <ArrowUp size={16} /> : <ArrowDown size={16} />
        )}
      </div>
    </TableHead>
  )

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle size={20} />
            Contradictions Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading contradictions...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle size={20} />
            Contradictions Analysis
            {contradictions.length > 0 && (
              <Badge variant="secondary">{contradictions.length} found</Badge>
            )}
          </CardTitle>
          <div className="flex gap-2">
            {contradictions.length > 0 && (
              <Button variant="outline" size="sm" onClick={exportCSV}>
                <Download size={16} className="mr-2" />
                Export CSV
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={loadContradictions}>
              <ArrowDown size={16} className="mr-2" />
              Refresh
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {contradictions.length === 0 ? (
          <div className="text-center py-8">
            <AlertTriangle size={48} className="mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No Contradictions Found</h3>
            <p className="text-muted-foreground mb-4">
              Run the analyzer to detect contradictions in your documents.
            </p>
            <Button onClick={loadContradictions}>
              Load Contradictions
            </Button>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <SortableHeader field="score">Score</SortableHeader>
                  <SortableHeader field="type">Type</SortableHeader>
                  <SortableHeader field="ai_note">AI Note</SortableHeader>
                  <TableHead>Details</TableHead>
                  <TableHead>Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedContradictions.map((contradiction) => (
                  <TableRow key={contradiction.contradiction_id}>
                    <TableCell>
                      <Badge variant={getSeverityColor(contradiction.score)}>
                        {contradiction.score}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-sm">
                        {getTypeDisplayName(contradiction.type)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-mono text-sm bg-muted p-2 rounded max-w-xs">
                        {contradiction.ai_note || (
                          <span className="text-muted-foreground italic">
                            No AI note available
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm space-y-1">
                        {contradiction.event && (
                          <div><strong>Event:</strong> {contradiction.event}</div>
                        )}
                        {(contradiction.party || contradiction.person) && (
                          <div><strong>Party:</strong> {contradiction.party || contradiction.person}</div>
                        )}
                        {contradiction.case && (
                          <div><strong>Case:</strong> {contradiction.case}</div>
                        )}
                        {(contradiction.date_a || contradiction.date_b) && (
                          <div><strong>Dates:</strong> {contradiction.date_a} → {contradiction.date_b}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-muted-foreground max-w-md">
                        {contradiction.description}
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

export default ContradictionsTable