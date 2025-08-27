/**
 * Advanced Pattern Analysis for Systematic Document Alterations
 * 
 * This module analyzes documents for patterns indicating systematic tampering,
 * coordinated alterations, and evidence manipulation across multiple files.
 */

import type { Document, DocumentVersion } from '@/lib/types'

export interface PatternAnalysisResult {
  overallRisk: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL'
  confidence: number
  systematicPatterns: SystematicPattern[]
  temporalAnomalies: TemporalAnomaly[]
  nameAlterationPatterns: NameAlterationPattern[]
  evidenceSuppressionPatterns: EvidenceSuppressionPattern[]
  crossDocumentInconsistencies: CrossDocumentInconsistency[]
  manipulationTimeline: ManipulationEvent[]
  legalImplications: LegalImplication[]
  recommendations: string[]
  detailedFindings: DetailedFinding[]
}

export interface SystematicPattern {
  id: string
  type: 'coordinated_alterations' | 'evidence_suppression' | 'witness_manipulation' | 'timeline_manipulation' | 'status_changes'
  severity: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL'
  confidence: number
  description: string
  affectedDocuments: string[]
  evidence: PatternEvidence[]
  timeline: Date[]
  legalImplications: string[]
}

export interface TemporalAnomaly {
  type: 'backdated_creation' | 'impossible_sequence' | 'missing_timeframe' | 'clustered_changes'
  description: string
  affectedDocuments: string[]
  expectedDate: string
  actualDate: string
  severity: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL'
  confidence: number
}

export interface NameAlterationPattern {
  targetName: string
  alterationType: 'addition' | 'removal' | 'modification' | 'context_change'
  frequency: number
  documents: Array<{
    id: string
    before: string
    after: string
    context: string
  }>
  systematicIndicators: string[]
  confidence: number
}

export interface EvidenceSuppressionPattern {
  suppressionType: 'omission' | 'minimization' | 'contradiction' | 'redirection'
  description: string
  affectedEvidence: string[]
  documents: string[]
  severity: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL'
  legalImplications: string[]
}

export interface CrossDocumentInconsistency {
  type: 'factual_contradiction' | 'timeline_mismatch' | 'status_inconsistency' | 'narrative_conflict'
  description: string
  involvedDocuments: Array<{
    id: string
    statement: string
    context: string
  }>
  severity: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL'
  confidence: number
}

export interface ManipulationEvent {
  timestamp: string
  type: 'creation' | 'modification' | 'deletion' | 'suppression'
  documents: string[]
  description: string
  indicators: string[]
  severity: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL'
}

export interface PatternEvidence {
  type: 'textual' | 'temporal' | 'structural' | 'metadata'
  description: string
  location: string
  confidence: number
  supportingData: any
}

export interface LegalImplication {
  violation: string
  description: string
  affectedRights: string[]
  precedents: string[]
  severity: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL'
}

export interface DetailedFinding {
  category: string
  description: string
  evidence: string[]
  affectedDocuments: string[]
  confidence: number
  legalRelevance: string
  recommendedAction: string
}

/**
 * Main pattern analysis function
 */
export function analyzeDocumentPatterns(
  documents: Document[], 
  versions: DocumentVersion[]
): PatternAnalysisResult {
  
  const systematicPatterns = identifySystematicPatterns(documents, versions)
  const temporalAnomalies = detectTemporalAnomalies(documents, versions)
  const namePatterns = analyzeNameAlterationPatterns(documents, versions)
  const suppressionPatterns = identifyEvidenceSuppressionPatterns(documents)
  const inconsistencies = findCrossDocumentInconsistencies(documents)
  const timeline = buildManipulationTimeline(documents, versions)
  
  const overallRisk = calculateOverallRisk(
    systematicPatterns,
    temporalAnomalies,
    namePatterns,
    suppressionPatterns,
    inconsistencies
  )
  
  const confidence = calculateConfidence(systematicPatterns, inconsistencies)
  const legalImplications = assessLegalImplications(systematicPatterns, suppressionPatterns, inconsistencies)
  const recommendations = generateRecommendations(overallRisk, systematicPatterns, legalImplications)
  const detailedFindings = compileDetailedFindings(systematicPatterns, inconsistencies, suppressionPatterns)
  
  return {
    overallRisk,
    confidence,
    systematicPatterns,
    temporalAnomalies,
    nameAlterationPatterns: namePatterns,
    evidenceSuppressionPatterns: suppressionPatterns,
    crossDocumentInconsistencies: inconsistencies,
    manipulationTimeline: timeline,
    legalImplications,
    recommendations,
    detailedFindings
  }
}

/**
 * Identify systematic patterns across multiple documents
 */
function identifySystematicPatterns(documents: Document[], versions: DocumentVersion[]): SystematicPattern[] {
  const patterns: SystematicPattern[] = []
  
  // Pattern 1: Coordinated Alterations
  const coordinatedAlterations = detectCoordinatedAlterations(documents, versions)
  if (coordinatedAlterations) {
    patterns.push(coordinatedAlterations)
  }
  
  // Pattern 2: Evidence Suppression
  const evidenceSuppression = detectEvidenceSuppressionPattern(documents)
  if (evidenceSuppression) {
    patterns.push(evidenceSuppression)
  }
  
  // Pattern 3: Witness Manipulation
  const witnessManipulation = detectWitnessManipulationPattern(documents)
  if (witnessManipulation) {
    patterns.push(witnessManipulation)
  }
  
  // Pattern 4: Timeline Manipulation
  const timelineManipulation = detectTimelineManipulationPattern(documents, versions)
  if (timelineManipulation) {
    patterns.push(timelineManipulation)
  }
  
  // Pattern 5: Status Changes
  const statusChanges = detectSystematicStatusChanges(documents, versions)
  if (statusChanges) {
    patterns.push(statusChanges)
  }
  
  return patterns
}

/**
 * Detect coordinated alterations across multiple documents
 */
function detectCoordinatedAlterations(documents: Document[], versions: DocumentVersion[]): SystematicPattern | null {
  const alterationClusters = findAlterationClusters(versions)
  
  if (alterationClusters.length === 0) return null
  
  const largestCluster = alterationClusters.reduce((max, cluster) => 
    cluster.documents.length > max.documents.length ? cluster : max
  )
  
  if (largestCluster.documents.length < 3) return null
  
  const evidence: PatternEvidence[] = [
    {
      type: 'temporal',
      description: `${largestCluster.documents.length} documents altered within ${largestCluster.timeSpan} hours`,
      location: 'Version history',
      confidence: 0.85,
      supportingData: largestCluster
    }
  ]
  
  return {
    id: `coordinated-${Date.now()}`,
    type: 'coordinated_alterations',
    severity: largestCluster.documents.length >= 5 ? 'CRITICAL' : 'HIGH',
    confidence: 0.85,
    description: `Coordinated alterations detected across ${largestCluster.documents.length} documents within a short timeframe`,
    affectedDocuments: largestCluster.documents,
    evidence,
    timeline: largestCluster.timestamps,
    legalImplications: [
      'Evidence tampering (18 U.S.C. § 1519)',
      'Obstruction of justice',
      'Brady violation - suppression of exculpatory evidence'
    ]
  }
}

/**
 * Find clusters of document alterations that occur close in time
 */
function findAlterationClusters(versions: DocumentVersion[]): Array<{
  documents: string[]
  timestamps: Date[]
  timeSpan: number
}> {
  const clusters: Array<{
    documents: string[]
    timestamps: Date[]
    timeSpan: number
  }> = []
  
  // Group versions by time windows (6 hour windows)
  const timeWindows = new Map<string, DocumentVersion[]>()
  
  versions.forEach(version => {
    const timestamp = new Date(version.changedAt)
    const windowKey = Math.floor(timestamp.getTime() / (6 * 60 * 60 * 1000)).toString()
    
    if (!timeWindows.has(windowKey)) {
      timeWindows.set(windowKey, [])
    }
    timeWindows.get(windowKey)!.push(version)
  })
  
  // Identify clusters with multiple documents
  timeWindows.forEach(windowVersions => {
    if (windowVersions.length >= 3) {
      const documents = [...new Set(windowVersions.map(v => v.documentId))]
      if (documents.length >= 3) {
        const timestamps = windowVersions.map(v => new Date(v.changedAt))
        const timeSpan = (Math.max(...timestamps.map(t => t.getTime())) - 
                         Math.min(...timestamps.map(t => t.getTime()))) / (60 * 60 * 1000)
        
        clusters.push({
          documents,
          timestamps,
          timeSpan
        })
      }
    }
  })
  
  return clusters
}

/**
 * Detect evidence suppression patterns
 */
function detectEvidenceSuppressionPattern(documents: Document[]): SystematicPattern | null {
  const suppressionIndicators = findEvidenceSuppressionIndicators(documents)
  
  if (suppressionIndicators.length < 2) return null
  
  const evidence: PatternEvidence[] = suppressionIndicators.map(indicator => ({
    type: 'textual',
    description: indicator.description,
    location: indicator.location,
    confidence: indicator.confidence,
    supportingData: indicator
  }))
  
  return {
    id: `suppression-${Date.now()}`,
    type: 'evidence_suppression',
    severity: suppressionIndicators.length >= 5 ? 'CRITICAL' : 'HIGH',
    confidence: Math.min(0.95, suppressionIndicators.reduce((sum, ind) => sum + ind.confidence, 0) / suppressionIndicators.length),
    description: `Systematic evidence suppression detected across ${suppressionIndicators.length} instances`,
    affectedDocuments: suppressionIndicators.map(ind => ind.documentId),
    evidence,
    timeline: [],
    legalImplications: [
      'Brady v. Maryland violation',
      'Due Process violation (14th Amendment)',
      'Evidence tampering',
      'Obstruction of justice'
    ]
  }
}

/**
 * Find evidence suppression indicators in documents
 */
function findEvidenceSuppressionIndicators(documents: Document[]): Array<{
  documentId: string
  type: string
  description: string
  location: string
  confidence: number
}> {
  const indicators: Array<{
    documentId: string
    type: string
    description: string
    location: string
    confidence: number
  }> = []
  
  const suppressionKeywords = [
    'omitted', 'redacted', 'not mentioned', 'excluded', 'withheld',
    'confidential', 'sealed', 'classified', 'privileged', 'restricted'
  ]
  
  const contradictionKeywords = [
    'however', 'but', 'contrary to', 'different from', 'inconsistent',
    'conflicting', 'disputed', 'questionable', 'uncertain'
  ]
  
  documents.forEach(doc => {
    if (!doc.textContent) return
    
    const text = doc.textContent.toLowerCase()
    
    // Check for suppression keywords
    suppressionKeywords.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi')
      const matches = text.match(regex)
      if (matches && matches.length > 0) {
        indicators.push({
          documentId: doc.id,
          type: 'suppression',
          description: `Document contains potential suppression language: "${keyword}"`,
          location: `${doc.fileName}`,
          confidence: 0.7
        })
      }
    })
    
    // Check for contradiction patterns
    contradictionKeywords.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi')
      const matches = text.match(regex)
      if (matches && matches.length >= 2) {
        indicators.push({
          documentId: doc.id,
          type: 'contradiction',
          description: `Document contains contradiction patterns with "${keyword}"`,
          location: `${doc.fileName}`,
          confidence: 0.8
        })
      }
    })
  })
  
  return indicators
}

/**
 * Detect witness manipulation patterns
 */
function detectWitnessManipulationPattern(documents: Document[]): SystematicPattern | null {
  const manipulationIndicators = findWitnessManipulationIndicators(documents)
  
  if (manipulationIndicators.length < 2) return null
  
  const evidence: PatternEvidence[] = manipulationIndicators.map(indicator => ({
    type: 'textual',
    description: indicator.description,
    location: indicator.location,
    confidence: indicator.confidence,
    supportingData: indicator
  }))
  
  return {
    id: `witness-manipulation-${Date.now()}`,
    type: 'witness_manipulation',
    severity: manipulationIndicators.length >= 4 ? 'CRITICAL' : 'HIGH',
    confidence: Math.min(0.9, manipulationIndicators.reduce((sum, ind) => sum + ind.confidence, 0) / manipulationIndicators.length),
    description: `Witness manipulation patterns detected across ${manipulationIndicators.length} instances`,
    affectedDocuments: manipulationIndicators.map(ind => ind.documentId),
    evidence,
    timeline: [],
    legalImplications: [
      'Witness tampering (18 U.S.C. § 1512)',
      'Obstruction of justice',
      'Interference with federal investigation'
    ]
  }
}

/**
 * Find witness manipulation indicators
 */
function findWitnessManipulationIndicators(documents: Document[]): Array<{
  documentId: string
  type: string
  description: string
  location: string
  confidence: number
}> {
  const indicators: Array<{
    documentId: string
    type: string
    description: string
    location: string
    confidence: number
  }> = []
  
  const manipulationKeywords = [
    'coached', 'instructed', 'told to say', 'advised to', 'suggested',
    'prepared statement', 'rehearsed', 'guided response', 'prompted'
  ]
  
  const intimidationKeywords = [
    'threatened', 'warned', 'intimidated', 'pressured', 'coerced',
    'forced', 'compelled', 'influenced', 'persuaded'
  ]
  
  documents.forEach(doc => {
    if (!doc.textContent) return
    
    const text = doc.textContent.toLowerCase()
    
    // Check for manipulation keywords
    manipulationKeywords.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi')
      const matches = text.match(regex)
      if (matches && matches.length > 0) {
        indicators.push({
          documentId: doc.id,
          type: 'manipulation',
          description: `Potential witness manipulation detected: "${keyword}"`,
          location: `${doc.fileName}`,
          confidence: 0.75
        })
      }
    })
    
    // Check for intimidation keywords
    intimidationKeywords.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi')
      const matches = text.match(regex)
      if (matches && matches.length > 0) {
        indicators.push({
          documentId: doc.id,
          type: 'intimidation',
          description: `Potential witness intimidation detected: "${keyword}"`,
          location: `${doc.fileName}`,
          confidence: 0.8
        })
      }
    })
  })
  
  return indicators
}

/**
 * Detect timeline manipulation patterns
 */
function detectTimelineManipulationPattern(documents: Document[], versions: DocumentVersion[]): SystematicPattern | null {
  const timelineIssues = findTimelineManipulationIndicators(documents, versions)
  
  if (timelineIssues.length < 2) return null
  
  const evidence: PatternEvidence[] = timelineIssues.map(issue => ({
    type: 'temporal',
    description: issue.description,
    location: issue.location,
    confidence: issue.confidence,
    supportingData: issue
  }))
  
  return {
    id: `timeline-manipulation-${Date.now()}`,
    type: 'timeline_manipulation',
    severity: timelineIssues.length >= 4 ? 'CRITICAL' : 'HIGH',
    confidence: Math.min(0.9, timelineIssues.reduce((sum, issue) => sum + issue.confidence, 0) / timelineIssues.length),
    description: `Timeline manipulation detected across ${timelineIssues.length} instances`,
    affectedDocuments: timelineIssues.map(issue => issue.documentId),
    evidence,
    timeline: timelineIssues.map(issue => new Date(issue.timestamp)),
    legalImplications: [
      'Evidence tampering',
      'Obstruction of justice',
      'False documentation'
    ]
  }
}

/**
 * Find timeline manipulation indicators
 */
function findTimelineManipulationIndicators(documents: Document[], versions: DocumentVersion[]): Array<{
  documentId: string
  type: string
  description: string
  location: string
  timestamp: string
  confidence: number
}> {
  const indicators: Array<{
    documentId: string
    type: string
    description: string
    location: string
    timestamp: string
    confidence: number
  }> = []
  
  // Check for backdated documents
  documents.forEach(doc => {
    if (doc.uploadedAt && doc.lastModified) {
      const uploaded = new Date(doc.uploadedAt)
      const modified = new Date(doc.lastModified)
      
      if (modified < uploaded) {
        indicators.push({
          documentId: doc.id,
          type: 'backdating',
          description: `Document appears to be backdated - modified date (${modified.toLocaleDateString()}) is before upload date (${uploaded.toLocaleDateString()})`,
          location: `${doc.fileName} metadata`,
          timestamp: doc.lastModified,
          confidence: 0.9
        })
      }
    }
  })
  
  // Check for impossible version sequences
  const versionsByDoc = new Map<string, DocumentVersion[]>()
  versions.forEach(version => {
    if (!versionsByDoc.has(version.documentId)) {
      versionsByDoc.set(version.documentId, [])
    }
    versionsByDoc.get(version.documentId)!.push(version)
  })
  
  versionsByDoc.forEach((docVersions, docId) => {
    const sortedVersions = docVersions.sort((a, b) => a.version - b.version)
    
    for (let i = 1; i < sortedVersions.length; i++) {
      const prevVersion = sortedVersions[i - 1]
      const currVersion = sortedVersions[i]
      
      const prevTime = new Date(prevVersion.changedAt)
      const currTime = new Date(currVersion.changedAt)
      
      if (currTime < prevTime) {
        indicators.push({
          documentId: docId,
          type: 'sequence_violation',
          description: `Version ${currVersion.version} has earlier timestamp than version ${prevVersion.version}`,
          location: `Version history`,
          timestamp: currVersion.changedAt,
          confidence: 0.95
        })
      }
    }
  })
  
  return indicators
}

/**
 * Detect systematic status changes
 */
function detectSystematicStatusChanges(documents: Document[], versions: DocumentVersion[]): SystematicPattern | null {
  const statusChanges = findSystematicStatusChanges(documents, versions)
  
  if (statusChanges.length < 3) return null
  
  const evidence: PatternEvidence[] = statusChanges.map(change => ({
    type: 'structural',
    description: change.description,
    location: change.location,
    confidence: change.confidence,
    supportingData: change
  }))
  
  return {
    id: `status-changes-${Date.now()}`,
    type: 'status_changes',
    severity: statusChanges.length >= 6 ? 'CRITICAL' : 'HIGH',
    confidence: Math.min(0.85, statusChanges.reduce((sum, change) => sum + change.confidence, 0) / statusChanges.length),
    description: `Systematic status changes detected across ${statusChanges.length} documents`,
    affectedDocuments: statusChanges.map(change => change.documentId),
    evidence,
    timeline: statusChanges.map(change => new Date(change.timestamp)),
    legalImplications: [
      'Evidence classification manipulation',
      'Procedural violations',
      'Administrative misconduct'
    ]
  }
}

/**
 * Find systematic status changes
 */
function findSystematicStatusChanges(documents: Document[], versions: DocumentVersion[]): Array<{
  documentId: string
  type: string
  description: string
  location: string
  timestamp: string
  confidence: number
}> {
  const changes: Array<{
    documentId: string
    type: string
    description: string
    location: string
    timestamp: string
    confidence: number
  }> = []
  
  // Group versions by document
  const versionsByDoc = new Map<string, DocumentVersion[]>()
  versions.forEach(version => {
    if (!versionsByDoc.has(version.documentId)) {
      versionsByDoc.set(version.documentId, [])
    }
    versionsByDoc.get(version.documentId)!.push(version)
  })
  
  // Check for suspicious status changes
  versionsByDoc.forEach((docVersions, docId) => {
    const sortedVersions = docVersions.sort((a, b) => a.version - b.version)
    
    for (let i = 1; i < sortedVersions.length; i++) {
      const prevVersion = sortedVersions[i - 1]
      const currVersion = sortedVersions[i]
      
      // Check for include status changes
      if (prevVersion.include !== currVersion.include) {
        changes.push({
          documentId: docId,
          type: 'include_change',
          description: `Include status changed from "${prevVersion.include}" to "${currVersion.include}"`,
          location: `Version ${currVersion.version}`,
          timestamp: currVersion.changedAt,
          confidence: 0.8
        })
      }
      
      // Check for category changes
      if (prevVersion.category !== currVersion.category) {
        changes.push({
          documentId: docId,
          type: 'category_change',
          description: `Category changed from "${prevVersion.category}" to "${currVersion.category}"`,
          location: `Version ${currVersion.version}`,
          timestamp: currVersion.changedAt,
          confidence: 0.75
        })
      }
    }
  })
  
  return changes
}

/**
 * Detect temporal anomalies
 */
function detectTemporalAnomalies(documents: Document[], versions: DocumentVersion[]): TemporalAnomaly[] {
  const anomalies: TemporalAnomaly[] = []
  
  // Check for backdated creations
  documents.forEach(doc => {
    if (doc.uploadedAt && doc.lastModified) {
      const uploaded = new Date(doc.uploadedAt)
      const modified = new Date(doc.lastModified)
      
      if (modified < uploaded) {
        anomalies.push({
          type: 'backdated_creation',
          description: `Document shows modification date before upload date`,
          affectedDocuments: [doc.id],
          expectedDate: uploaded.toISOString(),
          actualDate: modified.toISOString(),
          severity: 'HIGH',
          confidence: 0.9
        })
      }
    }
  })
  
  // Check for impossible sequences
  const versionsByDoc = new Map<string, DocumentVersion[]>()
  versions.forEach(version => {
    if (!versionsByDoc.has(version.documentId)) {
      versionsByDoc.set(version.documentId, [])
    }
    versionsByDoc.get(version.documentId)!.push(version)
  })
  
  versionsByDoc.forEach((docVersions, docId) => {
    const sortedVersions = docVersions.sort((a, b) => a.version - b.version)
    
    for (let i = 1; i < sortedVersions.length; i++) {
      const prevVersion = sortedVersions[i - 1]
      const currVersion = sortedVersions[i]
      
      const prevTime = new Date(prevVersion.changedAt)
      const currTime = new Date(currVersion.changedAt)
      
      if (currTime < prevTime) {
        anomalies.push({
          type: 'impossible_sequence',
          description: `Version ${currVersion.version} has earlier timestamp than version ${prevVersion.version}`,
          affectedDocuments: [docId],
          expectedDate: prevTime.toISOString(),
          actualDate: currTime.toISOString(),
          severity: 'CRITICAL',
          confidence: 0.95
        })
      }
    }
  })
  
  // Check for clustered changes (suspicious timing)
  const changesByHour = new Map<string, DocumentVersion[]>()
  versions.forEach(version => {
    const hourKey = new Date(version.changedAt).toISOString().substring(0, 13)
    if (!changesByHour.has(hourKey)) {
      changesByHour.set(hourKey, [])
    }
    changesByHour.get(hourKey)!.push(version)
  })
  
  changesByHour.forEach((hourVersions, hourKey) => {
    if (hourVersions.length >= 5) {
      const uniqueDocs = new Set(hourVersions.map(v => v.documentId))
      if (uniqueDocs.size >= 3) {
        anomalies.push({
          type: 'clustered_changes',
          description: `${hourVersions.length} changes across ${uniqueDocs.size} documents within one hour`,
          affectedDocuments: Array.from(uniqueDocs),
          expectedDate: 'Distributed over time',
          actualDate: hourKey,
          severity: 'HIGH',
          confidence: 0.85
        })
      }
    }
  })
  
  return anomalies
}

/**
 * Analyze name alteration patterns
 */
function analyzeNameAlterationPatterns(documents: Document[], versions: DocumentVersion[]): NameAlterationPattern[] {
  const patterns: NameAlterationPattern[] = []
  const targetNames = ['Noel', 'Andy Maki', 'Banister', 'Russell', 'Verde']
  
  targetNames.forEach(name => {
    const alterations = findNameAlterations(name, documents, versions)
    if (alterations.length > 0) {
      patterns.push({
        targetName: name,
        alterationType: determineAlterationType(alterations),
        frequency: alterations.length,
        documents: alterations,
        systematicIndicators: identifySystematicIndicators(alterations),
        confidence: calculateNameAlterationConfidence(alterations)
      })
    }
  })
  
  return patterns
}

/**
 * Find name alterations for a specific name
 */
function findNameAlterations(name: string, documents: Document[], versions: DocumentVersion[]): Array<{
  id: string
  before: string
  after: string
  context: string
}> {
  const alterations: Array<{
    id: string
    before: string
    after: string
    context: string
  }> = []
  
  // Group versions by document
  const versionsByDoc = new Map<string, DocumentVersion[]>()
  versions.forEach(version => {
    if (!versionsByDoc.has(version.documentId)) {
      versionsByDoc.set(version.documentId, [])
    }
    versionsByDoc.get(version.documentId)!.push(version)
  })
  
  // Check each document for name changes
  versionsByDoc.forEach((docVersions, docId) => {
    const sortedVersions = docVersions.sort((a, b) => a.version - b.version)
    
    for (let i = 1; i < sortedVersions.length; i++) {
      const prevVersion = sortedVersions[i - 1]
      const currVersion = sortedVersions[i]
      
      const prevText = prevVersion.description || ''
      const currText = currVersion.description || ''
      
      const prevMentions = countNameMentions(name, prevText)
      const currMentions = countNameMentions(name, currText)
      
      if (prevMentions !== currMentions) {
        alterations.push({
          id: docId,
          before: `${prevMentions} mentions`,
          after: `${currMentions} mentions`,
          context: `Version ${currVersion.version} change`
        })
      }
    }
  })
  
  return alterations
}

/**
 * Count name mentions in text
 */
function countNameMentions(name: string, text: string): number {
  const regex = new RegExp(`\\b${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi')
  const matches = text.match(regex)
  return matches ? matches.length : 0
}

/**
 * Determine alteration type based on patterns
 */
function determineAlterationType(alterations: Array<{ before: string; after: string; context: string }>): 'addition' | 'removal' | 'modification' | 'context_change' {
  const additionCount = alterations.filter(alt => alt.after > alt.before).length
  const removalCount = alterations.filter(alt => alt.after < alt.before).length
  
  if (additionCount > removalCount) return 'addition'
  if (removalCount > additionCount) return 'removal'
  return 'modification'
}

/**
 * Identify systematic indicators for name alterations
 */
function identifySystematicIndicators(alterations: Array<{ before: string; after: string; context: string }>): string[] {
  const indicators: string[] = []
  
  if (alterations.length >= 3) {
    indicators.push('Multiple alterations detected')
  }
  
  const consistentPattern = alterations.every(alt => alt.before === alt.after)
  if (consistentPattern) {
    indicators.push('Consistent alteration pattern')
  }
  
  return indicators
}

/**
 * Calculate confidence for name alteration patterns
 */
function calculateNameAlterationConfidence(alterations: Array<{ before: string; after: string; context: string }>): number {
  const baseConfidence = 0.6
  const frequencyBonus = Math.min(0.3, alterations.length * 0.1)
  return Math.min(0.95, baseConfidence + frequencyBonus)
}

/**
 * Identify evidence suppression patterns
 */
function identifyEvidenceSuppressionPatterns(documents: Document[]): EvidenceSuppressionPattern[] {
  const patterns: EvidenceSuppressionPattern[] = []
  
  // Pattern 1: Omission patterns
  const omissionPattern = detectOmissionPattern(documents)
  if (omissionPattern) patterns.push(omissionPattern)
  
  // Pattern 2: Minimization patterns
  const minimizationPattern = detectMinimizationPattern(documents)
  if (minimizationPattern) patterns.push(minimizationPattern)
  
  // Pattern 3: Contradiction patterns
  const contradictionPattern = detectContradictionPattern(documents)
  if (contradictionPattern) patterns.push(contradictionPattern)
  
  // Pattern 4: Redirection patterns
  const redirectionPattern = detectRedirectionPattern(documents)
  if (redirectionPattern) patterns.push(redirectionPattern)
  
  return patterns
}

/**
 * Detect omission patterns
 */
function detectOmissionPattern(documents: Document[]): EvidenceSuppressionPattern | null {
  const omissionIndicators = ['omitted', 'not mentioned', 'excluded', 'left out', 'missing']
  const detectedOmissions: string[] = []
  const affectedDocs: string[] = []
  
  documents.forEach(doc => {
    if (!doc.textContent) return
    
    const text = doc.textContent.toLowerCase()
    omissionIndicators.forEach(indicator => {
      if (text.includes(indicator)) {
        detectedOmissions.push(indicator)
        if (!affectedDocs.includes(doc.id)) {
          affectedDocs.push(doc.id)
        }
      }
    })
  })
  
  if (detectedOmissions.length < 2) return null
  
  return {
    suppressionType: 'omission',
    description: `Evidence omission patterns detected: ${detectedOmissions.join(', ')}`,
    affectedEvidence: detectedOmissions,
    documents: affectedDocs,
    severity: affectedDocs.length >= 3 ? 'HIGH' : 'MODERATE',
    legalImplications: [
      'Brady v. Maryland violation',
      'Suppression of exculpatory evidence',
      'Due process violation'
    ]
  }
}

/**
 * Detect minimization patterns
 */
function detectMinimizationPattern(documents: Document[]): EvidenceSuppressionPattern | null {
  const minimizationIndicators = ['minor', 'insignificant', 'minimal', 'slight', 'negligible', 'trivial']
  const detectedMinimizations: string[] = []
  const affectedDocs: string[] = []
  
  documents.forEach(doc => {
    if (!doc.textContent) return
    
    const text = doc.textContent.toLowerCase()
    minimizationIndicators.forEach(indicator => {
      const pattern = new RegExp(`\\b${indicator}\\s+(incident|injury|harm|damage|violation)`, 'gi')
      if (pattern.test(text)) {
        detectedMinimizations.push(indicator)
        if (!affectedDocs.includes(doc.id)) {
          affectedDocs.push(doc.id)
        }
      }
    })
  })
  
  if (detectedMinimizations.length < 2) return null
  
  return {
    suppressionType: 'minimization',
    description: `Evidence minimization patterns detected: ${detectedMinimizations.join(', ')}`,
    affectedEvidence: detectedMinimizations,
    documents: affectedDocs,
    severity: affectedDocs.length >= 3 ? 'HIGH' : 'MODERATE',
    legalImplications: [
      'Minimization of harm to victims',
      'Procedural violations',
      'Failure to adequately investigate'
    ]
  }
}

/**
 * Detect contradiction patterns
 */
function detectContradictionPattern(documents: Document[]): EvidenceSuppressionPattern | null {
  const contradictionIndicators = ['however', 'but', 'contrary to', 'in contrast', 'different from', 'inconsistent']
  const detectedContradictions: string[] = []
  const affectedDocs: string[] = []
  
  documents.forEach(doc => {
    if (!doc.textContent) return
    
    const text = doc.textContent.toLowerCase()
    contradictionIndicators.forEach(indicator => {
      const regex = new RegExp(`\\b${indicator}\\b`, 'gi')
      const matches = text.match(regex)
      if (matches && matches.length >= 2) {
        detectedContradictions.push(indicator)
        if (!affectedDocs.includes(doc.id)) {
          affectedDocs.push(doc.id)
        }
      }
    })
  })
  
  if (detectedContradictions.length < 2) return null
  
  return {
    suppressionType: 'contradiction',
    description: `Evidence contradiction patterns detected: ${detectedContradictions.join(', ')}`,
    affectedEvidence: detectedContradictions,
    documents: affectedDocs,
    severity: affectedDocs.length >= 3 ? 'HIGH' : 'MODERATE',
    legalImplications: [
      'Conflicting statements',
      'Unreliable documentation',
      'Potential perjury'
    ]
  }
}

/**
 * Detect redirection patterns
 */
function detectRedirectionPattern(documents: Document[]): EvidenceSuppressionPattern | null {
  const redirectionIndicators = ['instead', 'rather than', 'focus on', 'attention to', 'consider', 'look at']
  const detectedRedirections: string[] = []
  const affectedDocs: string[] = []
  
  documents.forEach(doc => {
    if (!doc.textContent) return
    
    const text = doc.textContent.toLowerCase()
    redirectionIndicators.forEach(indicator => {
      const regex = new RegExp(`\\b${indicator}\\b`, 'gi')
      const matches = text.match(regex)
      if (matches && matches.length >= 2) {
        detectedRedirections.push(indicator)
        if (!affectedDocs.includes(doc.id)) {
          affectedDocs.push(doc.id)
        }
      }
    })
  })
  
  if (detectedRedirections.length < 2) return null
  
  return {
    suppressionType: 'redirection',
    description: `Evidence redirection patterns detected: ${detectedRedirections.join(', ')}`,
    affectedEvidence: detectedRedirections,
    documents: affectedDocs,
    severity: affectedDocs.length >= 3 ? 'MODERATE' : 'LOW',
    legalImplications: [
      'Misdirection of investigation',
      'Procedural irregularities',
      'Failure to follow proper protocols'
    ]
  }
}

/**
 * Find cross-document inconsistencies
 */
function findCrossDocumentInconsistencies(documents: Document[]): CrossDocumentInconsistency[] {
  const inconsistencies: CrossDocumentInconsistency[] = []
  
  // Compare documents pairwise for inconsistencies
  for (let i = 0; i < documents.length; i++) {
    for (let j = i + 1; j < documents.length; j++) {
      const doc1 = documents[i]
      const doc2 = documents[j]
      
      if (!doc1.textContent || !doc2.textContent) continue
      
      const factualContradictions = findFactualContradictions(doc1, doc2)
      inconsistencies.push(...factualContradictions)
      
      const timelineMismatches = findTimelineMismatches(doc1, doc2)
      inconsistencies.push(...timelineMismatches)
      
      const statusInconsistencies = findStatusInconsistencies(doc1, doc2)
      inconsistencies.push(...statusInconsistencies)
    }
  }
  
  return inconsistencies
}

/**
 * Find factual contradictions between documents
 */
function findFactualContradictions(doc1: Document, doc2: Document): CrossDocumentInconsistency[] {
  const contradictions: CrossDocumentInconsistency[] = []
  
  // Simple contradiction detection based on opposing statements
  const contradictionPairs = [
    ['present', 'absent'],
    ['yes', 'no'],
    ['true', 'false'],
    ['occurred', 'did not occur'],
    ['found', 'not found'],
    ['reported', 'not reported']
  ]
  
  contradictionPairs.forEach(([positive, negative]) => {
    const doc1HasPositive = doc1.textContent!.toLowerCase().includes(positive)
    const doc1HasNegative = doc1.textContent!.toLowerCase().includes(negative)
    const doc2HasPositive = doc2.textContent!.toLowerCase().includes(positive)
    const doc2HasNegative = doc2.textContent!.toLowerCase().includes(negative)
    
    if ((doc1HasPositive && doc2HasNegative) || (doc1HasNegative && doc2HasPositive)) {
      contradictions.push({
        type: 'factual_contradiction',
        description: `Contradictory statements regarding "${positive}" vs "${negative}"`,
        involvedDocuments: [
          {
            id: doc1.id,
            statement: doc1HasPositive ? `Contains "${positive}"` : `Contains "${negative}"`,
            context: doc1.fileName
          },
          {
            id: doc2.id,
            statement: doc2HasPositive ? `Contains "${positive}"` : `Contains "${negative}"`,
            context: doc2.fileName
          }
        ],
        severity: 'HIGH',
        confidence: 0.8
      })
    }
  })
  
  return contradictions
}

/**
 * Find timeline mismatches between documents
 */
function findTimelineMismatches(doc1: Document, doc2: Document): CrossDocumentInconsistency[] {
  const mismatches: CrossDocumentInconsistency[] = []
  
  // Extract dates from documents
  const dateRegex = /\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\b/g
  const doc1Dates = doc1.textContent!.match(dateRegex) || []
  const doc2Dates = doc2.textContent!.match(dateRegex) || []
  
  if (doc1Dates.length > 0 && doc2Dates.length > 0) {
    // Check for conflicting dates for similar events
    const hasConflict = doc1Dates.some(date1 => 
      doc2Dates.some(date2 => date1 !== date2)
    )
    
    if (hasConflict) {
      mismatches.push({
        type: 'timeline_mismatch',
        description: `Documents contain different dates for related events`,
        involvedDocuments: [
          {
            id: doc1.id,
            statement: `Contains dates: ${doc1Dates.join(', ')}`,
            context: doc1.fileName
          },
          {
            id: doc2.id,
            statement: `Contains dates: ${doc2Dates.join(', ')}`,
            context: doc2.fileName
          }
        ],
        severity: 'MODERATE',
        confidence: 0.7
      })
    }
  }
  
  return mismatches
}

/**
 * Find status inconsistencies between documents
 */
function findStatusInconsistencies(doc1: Document, doc2: Document): CrossDocumentInconsistency[] {
  const inconsistencies: CrossDocumentInconsistency[] = []
  
  // Check for inconsistent categorization or inclusion status
  if (doc1.category !== doc2.category && 
      (doc1.children.some(child => doc2.children.includes(child)) ||
       doc1.laws.some(law => doc2.laws.includes(law)))) {
    
    inconsistencies.push({
      type: 'status_inconsistency',
      description: `Related documents have inconsistent categories`,
      involvedDocuments: [
        {
          id: doc1.id,
          statement: `Category: ${doc1.category}, Include: ${doc1.include}`,
          context: doc1.fileName
        },
        {
          id: doc2.id,
          statement: `Category: ${doc2.category}, Include: ${doc2.include}`,
          context: doc2.fileName
        }
      ],
      severity: 'MODERATE',
      confidence: 0.75
    })
  }
  
  return inconsistencies
}

/**
 * Build manipulation timeline
 */
function buildManipulationTimeline(documents: Document[], versions: DocumentVersion[]): ManipulationEvent[] {
  const events: ManipulationEvent[] = []
  
  // Add creation events
  documents.forEach(doc => {
    events.push({
      timestamp: doc.uploadedAt,
      type: 'creation',
      documents: [doc.id],
      description: `Document created: ${doc.fileName}`,
      indicators: [],
      severity: 'LOW'
    })
  })
  
  // Add modification events
  versions.forEach(version => {
    if (version.changeType === 'edited') {
      events.push({
        timestamp: version.changedAt,
        type: 'modification',
        documents: [version.documentId],
        description: `Document modified: ${version.changeNotes || 'No notes provided'}`,
        indicators: version.changeNotes ? [version.changeNotes] : [],
        severity: 'MODERATE'
      })
    }
  })
  
  // Sort by timestamp
  events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
  
  return events
}

/**
 * Calculate overall risk assessment
 */
function calculateOverallRisk(
  systematicPatterns: SystematicPattern[],
  temporalAnomalies: TemporalAnomaly[],
  namePatterns: NameAlterationPattern[],
  suppressionPatterns: EvidenceSuppressionPattern[],
  inconsistencies: CrossDocumentInconsistency[]
): 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL' {
  let riskScore = 0
  
  // Systematic patterns contribute most to risk
  systematicPatterns.forEach(pattern => {
    switch (pattern.severity) {
      case 'CRITICAL': riskScore += 4; break
      case 'HIGH': riskScore += 3; break
      case 'MODERATE': riskScore += 2; break
      case 'LOW': riskScore += 1; break
    }
  })
  
  // Temporal anomalies are strong indicators
  temporalAnomalies.forEach(anomaly => {
    switch (anomaly.severity) {
      case 'CRITICAL': riskScore += 3; break
      case 'HIGH': riskScore += 2; break
      case 'MODERATE': riskScore += 1; break
      case 'LOW': riskScore += 0.5; break
    }
  })
  
  // Name alterations and suppression patterns
  riskScore += namePatterns.length * 1.5
  riskScore += suppressionPatterns.length * 2
  
  // Cross-document inconsistencies
  inconsistencies.forEach(inconsistency => {
    switch (inconsistency.severity) {
      case 'CRITICAL': riskScore += 2; break
      case 'HIGH': riskScore += 1.5; break
      case 'MODERATE': riskScore += 1; break
      case 'LOW': riskScore += 0.5; break
    }
  })
  
  // Determine risk level based on score
  if (riskScore >= 10) return 'CRITICAL'
  if (riskScore >= 6) return 'HIGH'
  if (riskScore >= 3) return 'MODERATE'
  return 'LOW'
}

/**
 * Calculate confidence score
 */
function calculateConfidence(
  systematicPatterns: SystematicPattern[],
  inconsistencies: CrossDocumentInconsistency[]
): number {
  if (systematicPatterns.length === 0 && inconsistencies.length === 0) {
    return 0.5 // Low confidence when no patterns detected
  }
  
  const patternConfidences = systematicPatterns.map(p => p.confidence)
  const inconsistencyConfidences = inconsistencies.map(i => i.confidence)
  
  const allConfidences = [...patternConfidences, ...inconsistencyConfidences]
  const averageConfidence = allConfidences.reduce((sum, conf) => sum + conf, 0) / allConfidences.length
  
  // Boost confidence if multiple patterns detected
  const patternBonus = Math.min(0.2, systematicPatterns.length * 0.05)
  
  return Math.min(0.95, averageConfidence + patternBonus)
}

/**
 * Assess legal implications
 */
function assessLegalImplications(
  systematicPatterns: SystematicPattern[],
  suppressionPatterns: EvidenceSuppressionPattern[],
  inconsistencies: CrossDocumentInconsistency[]
): LegalImplication[] {
  const implications: LegalImplication[] = []
  
  // Brady violations
  const bradyIndicators = systematicPatterns.filter(p => 
    p.legalImplications.some(impl => impl.includes('Brady'))
  ).length + suppressionPatterns.filter(p => 
    p.legalImplications.some(impl => impl.includes('Brady'))
  ).length
  
  if (bradyIndicators > 0) {
    implications.push({
      violation: 'Brady v. Maryland Violation',
      description: 'Systematic suppression of exculpatory evidence detected',
      affectedRights: ['Due Process', 'Fair Trial', 'Access to Evidence'],
      precedents: ['Brady v. Maryland (1963)', 'Giglio v. United States (1972)'],
      severity: bradyIndicators >= 3 ? 'CRITICAL' : 'HIGH'
    })
  }
  
  // Evidence tampering
  const tamperingIndicators = systematicPatterns.filter(p => 
    p.type === 'coordinated_alterations' || p.type === 'evidence_suppression'
  ).length
  
  if (tamperingIndicators > 0) {
    implications.push({
      violation: 'Evidence Tampering (18 U.S.C. § 1519)',
      description: 'Coordinated alteration and destruction of evidence',
      affectedRights: ['Due Process', 'Fair Trial', 'Judicial Integrity'],
      precedents: ['Sarbanes-Oxley Act of 2002', '18 U.S.C. § 1519'],
      severity: tamperingIndicators >= 2 ? 'CRITICAL' : 'HIGH'
    })
  }
  
  // Due process violations
  const dueProcessIndicators = inconsistencies.filter(i => 
    i.type === 'factual_contradiction' || i.type === 'timeline_mismatch'
  ).length
  
  if (dueProcessIndicators >= 3) {
    implications.push({
      violation: 'Due Process Violation (14th Amendment)',
      description: 'Systematic inconsistencies undermining procedural fairness',
      affectedRights: ['Due Process', 'Equal Protection', 'Fundamental Fairness'],
      precedents: ['Mathews v. Eldridge (1976)', 'Goldberg v. Kelly (1970)'],
      severity: dueProcessIndicators >= 5 ? 'HIGH' : 'MODERATE'
    })
  }
  
  return implications
}

/**
 * Generate recommendations
 */
function generateRecommendations(
  overallRisk: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL',
  systematicPatterns: SystematicPattern[],
  legalImplications: LegalImplication[]
): string[] {
  const recommendations: string[] = []
  
  if (overallRisk === 'CRITICAL') {
    recommendations.push('IMMEDIATE ACTION REQUIRED: Halt all current proceedings and initiate federal investigation')
    recommendations.push('Preserve all digital evidence and metadata for forensic examination')
    recommendations.push('Notify appropriate oversight agencies (FBI, DOJ Civil Rights Division)')
    recommendations.push('Implement emergency protective measures for affected parties')
  }
  
  if (overallRisk === 'HIGH' || overallRisk === 'CRITICAL') {
    recommendations.push('Conduct comprehensive audit of all case documentation')
    recommendations.push('Interview all personnel involved in document creation and modification')
    recommendations.push('Engage independent forensic document examination services')
    recommendations.push('Review administrative policies and procedures for violations')
  }
  
  if (systematicPatterns.some(p => p.type === 'evidence_suppression')) {
    recommendations.push('Review all Brady material disclosures for completeness')
    recommendations.push('Examine prosecutorial conduct for ethical violations')
    recommendations.push('Consider reversal of any convictions based on tainted evidence')
  }
  
  if (systematicPatterns.some(p => p.type === 'witness_manipulation')) {
    recommendations.push('Investigate potential witness tampering violations')
    recommendations.push('Review witness interview protocols and procedures')
    recommendations.push('Consider witness protection measures if appropriate')
  }
  
  if (legalImplications.some(impl => impl.severity === 'CRITICAL')) {
    recommendations.push('Refer findings to appropriate bar associations for professional conduct review')
    recommendations.push('Consider civil rights investigation under 42 U.S.C. § 1983')
    recommendations.push('Evaluate institutional reforms to prevent future violations')
  }
  
  // Always include these baseline recommendations
  recommendations.push('Document all findings in formal report for legal proceedings')
  recommendations.push('Maintain chain of custody for all evidence')
  recommendations.push('Consider appointment of special prosecutor for independent review')
  
  return recommendations
}

/**
 * Compile detailed findings
 */
function compileDetailedFindings(
  systematicPatterns: SystematicPattern[],
  inconsistencies: CrossDocumentInconsistency[],
  suppressionPatterns: EvidenceSuppressionPattern[]
): DetailedFinding[] {
  const findings: DetailedFinding[] = []
  
  // Convert systematic patterns to detailed findings
  systematicPatterns.forEach(pattern => {
    findings.push({
      category: 'Systematic Pattern',
      description: pattern.description,
      evidence: pattern.evidence.map(e => e.description),
      affectedDocuments: pattern.affectedDocuments,
      confidence: pattern.confidence,
      legalRelevance: pattern.legalImplications.join('; '),
      recommendedAction: pattern.severity === 'CRITICAL' ? 
        'Immediate investigation required' : 
        'Further examination recommended'
    })
  })
  
  // Convert inconsistencies to detailed findings
  inconsistencies.forEach(inconsistency => {
    findings.push({
      category: 'Document Inconsistency',
      description: inconsistency.description,
      evidence: inconsistency.involvedDocuments.map(doc => doc.statement),
      affectedDocuments: inconsistency.involvedDocuments.map(doc => doc.id),
      confidence: inconsistency.confidence,
      legalRelevance: 'Potential impeachment evidence; undermines document reliability',
      recommendedAction: inconsistency.severity === 'HIGH' ? 
        'Detailed investigation required' : 
        'Manual review recommended'
    })
  })
  
  // Convert suppression patterns to detailed findings
  suppressionPatterns.forEach(pattern => {
    findings.push({
      category: 'Evidence Suppression',
      description: pattern.description,
      evidence: pattern.affectedEvidence,
      affectedDocuments: pattern.documents,
      confidence: 0.8, // Default confidence for suppression patterns
      legalRelevance: pattern.legalImplications.join('; '),
      recommendedAction: pattern.severity === 'HIGH' ? 
        'Brady review required' : 
        'Disclosure assessment needed'
    })
  })
  
  return findings
}