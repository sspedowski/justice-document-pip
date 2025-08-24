import React, { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ArrowLeft, ArrowRight, GitBranch, Clock, User, FileText, AlertTriangle, CheckCircle, X } from '@phosphor-icons/react'
import { toast } from 'sonner'

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

interface ComparisonChange {
  field: string
  oldValue: any
  newValue: any
  type: 'added' | 'removed' | 'changed'
}

interface DocumentComparisonProps {
  document: Document
  documentVersions: DocumentVersion[]
  isOpen: boolean
  onClose: () => void
  onRevertToVersion: (documentId: string, versionId: string) => void
}

export function DocumentComparison({
  document,
  documentVersions,
  isOpen,
  onClose,
  onRevertToVersion
}: DocumentComparisonProps) {
  const [selectedVersions, setSelectedVersions] = useState<{
    left: string | null
    right: string | null
  }>({
    left: null,
    right: null
  })

  // Get available versions for this document, sorted by version number
  const availableVersions = useMemo(() => {
    const versions = documentVersions
      .filter(v => v.documentId === document.id)
      .sort((a, b) => b.version - a.version)

    // Add current document state as a version
    const currentVersion: DocumentVersion = {
      id: `current-${document.id}`,
      documentId: document.id,
      version: document.currentVersion,
      title: document.title,
      description: document.description,
      category: document.category,
      children: document.children,
      laws: document.laws,
      misconduct: document.misconduct,
      include: document.include,
      placement: document.placement,
      changedBy: document.lastModifiedBy || 'Unknown',
      changedAt: document.lastModified || new Date().toISOString(),
      changeType: 'edited'
    }

    return [currentVersion, ...versions]
  }, [document, documentVersions])

  // Auto-select latest versions when opening
  useMemo(() => {
    if (isOpen && availableVersions.length >= 2) {
      setSelectedVersions({
        left: availableVersions[1]?.id || null,
        right: availableVersions[0]?.id || null
      })
    }
  }, [isOpen, availableVersions])

  const leftVersion = useMemo(() => 
    availableVersions.find(v => v.id === selectedVersions.left),
    [availableVersions, selectedVersions.left]
  )

  const rightVersion = useMemo(() => 
    availableVersions.find(v => v.id === selectedVersions.right),
    [availableVersions, selectedVersions.right]
  )

  // Calculate differences between versions
  const changes = useMemo((): ComparisonChange[] => {
    if (!leftVersion || !rightVersion) return []

    const changes: ComparisonChange[] = []

    // Compare basic fields
    const fieldsToCompare = [
      { key: 'title', label: 'Title' },
      { key: 'category', label: 'Category' },
      { key: 'include', label: 'Include Status' },
      { key: 'description', label: 'Description' }
    ]

    fieldsToCompare.forEach(field => {
      if (leftVersion[field.key as keyof DocumentVersion] !== rightVersion[field.key as keyof DocumentVersion]) {
        changes.push({
          field: field.label,
          oldValue: leftVersion[field.key as keyof DocumentVersion],
          newValue: rightVersion[field.key as keyof DocumentVersion],
          type: 'changed'
        })
      }
    })

    // Compare arrays (children, laws)
    const arrayFields = [
      { key: 'children', label: 'Children' },
      { key: 'laws', label: 'Laws' }
    ]

    arrayFields.forEach(field => {
      const oldArray = (leftVersion[field.key as keyof DocumentVersion] as string[]) || []
      const newArray = (rightVersion[field.key as keyof DocumentVersion] as string[]) || []
      
      const added = newArray.filter(item => !oldArray.includes(item))
      const removed = oldArray.filter(item => !newArray.includes(item))
      
      added.forEach(item => {
        changes.push({
          field: field.label,
          oldValue: null,
          newValue: item,
          type: 'added'
        })
      })
      
      removed.forEach(item => {
        changes.push({
          field: field.label,
          oldValue: item,
          newValue: null,
          type: 'removed'
        })
      })
    })

    // Compare placement settings
    const placementFields = [
      { key: 'masterFile', label: 'Master File' },
      { key: 'exhibitBundle', label: 'Exhibit Bundle' },
      { key: 'oversightPacket', label: 'Oversight Packet' }
    ]

    placementFields.forEach(field => {
      const oldValue = leftVersion.placement[field.key as keyof typeof leftVersion.placement]
      const newValue = rightVersion.placement[field.key as keyof typeof rightVersion.placement]
      
      if (oldValue !== newValue) {
        changes.push({
          field: `Placement: ${field.label}`,
          oldValue: oldValue ? 'Yes' : 'No',
          newValue: newValue ? 'Yes' : 'No',
          type: 'changed'
        })
      }
    })

    return changes
  }, [leftVersion, rightVersion])

  const swapVersions = () => {
    setSelectedVersions(prev => ({
      left: prev.right,
      right: prev.left
    }))
  }

  const formatVersionLabel = (version: DocumentVersion) => {
    const isCurrentState = version.id.startsWith('current-')
    return `v${version.version}${isCurrentState ? ' (Current)' : ''} - ${new Date(version.changedAt).toLocaleDateString()}`
  }

  const VersionCard = ({ version, title, side }: { version: DocumentVersion | undefined, title: string, side: 'left' | 'right' }) => {
    if (!version) {
      return (
        <Card className="flex-1">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              {title}
              <Badge variant="outline">No Version Selected</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Select a version to compare</p>
          </CardContent>
        </Card>
      )
    }

    const isCurrentState = version.id.startsWith('current-')

    return (
      <Card className={`flex-1 ${side === 'right' ? 'border-green-200 bg-green-50/30' : 'border-blue-200 bg-blue-50/30'}`}>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
              {title}
              <Badge variant={isCurrentState ? 'default' : 'outline'}>
                v{version.version}
                {isCurrentState && ' (Current)'}
              </Badge>
            </div>
            {!isCurrentState && onRevertToVersion && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  if (window.confirm(`Revert to version ${version.version}? This will create a new version with the old data.`)) {
                    onRevertToVersion(document.id, version.id)
                    toast.success(`Reverted to version ${version.version}`)
                    onClose()
                  }
                }}
              >
                Revert
              </Button>
            )}
          </CardTitle>
          <div className="text-xs text-muted-foreground flex items-center gap-2">
            <User className="h-3 w-3" />
            {version.changedBy} • {new Date(version.changedAt).toLocaleString()}
          </div>
          {version.changeNotes && (
            <div className="text-xs bg-muted/50 rounded px-2 py-1">
              <strong>Notes:</strong> {version.changeNotes}
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-3 text-sm">
            <div>
              <span className="font-medium text-muted-foreground">Title:</span>
              <div className="mt-1">{version.title}</div>
            </div>
            
            <div>
              <span className="font-medium text-muted-foreground">Category:</span>
              <div className="mt-1">
                <Badge className={
                  version.category === 'Primary' ? 'bg-red-100 text-red-800' :
                  version.category === 'Supporting' ? 'bg-blue-100 text-blue-800' :
                  version.category === 'External' ? 'bg-green-100 text-green-800' :
                  'bg-gray-100 text-gray-800'
                }>
                  {version.category}
                </Badge>
              </div>
            </div>
            
            <div>
              <span className="font-medium text-muted-foreground">Include:</span>
              <div className="mt-1">
                <Badge variant={version.include === 'YES' ? 'default' : 'secondary'}>
                  {version.include}
                </Badge>
              </div>
            </div>
            
            <div>
              <span className="font-medium text-muted-foreground">Children:</span>
              <div className="mt-1 flex gap-1 flex-wrap">
                {version.children.length > 0 ? (
                  version.children.map((child, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs">{child}</Badge>
                  ))
                ) : (
                  <span className="text-muted-foreground text-xs">None</span>
                )}
              </div>
            </div>
            
            <div>
              <span className="font-medium text-muted-foreground">Laws:</span>
              <div className="mt-1 flex gap-1 flex-wrap">
                {version.laws.length > 0 ? (
                  version.laws.map((law, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs">{law}</Badge>
                  ))
                ) : (
                  <span className="text-muted-foreground text-xs">None</span>
                )}
              </div>
            </div>
            
            <div>
              <span className="font-medium text-muted-foreground">Placement:</span>
              <div className="mt-1 grid grid-cols-1 gap-1 text-xs">
                <div className="flex items-center justify-between">
                  <span>Master File:</span>
                  <span>{version.placement.masterFile ? '✓' : '✗'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Exhibit Bundle:</span>
                  <span>{version.placement.exhibitBundle ? '✓' : '✗'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Oversight Packet:</span>
                  <span>{version.placement.oversightPacket ? '✓' : '✗'}</span>
                </div>
              </div>
            </div>
            
            <div>
              <span className="font-medium text-muted-foreground">Description:</span>
              <div className="mt-1 text-xs text-muted-foreground max-h-20 overflow-y-auto">
                {version.description}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const ChangeTypeIcon = ({ type }: { type: ComparisonChange['type'] }) => {
    switch (type) {
      case 'added':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'removed':
        return <X className="h-4 w-4 text-red-600" />
      case 'changed':
        return <AlertTriangle className="h-4 w-4 text-orange-600" />
      default:
        return <AlertTriangle className="h-4 w-4 text-muted-foreground" />
    }
  }

  if (availableVersions.length < 2) {
    return (
      <Dialog open={isOpen} onOpenChange={() => onClose()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GitBranch className="h-5 w-5" />
              Document Comparison
            </DialogTitle>
          </DialogHeader>
          <div className="text-center py-8">
            <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="font-semibold mb-2">Not Enough Versions</h3>
            <p className="text-sm text-muted-foreground">
              This document needs at least 2 versions to enable comparison. 
              Make some edits to create version history.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-7xl max-h-[95vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitBranch className="h-5 w-5" />
            Compare Versions: {document.title}
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden">
          <Tabs defaultValue="side-by-side" className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="side-by-side">Side-by-Side View</TabsTrigger>
              <TabsTrigger value="changes">Changes Summary</TabsTrigger>
            </TabsList>
            
            <TabsContent value="side-by-side" className="flex-1 overflow-hidden space-y-4">
              {/* Version Selection Controls */}
              <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg">
                <div className="flex-1">
                  <label className="text-sm font-medium">Compare From:</label>
                  <Select 
                    value={selectedVersions.left || ''} 
                    onValueChange={(value) => setSelectedVersions(prev => ({ ...prev, left: value }))}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select version" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableVersions.map((version) => (
                        <SelectItem key={version.id} value={version.id}>
                          {formatVersionLabel(version)} ({version.changeType})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={swapVersions}
                  disabled={!selectedVersions.left || !selectedVersions.right}
                  className="mt-6"
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  <ArrowRight className="h-4 w-4" />
                </Button>
                
                <div className="flex-1">
                  <label className="text-sm font-medium">Compare To:</label>
                  <Select 
                    value={selectedVersions.right || ''} 
                    onValueChange={(value) => setSelectedVersions(prev => ({ ...prev, right: value }))}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select version" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableVersions.map((version) => (
                        <SelectItem key={version.id} value={version.id}>
                          {formatVersionLabel(version)} ({version.changeType})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {/* Side-by-side Version Comparison */}
              <div className="flex gap-4 flex-1 overflow-hidden">
                <div className="flex-1 overflow-y-auto">
                  <VersionCard version={leftVersion} title="From Version" side="left" />
                </div>
                <div className="flex-1 overflow-y-auto">
                  <VersionCard version={rightVersion} title="To Version" side="right" />
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="changes" className="flex-1 overflow-y-auto space-y-4">
              <div className="p-4 bg-muted/30 rounded-lg">
                <h3 className="font-semibold mb-2">Changes Summary</h3>
                {leftVersion && rightVersion ? (
                  <p className="text-sm text-muted-foreground">
                    Comparing {formatVersionLabel(leftVersion)} → {formatVersionLabel(rightVersion)}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Select two versions to see changes
                  </p>
                )}
              </div>
              
              {changes.length > 0 ? (
                <div className="space-y-3">
                  {changes.map((change, index) => (
                    <Card key={index} className="border-l-4 border-l-transparent data-[type=added]:border-l-green-500 data-[type=removed]:border-l-red-500 data-[type=changed]:border-l-orange-500" data-type={change.type}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <ChangeTypeIcon type={change.type} />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-medium text-sm">{change.field}</span>
                              <Badge 
                                variant="outline" 
                                className={
                                  change.type === 'added' ? 'border-green-200 text-green-700 bg-green-50' :
                                  change.type === 'removed' ? 'border-red-200 text-red-700 bg-red-50' :
                                  'border-orange-200 text-orange-700 bg-orange-50'
                                }
                              >
                                {change.type}
                              </Badge>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                              <div className="space-y-1">
                                <span className="text-xs text-muted-foreground font-medium">
                                  {change.type === 'removed' ? 'Removed' : 'Before'}:
                                </span>
                                <div className="bg-red-50 border border-red-200 rounded p-2 text-red-800">
                                  {change.oldValue ? String(change.oldValue) : '(none)'}
                                </div>
                              </div>
                              <div className="space-y-1">
                                <span className="text-xs text-muted-foreground font-medium">
                                  {change.type === 'added' ? 'Added' : 'After'}:
                                </span>
                                <div className="bg-green-50 border border-green-200 rounded p-2 text-green-800">
                                  {change.newValue ? String(change.newValue) : '(none)'}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <h3 className="font-semibold mb-2">No Changes Found</h3>
                  <p className="text-sm">
                    The selected versions appear to be identical.
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  )
}