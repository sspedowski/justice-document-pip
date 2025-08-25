import React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, FileText, Hash, Users, Scale, Copy, Replace, SkipForward, Calendar, Clock } from '@phosphor-icons/react'
import { DuplicateResult } from '@/lib/duplicateDetection'

interface DuplicateDetectionDialogProps {
  isOpen: boolean
  onClose: () => void
  duplicateResult: DuplicateResult | null
  newFileName: string
  onAction: (action: 'skip' | 'replace' | 'keep-both') => void
}

export function DuplicateDetectionDialog({
  isOpen,
  onClose,
  duplicateResult,
  newFileName,
  onAction
}: DuplicateDetectionDialogProps) {
  if (!duplicateResult || !duplicateResult.isDuplicate) return null

  const { matchType, confidence, existingDocument, reason } = duplicateResult

  const getMatchTypeIcon = () => {
    switch (matchType) {
      case 'exact': return <Hash className="h-4 w-4" />
      case 'rename': return <FileText className="h-4 w-4" />
      case 'content': return <FileText className="h-4 w-4" />
      case 'partial': return <Copy className="h-4 w-4" />
      case 'date-based': return <Calendar className="h-4 w-4" />
      default: return <AlertTriangle className="h-4 w-4" />
    }
  }

  const getConfidenceColor = () => {
    if (confidence >= 90) return 'bg-red-100 text-red-800'
    if (confidence >= 70) return 'bg-orange-100 text-orange-800'
    return 'bg-yellow-100 text-yellow-800'
  }

  const handleAction = (action: 'skip' | 'replace' | 'keep-both') => {
    onAction(action)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-orange-700">
            <AlertTriangle className="h-5 w-5" />
            Potential Duplicate Detected
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Detection Summary */}
          <Card className="border-orange-200 bg-orange-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                {getMatchTypeIcon()}
                Duplicate Detection Results
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Match Type:</span>
                <Badge variant="outline" className="capitalize">
                  {matchType.replace('-', ' ')}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Confidence:</span>
                <Badge className={getConfidenceColor()}>
                  {confidence}%
                </Badge>
              </div>
              
              {reason && (
                <div className="bg-white rounded p-3 border">
                  <span className="text-sm font-medium text-muted-foreground">Reason:</span>
                  <p className="text-sm mt-1">{reason}</p>
                </div>
              )}

              {/* Date-based duplicate information */}
              {duplicateResult.dateMatch && (
                <div className="bg-blue-50 rounded p-3 border border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-700">Date-Based Detection</span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium">Shared Date:</span>
                      <span className="ml-2">{duplicateResult.dateMatch.sharedDate}</span>
                    </div>
                    <div>
                      <span className="font-medium">Documents on this date:</span>
                      <span className="ml-2">{duplicateResult.dateMatch.otherDocuments.length}</span>
                    </div>
                    {duplicateResult.dateMatch.requiresComparison && (
                      <div className="text-blue-700 text-xs">
                        💡 This suggests potential document versions or duplicates that need comparison
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* File Comparison */}
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-green-700">📄 New File</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div>
                  <span className="font-medium">Name:</span>
                  <p className="text-muted-foreground break-all">{newFileName}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-blue-700">📄 Existing File</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div>
                  <span className="font-medium">Name:</span>
                  <p className="text-muted-foreground break-all">
                    {existingDocument?.fileName || 'Unknown'}
                  </p>
                </div>
                
                {existingDocument?.title && existingDocument.title !== existingDocument.fileName && (
                  <div>
                    <span className="font-medium">Title:</span>
                    <p className="text-muted-foreground">{existingDocument.title}</p>
                  </div>
                )}
                
                {existingDocument?.category && (
                  <div>
                    <span className="font-medium">Category:</span>
                    <Badge variant="outline" className="ml-1">
                      {existingDocument.category}
                    </Badge>
                  </div>
                )}
                
                {existingDocument?.children && existingDocument.children.length > 0 && (
                  <div className="flex items-start gap-1">
                    <Users className="h-3 w-3 mt-1 text-muted-foreground" />
                    <div className="flex flex-wrap gap-1">
                      {existingDocument.children.map((child: string, idx: number) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {child}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                {existingDocument?.laws && existingDocument.laws.length > 0 && (
                  <div className="flex items-start gap-1">
                    <Scale className="h-3 w-3 mt-1 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      {existingDocument.laws.length} law(s) identified
                    </span>
                  </div>
                )}
                
                {existingDocument?.uploadedAt && (
                  <div>
                    <span className="font-medium">Added:</span>
                    <p className="text-muted-foreground text-xs">
                      {new Date(existingDocument.uploadedAt).toLocaleString()}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Action Buttons */}
          <div className="space-y-4">
            <div className="text-sm font-medium text-muted-foreground">
              What would you like to do?
            </div>
            
            <div className="grid grid-cols-1 gap-3">
              <Button
                variant="outline"
                className="h-auto p-4 justify-start"
                onClick={() => handleAction('skip')}
              >
                <div className="flex items-center gap-3">
                  <SkipForward className="h-5 w-5 text-blue-600" />
                  <div className="text-left">
                    <div className="font-medium">Skip Upload</div>
                    <div className="text-xs text-muted-foreground">
                      Keep the existing file, don't upload the new one
                    </div>
                  </div>
                </div>
              </Button>

              <Button
                variant="outline"
                className="h-auto p-4 justify-start"
                onClick={() => handleAction('replace')}
              >
                <div className="flex items-center gap-3">
                  <Replace className="h-5 w-5 text-orange-600" />
                  <div className="text-left">
                    <div className="font-medium">Replace Existing</div>
                    <div className="text-xs text-muted-foreground">
                      Replace the existing file with the new one
                    </div>
                  </div>
                </div>
              </Button>

              <Button
                variant="outline"
                className="h-auto p-4 justify-start"
                onClick={() => handleAction('keep-both')}
              >
                <div className="flex items-center gap-3">
                  <Copy className="h-5 w-5 text-green-600" />
                  <div className="text-left">
                    <div className="font-medium">Keep Both Files</div>
                    <div className="text-xs text-muted-foreground">
                      Upload the new file with a modified name
                    </div>
                  </div>
                </div>
              </Button>
            </div>
          </div>

          {/* Risk Warning */}
          {confidence >= 90 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5" />
                <div className="text-sm">
                  <div className="font-medium text-red-800">High Duplicate Confidence</div>
                  <div className="text-red-700 mt-1">
                    This file appears to be very similar to an existing document. 
                    Consider skipping unless you're sure this is a different version.
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}