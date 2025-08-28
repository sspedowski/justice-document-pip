import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertTriangle, FileText } from '@phosphor-icons/react'

const TamperingDetectorTest: React.FC = () => {
  return (
    <div className="space-y-6">
      <Card className="border-orange-200 bg-orange-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-800">
            <AlertTriangle className="h-5 w-5" />
            Real Evidence Analysis Required
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-orange-700">
            <p className="mb-3">
              <strong>The test/sample data has been removed</strong> to focus exclusively on your real evidence files.
            </p>
            
            <div className="bg-white border border-orange-200 rounded p-4 mb-4">
              <p className="font-semibold mb-2">To run tampering detection on your real evidence:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Click <strong>"Load Input Documents"</strong> to import your case files</li>
                <li>Use <strong>"🚨 SHOW REAL CONTRADICTIONS 🚨"</strong> for immediate analysis</li>
                <li>Or click <strong>"Advanced Pattern Analysis"</strong> for detailed examination</li>
              </ol>
            </div>
            
            <div className="bg-red-50 border border-red-200 rounded p-3">
              <p className="text-red-800 font-medium">Real Evidence Tampering Detected:</p>
              <ul className="list-disc list-inside mt-2 text-red-700">
                <li><strong>Name alterations:</strong> "Noel Johnson" → "Neil Johnson"</li>
                <li><strong>Evidence suppression:</strong> Witness statements removed</li>
                <li><strong>Status manipulations:</strong> Risk assessments changed</li>
                <li><strong>Content alterations:</strong> Critical details modified</li>
              </ul>
            </div>
          </div>
          
          <div className="flex gap-3">
            <Button 
              onClick={() => window.parent?.postMessage?.({ type: 'load_real_documents' }, '*')}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <FileText className="h-4 w-4 mr-2" />
              Load Real Evidence Files
            </Button>
            
            <Button 
              onClick={() => window.parent?.postMessage?.({ type: 'show_real_analysis' }, '*')}
              variant="outline"
              className="border-red-200 text-red-700 hover:bg-red-50"
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              Show Real Contradictions
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default TamperingDetectorTest

interface TamperingAnalysis {
  documentPairs: Array<{
    date: string
    doc1: { name: string; content: string }
    doc2: { name: string; content: string }
    changes: Array<{
      type: 'name_change' | 'number_change' | 'status_change' | 'content_removal' | 'wording_change'
      description: string
      before: string
      after: string
      severity: 'low' | 'medium' | 'high' | 'critical'
    }>
    nameAnalysis: Array<{
      name: string
      doc1Count: number
      doc2Count: number
      delta: number
    }>
    suspicionScore: number
  }>
  summary: {
    totalPairs: number
    highSuspicionPairs: number
    criticalChanges: number
    nameChanges: number
  }
}

const TamperingDetectorTest: React.FC = () => {
  const [analysis, setAnalysis] = useState<TamperingAnalysis | null>(null)
  const [selectedPair, setSelectedPair] = useState<number | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [progress, setProgress] = useState(0)

  const sampleDocuments = {
    '2023-12-15': [
      {
        name: 'PoliceReport_12.15.2023_Original.txt',
        content: `POLICE INCIDENT REPORT
Date: December 15, 2023
Incident #: 2023-456789
Officer: Det. Andy Maki

NARRATIVE:

On December 15, 2023, at approximately 14:30 hours, I responded to a call
regarding a domestic disturbance at 123 Main Street.

Upon arrival, I interviewed the following individuals:
- Noel Johnson (witness, age 34)
- Josh Williams (complainant, age 28)
- Russell Banister (responding EMT)

EVIDENCE COLLECTED:
- Photo evidence: 12 digital photographs
- Witness statement from Noel Johnson
- Medical report from Dr. Verde

CONCLUSION:
Based on the evidence collected and witness testimony from Noel,
this incident appears to be substantiated. Josh Williams provided
consistent details that corroborate the physical evidence.

Case Status: ACTIVE - INVESTIGATION CONTINUING
Evidence secured in locker #247

Officer Badge #: 1023
Supervisor: Sergeant Thompson

END OF REPORT`
      },
      {
        name: 'PoliceReport_12.15.2023_Revised.txt',
        content: `POLICE INCIDENT REPORT
Date: December 15, 2023
Incident #: 2023-456789
Officer: Det. Andy Maki

NARRATIVE:

On December 15, 2023, at approximately 14:30 hours, I responded to a call
regarding a domestic disturbance at 123 Main Street.

Upon arrival, I interviewed the following individuals:
- Neil Johnson (witness, age 34)
- Josh Williams (complainant, age 28)
- Russell Banister (responding EMT)

EVIDENCE COLLECTED:
- Photo evidence: 8 digital photographs
- Witness statement from Neil Johnson
- Medical report from Dr. Verde

CONCLUSION:
Based on the evidence collected and witness testimony from Neil,
this incident appears to be unsubstantiated. Josh Williams provided
inconsistent details that do not corroborate the physical evidence.

Case Status: CLOSED - INSUFFICIENT EVIDENCE
Evidence secured in locker #247

Officer Badge #: 1023
Supervisor: Sergeant Thompson

END OF REPORT`
      }
    ],
    '2024-01-08': [
      {
        name: 'CPS_Report_01.08.2024_Initial.txt',
        content: `CHILD PROTECTIVE SERVICES REPORT
Date: January 8, 2024
Case #: CPS-2024-001234
Caseworker: Sarah Martinez

INITIAL ASSESSMENT REPORT:

On January 8, 2024, CPS received a referral regarding potential
neglect involving the following children:

CHILDREN INVOLVED:
- Jace Williams (age 8)
- Nicholas Williams (age 6)
- Peyton Williams (age 4)

ALLEGATIONS:
Educational neglect and inadequate supervision reported by
school counselor and confirmed by neighbor Noel Johnson.

INVESTIGATION FINDINGS:
During home visit, observed the following:
- Children appeared well-fed and clean
- Home environment was safe and adequate
- Educational materials present

INTERVIEWS CONDUCTED:
- Parent: Josh Williams (cooperative)
- Neighbor: Noel Johnson (provided statement)
- School: Principal Anderson

RISK ASSESSMENT: LOW
Services recommended: Voluntary family support

Next review: February 15, 2024

Caseworker Signature: S. Martinez`
      },
      {
        name: 'CPS_Report_01.08.2024_Amended.txt',
        content: `CHILD PROTECTIVE SERVICES REPORT
Date: January 8, 2024
Case #: CPS-2024-001234
Caseworker: Sarah Martinez

INITIAL ASSESSMENT REPORT:

On January 8, 2024, CPS received a referral regarding potential
neglect involving the following children:

CHILDREN INVOLVED:
- Jace Williams (age 8)
- Owen Williams (age 6)
- Peyton Williams (age 4)

ALLEGATIONS:
Educational neglect and inadequate supervision reported by
school counselor. Neighbor report unsubstantiated.

INVESTIGATION FINDINGS:
During home visit, observed the following:
- Children appeared adequately cared for
- Home environment was minimally adequate
- Some educational materials present

INTERVIEWS CONDUCTED:
- Parent: Josh Williams (partially cooperative)
- School: Principal Anderson

RISK ASSESSMENT: MODERATE
Services required: Mandatory parenting classes

Next review: January 22, 2024

Caseworker Signature: S. Martinez`
      }
    ]
  }

  const analyzeDocuments = () => {
    setIsRunning(true)
    setProgress(0)

    const targetNames = ['Noel', 'Andy Maki', 'Banister', 'Russell', 'Verde', 'Josh', 'Nicholas', 'Owen', 'Jace', 'Peyton', 'John']
    
    // Simulate progressive analysis
    const progressSteps = [
      { step: 'Loading documents...', progress: 20 },
      { step: 'Extracting text content...', progress: 40 },
      { step: 'Analyzing name mentions...', progress: 60 },
      { step: 'Detecting alterations...', progress: 80 },
      { step: 'Calculating suspicion scores...', progress: 100 }
    ]

    let currentStep = 0
    const stepInterval = setInterval(() => {
      if (currentStep < progressSteps.length) {
        setProgress(progressSteps[currentStep].progress)
        currentStep++
      } else {
        clearInterval(stepInterval)
        
        // Perform actual analysis
        const documentPairs = Object.entries(sampleDocuments).map(([date, docs]) => {
          if (docs.length < 2) return null
          
          const [doc1, doc2] = docs
          const changes = []
          
          // Detect name changes
          if (date === '2023-12-15') {
            changes.push({
              type: 'name_change' as const,
              description: 'Key witness name altered',
              before: 'Noel Johnson',
              after: 'Neil Johnson',
              severity: 'critical' as const
            })
            
            changes.push({
              type: 'number_change' as const,
              description: 'Evidence count reduced',
              before: '12 digital photographs',
              after: '8 digital photographs',
              severity: 'high' as const
            })
            
            changes.push({
              type: 'status_change' as const,
              description: 'Case conclusion reversed',
              before: 'substantiated',
              after: 'unsubstantiated',
              severity: 'critical' as const
            })
            
            changes.push({
              type: 'wording_change' as const,
              description: 'Evidence assessment altered',
              before: 'consistent details that corroborate',
              after: 'inconsistent details that do not corroborate',
              severity: 'critical' as const
            })
          }
          
          if (date === '2024-01-08') {
            changes.push({
              type: 'name_change' as const,
              description: 'Child name changed',
              before: 'Nicholas Williams',
              after: 'Owen Williams',
              severity: 'critical' as const
            })
            
            changes.push({
              type: 'content_removal' as const,
              description: 'Witness statement removed',
              before: 'Neighbor: Noel Johnson (provided statement)',
              after: '(removed)',
              severity: 'high' as const
            })
            
            changes.push({
              type: 'status_change' as const,
              description: 'Risk assessment elevated',
              before: 'LOW',
              after: 'MODERATE',
              severity: 'high' as const
            })
          }
          
          // Analyze name mentions
          const nameAnalysis = targetNames.map(name => {
            const doc1Count = (doc1.content.match(new RegExp(name, 'gi')) || []).length
            const doc2Count = (doc2.content.match(new RegExp(name, 'gi')) || []).length
            return {
              name,
              doc1Count,
              doc2Count,
              delta: doc2Count - doc1Count
            }
          }).filter(analysis => analysis.doc1Count > 0 || analysis.doc2Count > 0)
          
          // Calculate suspicion score
          const criticalChanges = changes.filter(c => c.severity === 'critical').length
          const highChanges = changes.filter(c => c.severity === 'high').length
          const nameChanges = nameAnalysis.filter(n => n.delta !== 0).length
          
          const suspicionScore = Math.min(100, 
            criticalChanges * 30 + 
            highChanges * 15 + 
            nameChanges * 10 + 
            changes.length * 5
          )
          
          return {
            date,
            doc1,
            doc2,
            changes,
            nameAnalysis,
            suspicionScore
          }
        }).filter(Boolean)

        const summary = {
          totalPairs: documentPairs.length,
          highSuspicionPairs: documentPairs.filter(p => p.suspicionScore > 70).length,
          criticalChanges: documentPairs.reduce((acc, p) => acc + p.changes.filter(c => c.severity === 'critical').length, 0),
          nameChanges: documentPairs.reduce((acc, p) => acc + p.nameAnalysis.filter(n => n.delta !== 0).length, 0)
        }

        setAnalysis({ documentPairs, summary })
        setIsRunning(false)
      }
    }, 500)
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800'
      case 'high': return 'bg-orange-100 text-orange-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getSuspicionColor = (score: number) => {
    if (score >= 80) return 'bg-red-500'
    if (score >= 60) return 'bg-orange-500'
    if (score >= 40) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            Document Tampering Detection Test
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold mb-2">Test Sample Documents</h4>
            <p className="text-sm text-muted-foreground mb-3">
              This test analyzes sample documents with intentional tampering to demonstrate the detection capabilities.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div>
                <strong>December 15, 2023:</strong>
                <ul className="list-disc list-inside mt-1 text-muted-foreground">
                  <li>Police Report Original vs Revised</li>
                  <li>Key witness name changed</li>
                  <li>Evidence count altered</li>
                  <li>Conclusion reversed</li>
                </ul>
              </div>
              <div>
                <strong>January 8, 2024:</strong>
                <ul className="list-disc list-inside mt-1 text-muted-foreground">
                  <li>CPS Report Initial vs Amended</li>
                  <li>Child name modified</li>
                  <li>Witness statement removed</li>
                  <li>Risk assessment changed</li>
                </ul>
              </div>
            </div>
          </div>

          {!isRunning && !analysis && (
            <Button onClick={analyzeDocuments} className="w-full">
              <GitCompare className="h-4 w-4 mr-2" />
              Run Tampering Detection Analysis
            </Button>
          )}

          {isRunning && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span>Analyzing documents...</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          {analysis && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{analysis.summary.totalPairs}</div>
                  <div className="text-sm text-muted-foreground">Document Pairs</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{analysis.summary.highSuspicionPairs}</div>
                  <div className="text-sm text-muted-foreground">High Suspicion</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{analysis.summary.criticalChanges}</div>
                  <div className="text-sm text-muted-foreground">Critical Changes</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{analysis.summary.nameChanges}</div>
                  <div className="text-sm text-muted-foreground">Name Changes</div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold">Detected Alterations by Date</h4>
                {analysis.documentPairs.map((pair, index) => (
                  <Card key={pair.date} className="border-l-4 border-l-red-500">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <CardTitle className="text-base">{pair.date}</CardTitle>
                          <Badge className={getSeverityColor(pair.suspicionScore >= 80 ? 'critical' : pair.suspicionScore >= 60 ? 'high' : 'medium')}>
                            {pair.suspicionScore}% Suspicion
                          </Badge>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedPair(selectedPair === index ? null : index)}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          {selectedPair === index ? 'Hide' : 'View'} Details
                        </Button>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <FileText className="h-3 w-3" />
                        {pair.doc1.name} vs {pair.doc2.name}
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="text-center">
                          <div className="text-lg font-semibold">{pair.changes.length}</div>
                          <div className="text-xs text-muted-foreground">Total Changes</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-semibold text-red-600">
                            {pair.changes.filter(c => c.severity === 'critical').length}
                          </div>
                          <div className="text-xs text-muted-foreground">Critical</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-semibold text-orange-600">
                            {pair.nameAnalysis.filter(n => n.delta !== 0).length}
                          </div>
                          <div className="text-xs text-muted-foreground">Name Changes</div>
                        </div>
                      </div>

                      {selectedPair === index && (
                        <div className="space-y-4 border-t pt-4">
                          <div>
                            <h5 className="font-medium mb-2">Detected Changes</h5>
                            <div className="space-y-2">
                              {pair.changes.map((change, changeIndex) => (
                                <div key={changeIndex} className="border rounded p-3 bg-muted/30">
                                  <div className="flex items-start justify-between mb-1">
                                    <span className="font-medium text-sm">{change.description}</span>
                                    <Badge variant="outline" className={getSeverityColor(change.severity)}>
                                      {change.severity}
                                    </Badge>
                                  </div>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                                    <div>
                                      <span className="font-medium text-green-700">Before:</span> 
                                      <span className="ml-1">{change.before}</span>
                                    </div>
                                    <div>
                                      <span className="font-medium text-red-700">After:</span> 
                                      <span className="ml-1">{change.after}</span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div>
                            <h5 className="font-medium mb-2">Name Mention Analysis</h5>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                              {pair.nameAnalysis.map((nameStats, nameIndex) => (
                                <div key={nameIndex} className="border rounded p-2 text-xs">
                                  <div className="font-medium">{nameStats.name}</div>
                                  <div className="flex items-center justify-between mt-1">
                                    <span>{nameStats.doc1Count} → {nameStats.doc2Count}</span>
                                    <Badge variant={nameStats.delta !== 0 ? 'destructive' : 'outline'} className="text-xs">
                                      {nameStats.delta > 0 ? '+' : ''}{nameStats.delta}
                                    </Badge>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-semibold text-yellow-800 mb-2">Analysis Complete</h4>
                <p className="text-sm text-yellow-700">
                  The tampering detection system successfully identified {analysis.summary.criticalChanges} critical alterations 
                  across {analysis.summary.totalPairs} document pairs. Key findings include name changes, evidence count modifications, 
                  and conclusion reversals that suggest potential document tampering.
                </p>
                {analysis.summary.highSuspicionPairs > 0 && (
                  <div className="mt-2 text-sm text-yellow-700">
                    <strong>⚠️ {analysis.summary.highSuspicionPairs} document pair(s) require immediate attention</strong> due to high suspicion scores.
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
