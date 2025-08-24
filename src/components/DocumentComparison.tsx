import React, { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ArrowLeft, ArrowRight, GitBranch, Clock, User, FileText, AlertTriangle, CheckCircle, X } from '@phosphor-icons/react'
  category: 'Primary' | 'Suppo

    law: string
    paragrap
  }>
  placement: {
    exhibitBund
  }
  changedAt: string
  changeType: 'creat

  id: string
  title: string
  category: 'Pri
  laws: string[]
    law: string
    
  }>
  placement: {
    exhibitBundle: bool
  }
  textContent?: string
  l
}
interface Compariso
  oldValue: any
  type: 'added' | 'removed' | 'changed'


  isOpen: boolean
  onRevertTo

  document,
  isOpen,
  onRevertToVersion
  const [selectedVer
    right: strin
    left: null,
  })
  // Get availab
    const versions = 
      .sort((a, b
    
      id: `current-${do
      version:
      description: docu
      children: document.c
      misconduct: document.m
   
      changedAt: doc
    }
    return [currentVersi

  useMemo(() => {
 

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

      return (
          <CardHeader>

            </CardTitle>
          <CardCo
            <p>Select a version to compare</p>
        </Card>
    }
    const isCurrentState = version.id.startsWit
    retu
     
            <div className="flex 

                {isCurrentState && '
            </div>
              <Button
   

                    toast.success(`Re
                  }
              >
   

            <User className="h-3 w-3" />
          </div>
            <div className="text-xs bg-muted/50 

        </CardHeader>

              <span classNa
            </div>
            <div>
              <div className="mt-1">
                  version.category === 'Primary' ?
                  version.category === 'External' 
     

            </div>
            <div>
              <div cla
                  {version.in
              </div>
            
              <span class
          
       
      

            </div>
            <div>
              <div className="mt-1 flex gap-1
                  version.laws.map((
     

              </div>
            
              <span className="font-medium text-muted-foreground">Placement:</span>
      
                  <span>{version.placement.masterFile ? '✓' : '✗'}</s
                <div className="flex items-center justify-between">
      
                <div classNam
                  <spa
              </div>
            
              <span class
                {versio
          
        
    )

    switch (type) {
        return <CheckCircle c
        return <X classNa
        return <AlertTria
        return <AlertTria
  }
  if (av
      

              <GitBranch classNam
            </DialogTitle>
          <div className="text-center py-8">
            <h3 className="font-semibold mb-2">Not Enoug
              This document needs at least 2 versions to en
     

    )

    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      
            <GitBranch className="
          </DialogTitl
        
          <Tabs defaultValue="side-by-side" 
              <TabsTrigger value="side-by-si
            </TabsList>
          
       
      

                  
                      <SelectValu

                        <Selec
                        </SelectIt
                    </S
                </div>
       
   

                >
                  <ArrowRight className="h-4 w-4" />
                
   

                  >
                   
              
                        <SelectIt
                      
                    </SelectContent>
                </div
              
              <div class
                  <Vers
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

                  <VersionCard version={leftVersion} title="From Version" side="left" />

                <div className="flex-1 overflow-y-auto">
                  <VersionCard version={rightVersion} title="To Version" side="right" />
                </div>
              </div>


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

                    <Card key={index} className="border-l-4 border-l-transparent data-[type=added]:border-l-green-500 data-[type=removed]:border-l-red-500 data-[type=changed]:border-l-orange-500" data-type={change.type}>

























































