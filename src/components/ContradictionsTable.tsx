import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Warning, Clock, User } from '@phosphor-icons/react'

interface Contradiction {
  contradiction_id: string
  type: string
  description: string
  date_a?: string
  date_b?: string
  rule_name?: string
  statement_a?: any
  statement_b?: any
}

interface ContradictionsTableProps {
  className?: string
}

const ContradictionsTable: React.FC<ContradictionsTableProps> = ({ className }) => {
  const [contradictions, setContradictions] = useState<Contradiction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadContradictions = async () => {
      try {
        setLoading(true)
        const response = await fetch('/data/contradictions.json')
        if (!response.ok) {
          throw new Error(`Failed to load contradictions: ${response.statusText}`)
        }
        const data = await response.json()
        setContradictions(data)
        setError(null)
      } catch (err) {
        console.error('Error loading contradictions:', err)
        setError(err instanceof Error ? err.message : 'Failed to load contradictions')
      } finally {
        setLoading(false)
      }
    }

    loadContradictions()
  }, [])

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'event_date_disagreement':
        return 'bg-red-100 text-red-800'
      case 'status_change_inconsistency':
        return 'bg-orange-100 text-orange-800'
      case 'numeric_amount_mismatch':
        return 'bg-yellow-100 text-yellow-800'
      case 'location_contradiction':
        return 'bg-purple-100 text-purple-800'
      case 'role_responsibility_conflict':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A'
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

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Warning className="h-5 w-5" />
            Detected Contradictions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
              <p className="text-sm text-gray-600">Loading contradictions...</p>
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
            <Warning className="h-5 w-5" />
            Detected Contradictions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="text-center">
              <p className="text-sm text-red-600 mb-2">Error loading contradictions</p>
              <p className="text-xs text-gray-500">{error}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Warning className="h-5 w-5" />
          Detected Contradictions
          <Badge variant="secondary" className="ml-2">
            {contradictions.length} found
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {contradictions.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600">No contradictions detected</p>
            <p className="text-sm text-gray-500 mt-1">
              Run the analysis to find potential inconsistencies
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Dates</TableHead>
                  <TableHead>People Involved</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contradictions.map((contradiction) => (
                  <TableRow key={contradiction.contradiction_id}>
                    <TableCell className="font-mono text-xs">
                      {contradiction.contradiction_id}
                    </TableCell>
                    <TableCell>
                      <Badge className={getTypeColor(contradiction.type)}>
                        {contradiction.rule_name || contradiction.type.replace(/_/g, ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-md">
                      <p className="text-sm">{contradiction.description}</p>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Clock className="h-3 w-3" />
                        {contradiction.date_a && (
                          <span>{formatDate(contradiction.date_a)}</span>
                        )}
                        {contradiction.date_a && contradiction.date_b && 
                         contradiction.date_a !== contradiction.date_b && (
                          <>
                            <span className="text-gray-400">vs</span>
                            <span>{formatDate(contradiction.date_b)}</span>
                          </>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        {contradiction.statement_a?.person && (
                          <div className="flex items-center gap-1 text-xs">
                            <User className="h-3 w-3" />
                            <span>{contradiction.statement_a.person}</span>
                          </div>
                        )}
                        {contradiction.statement_b?.person && 
                         contradiction.statement_b.person !== contradiction.statement_a?.person && (
                          <div className="flex items-center gap-1 text-xs">
                            <User className="h-3 w-3" />
                            <span>{contradiction.statement_b.person}</span>
                          </div>
                        )}
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