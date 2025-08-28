import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { EyeSlash, NotePencil, Eye, X } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { 
  saveSuppressionToLocalStorage, 
  removeSuppressionFromLocalStorage, 
  isSupressedInLocalStorage,
  saveAnnotationToLocalStorage,
  getAnnotationFromLocalStorage,
  removeAnnotationFromLocalStorage
} from '@/lib/data'
import type { AnnotationData } from '@/lib/types'

interface RealEvidenceContradiction {
  id?: string
  type: 'name_change' | 'content_alteration' | 'evidence_suppression' | 'status_change' | 'assessment_manipulation' | 'witness_removal'
  severity: 'critical' | 'high' | 'moderate'
  title: string
  description: string
  before: string
  after: string
  documents: string[]
  impact: string
  legalImplications: string[]
  evidenceLocation: string
}

interface ContradictionsTableProps {
  contradictions: RealEvidenceContradiction[]
  enableSuppress?: boolean
  enableNotes?: boolean
  suppressions?: string[]
  annotations?: AnnotationData[]
}

export default function ContradictionsTable({ 
  contradictions, 
  enableSuppress = true, 
  enableNotes = true,
  suppressions = [],
  annotations = []
}: ContradictionsTableProps) {
  const [localSuppressions, setLocalSuppressions] = useState<Set<string>>(new Set())
  const [localAnnotations, setLocalAnnotations] = useState<Map<string, AnnotationData>>(new Map())
  const [noteDialogOpen, setNoteDialogOpen] = useState<string | null>(null)
  const [noteText, setNoteText] = useState('')

  // Initialize with localStorage data and prop data
  useEffect(() => {
    const suppressedIds = new Set<string>()
    const annotationMap = new Map<string, AnnotationData>()

    // Add suppressions from props
    suppressions.forEach(id => suppressedIds.add(id))

    // Add annotations from props
    annotations.forEach(annotation => {
      annotationMap.set(annotation.contradiction_id, annotation)
    })

    // Check localStorage for each contradiction
    contradictions.forEach(contradiction => {
      const id = getContradictionId(contradiction)
      
      // Check localStorage for suppressions
      if (isSupressedInLocalStorage(id)) {
        suppressedIds.add(id)
      }

      // Check localStorage for annotations
      const localAnnotation = getAnnotationFromLocalStorage(id)
      if (localAnnotation) {
        annotationMap.set(id, localAnnotation)
      }
    })

    setLocalSuppressions(suppressedIds)
    setLocalAnnotations(annotationMap)
  }, [contradictions, suppressions, annotations])

  // Generate a unique ID for a contradiction
  const getContradictionId = (contradiction: RealEvidenceContradiction): string => {
    if (contradiction.id) {
      return contradiction.id
    }
    // Generate ID from content hash if no ID provided
    return `${contradiction.type}_${contradiction.title.replace(/\s+/g, '_').toLowerCase()}_${contradiction.severity}`
  }

  const handleSuppressToggle = (contradiction: RealEvidenceContradiction) => {
    const id = getContradictionId(contradiction)
    const newSuppressions = new Set(localSuppressions)
    
    if (localSuppressions.has(id)) {
      newSuppressions.delete(id)
      removeSuppressionFromLocalStorage(id)
      toast.success(`Contradiction "${contradiction.title}" is now visible`)
    } else {
      newSuppressions.add(id)
      saveSuppressionToLocalStorage(id)
      toast.success(`Contradiction "${contradiction.title}" has been hidden`)
    }
    
    setLocalSuppressions(newSuppressions)
  }

  const handleSaveNote = (contradiction: RealEvidenceContradiction) => {
    const id = getContradictionId(contradiction)
    
    if (noteText.trim()) {
      const annotation: AnnotationData = {
        contradiction_id: id,
        note: noteText.trim(),
        updated_at: new Date().toISOString()
      }
      
      const newAnnotations = new Map(localAnnotations)
      newAnnotations.set(id, annotation)
      setLocalAnnotations(newAnnotations)
      
      saveAnnotationToLocalStorage(id, noteText.trim())
      toast.success(`Note saved for "${contradiction.title}"`)
    } else {
      // Remove annotation if note is empty
      const newAnnotations = new Map(localAnnotations)
      newAnnotations.delete(id)
      setLocalAnnotations(newAnnotations)
      
      removeAnnotationFromLocalStorage(id)
      toast.success(`Note removed for "${contradiction.title}"`)
    }
    
    setNoteDialogOpen(null)
    setNoteText('')
  }

  const openNoteDialog = (contradiction: RealEvidenceContradiction) => {
    const id = getContradictionId(contradiction)
    setNoteDialogOpen(id)
    
    const existingAnnotation = localAnnotations.get(id)
    setNoteText(existingAnnotation?.note || '')
  }

  // Filter out suppressed contradictions
  const visibleContradictions = contradictions.filter(contradiction => {
    const id = getContradictionId(contradiction)
    return !localSuppressions.has(id)
  })

  if (visibleContradictions.length === 0 && contradictions.length > 0) {
    return (
      <Card className="border-yellow-200">
        <CardHeader>
          <CardTitle className="text-yellow-700">All Contradictions Hidden</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            All {contradictions.length} contradiction(s) have been suppressed. 
            You can view them again by managing suppressions in the CLI or clearing localStorage.
          </p>
        </CardContent>
      </Card>
    )
  }

  if (visibleContradictions.length === 0) {
    return null
  }

  return (
    <div className="space-y-4">
      {visibleContradictions.map((contradiction, index) => {
        const id = getContradictionId(contradiction)
        const annotation = localAnnotations.get(id)
        const isCurrentlyNoteOpen = noteDialogOpen === id
        
        return (
          <Card key={id || index} className="border-red-200">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <CardTitle className="text-lg text-red-700">
                      {contradiction.title}
                    </CardTitle>
                    <Badge variant={contradiction.severity === 'critical' ? 'destructive' : 'outline'}>
                      {contradiction.severity.toUpperCase()}
                    </Badge>
                    {annotation && (
                      <Badge variant="secondary" className="gap-1">
                        📝 Note
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Type: {contradiction.type.replace(/_/g, ' ')} • Location: {contradiction.evidenceLocation}
                  </p>
                </div>
                <div className="flex gap-2 ml-4">
                  {enableNotes && (
                    <Dialog open={isCurrentlyNoteOpen} onOpenChange={(open) => !open && setNoteDialogOpen(null)}>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openNoteDialog(contradiction)}
                          className={annotation ? "border-blue-300 text-blue-700" : ""}
                        >
                          <NotePencil className="h-4 w-4" />
                          📝
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Add Note: {contradiction.title}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <Textarea
                            placeholder="Add your note here..."
                            value={noteText}
                            onChange={(e) => setNoteText(e.target.value)}
                            rows={4}
                          />
                          <div className="flex gap-2 justify-end">
                            <Button 
                              variant="outline" 
                              onClick={() => setNoteDialogOpen(null)}
                            >
                              Cancel
                            </Button>
                            <Button onClick={() => handleSaveNote(contradiction)}>
                              Save Note
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                  {enableSuppress && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSuppressToggle(contradiction)}
                      className="border-orange-300 text-orange-700 hover:bg-orange-50"
                    >
                      <EyeSlash className="h-4 w-4" />
                      Hide
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm">{contradiction.description}</p>
              
              {annotation && (
                <div className="bg-blue-50 p-3 rounded-md border border-blue-200">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-blue-700">Note:</span>
                    <span className="text-xs text-blue-600">
                      {new Date(annotation.updated_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-blue-800">{annotation.note}</p>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-sm mb-1">Before:</h4>
                  <p className="text-sm bg-red-50 p-2 rounded border-l-4 border-red-200">
                    {contradiction.before}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-sm mb-1">After:</h4>
                  <p className="text-sm bg-green-50 p-2 rounded border-l-4 border-green-200">
                    {contradiction.after}
                  </p>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-sm mb-1">Impact:</h4>
                <p className="text-sm text-muted-foreground">{contradiction.impact}</p>
              </div>
              
              <div>
                <h4 className="font-medium text-sm mb-1">Legal Implications:</h4>
                <div className="flex flex-wrap gap-1">
                  {contradiction.legalImplications.map((implication, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">
                      {implication}
                    </Badge>
                  ))}
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-sm mb-1">Affected Documents:</h4>
                <div className="flex flex-wrap gap-1">
                  {contradiction.documents.map((doc, i) => (
                    <Badge key={i} variant="outline" className="text-xs">
                      {doc}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}