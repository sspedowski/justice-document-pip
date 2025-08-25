/**
 * Advanced Evidence Tampering Detection System
 * Enhanced pattern analysis for detecting document alterations and evidence manipulation
 */

export interface EvidencePattern {
  type: 'signature_mismatch' | 'content_insertion' | 'redaction_traces' | 'timestamp_manipulation' | 'cross_reference_break'
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  evidence: string[]
  confidence: number
  location: string
  documentIds: string[]
}

export interface DocumentFingerprint {
  keyPhrases: string[]
  structuralMarkers: string[]
  nameFrequencies: Record<string, number>
  evidenceNumbers: string[]
  timestamps: string[]
  contentHash: string
  paragraphCount: number
  sentencePatterns: string[]
}

export interface TamperingReport {
  analysisId: string
  timestamp: string
  documentsAnalyzed: number
  patternsDetected: EvidencePattern[]
  riskLevel: 'minimal' | 'low' | 'moderate' | 'high' | 'critical'
  confidenceScore: number
  recommendations: string[]
  executiveSummary: string
}

// Critical evidence terms that should maintain consistency
const CRITICAL_EVIDENCE_TERMS = [
  'incident report', 'case number', 'badge number', 'evidence tag',
  'witness statement', 'interview transcript', 'medical examination',
  'forensic analysis', 'chain of custody', 'sworn statement',
  'affidavit', 'deposition', 'court order', 'warrant'
]

// Names that require special monitoring (from your justice system)
const MONITORED_NAMES = [
  'Noel', 'Andy Maki', 'Banister', 'Russell', 'Verde', 
  'Josh', 'Jace', 'Nicholas', 'John', 'Peyton', 'Owen'
]

// Status/outcome terms that shouldn't change unexpectedly
const STATUS_TERMS = [
  'substantiated', 'unsubstantiated', 'inconclusive', 'founded', 'unfounded',
  'guilty', 'not guilty', 'pending', 'closed', 'ongoing', 'dismissed'
]

/**
 * Extract structural fingerprint from document content
 */
function extractDocumentFingerprint(text: string, title: string): DocumentFingerprint {
  const lines = text.split('\n').filter(line => line.trim().length > 0)
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10)
  
  // Extract key phrases (important multi-word terms)
  const keyPhrases = extractKeyPhrases(text)
  
  // Extract structural markers (headers, labels, etc.)
  const structuralMarkers = lines
    .filter(line => line.match(/^[A-Z\s]+:/) || line.match(/^\d+\./) || line.match(/^[IVX]+\./))
    .map(line => line.trim())
  
  // Count name frequencies
  const nameFrequencies: Record<string, number> = {}
  MONITORED_NAMES.forEach(name => {
    const regex = new RegExp(`\\b${name}\\b`, 'gi')
    const matches = text.match(regex)
    nameFrequencies[name] = matches ? matches.length : 0
  })
  
  // Extract evidence numbers and identifiers
  const evidenceNumbers = extractEvidenceIdentifiers(text)
  
  // Extract timestamps and dates
  const timestamps = extractTimestamps(text)
  
  // Create content hash (simple checksum for comparison)
  const contentHash = createSimpleHash(text.replace(/\s+/g, ' ').toLowerCase())
  
  // Extract sentence patterns for style analysis
  const sentencePatterns = sentences.slice(0, 10).map(s => 
    s.trim().replace(/[^a-zA-Z\s]/g, '').substring(0, 50)
  )
  
  return {
    keyPhrases,
    structuralMarkers,
    nameFrequencies,
    evidenceNumbers,
    timestamps,
    contentHash,
    paragraphCount: text.split('\n\n').length,
    sentencePatterns
  }
}

/**
 * Extract key phrases that might be important for consistency
 */
function extractKeyPhrases(text: string): string[] {
  const phrases: string[] = []
  
  // Look for critical evidence terms
  CRITICAL_EVIDENCE_TERMS.forEach(term => {
    const regex = new RegExp(term, 'gi')
    if (regex.test(text)) {
      phrases.push(term)
    }
  })
  
  // Extract case-specific phrases (phrases that appear multiple times)
  const words = text.toLowerCase().split(/\s+/)
  const phraseMap: Record<string, number> = {}
  
  for (let i = 0; i < words.length - 1; i++) {
    const twoWord = `${words[i]} ${words[i + 1]}`
    const threeWord = i < words.length - 2 ? `${words[i]} ${words[i + 1]} ${words[i + 2]}` : ''
    
    if (twoWord.match(/^[a-z]+ [a-z]+$/)) {
      phraseMap[twoWord] = (phraseMap[twoWord] || 0) + 1
    }
    if (threeWord && threeWord.match(/^[a-z]+ [a-z]+ [a-z]+$/)) {
      phraseMap[threeWord] = (phraseMap[threeWord] || 0) + 1
    }
  }
  
  // Add phrases that appear 3+ times
  Object.entries(phraseMap)
    .filter(([phrase, count]) => count >= 3 && phrase.length > 6)
    .forEach(([phrase]) => phrases.push(phrase))
  
  return [...new Set(phrases)]
}

/**
 * Extract evidence identifiers, case numbers, etc.
 */
function extractEvidenceIdentifiers(text: string): string[] {
  const identifiers: string[] = []
  
  // Case numbers, evidence tags, badge numbers
  const patterns = [
    /case\s*#?\s*(\d+[-\d]*)/gi,
    /evidence\s*#?\s*([A-Z0-9\-]+)/gi,
    /badge\s*#?\s*(\d+)/gi,
    /report\s*#?\s*([A-Z0-9\-]+)/gi,
    /file\s*#?\s*([A-Z0-9\-]+)/gi,
    /\b([A-Z]{2,3}-\d{2,6})\b/g, // Alphanumeric codes
  ]
  
  patterns.forEach(pattern => {
    const matches = text.matchAll(pattern)
    for (const match of matches) {
      if (match[1]) {
        identifiers.push(match[1])
      }
    }
  })
  
  return [...new Set(identifiers)]
}

/**
 * Extract timestamps and dates with context
 */
function extractTimestamps(text: string): string[] {
  const timestamps: string[] = []
  
  const patterns = [
    /\b(\d{1,2}\/\d{1,2}\/\d{2,4})\b/g, // MM/DD/YYYY
    /\b(\d{1,2}-\d{1,2}-\d{2,4})\b/g,   // MM-DD-YYYY
    /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}\b/gi,
    /\b(\d{1,2}:\d{2}\s*(?:AM|PM))\b/gi, // Time
  ]
  
  patterns.forEach(pattern => {
    const matches = text.matchAll(pattern)
    for (const match of matches) {
      timestamps.push(match[0])
    }
  })
  
  return [...new Set(timestamps)]
}

/**
 * Simple hash function for content comparison
 */
function createSimpleHash(text: string): string {
  let hash = 0
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }
  return hash.toString(16)
}

/**
 * Compare document fingerprints for tampering indicators
 */
function compareFingerprints(fp1: DocumentFingerprint, fp2: DocumentFingerprint, doc1Title: string, doc2Title: string): EvidencePattern[] {
  const patterns: EvidencePattern[] = []
  
  // Name frequency changes (critical for witness testimony)
  Object.keys(fp1.nameFrequencies).forEach(name => {
    const count1 = fp1.nameFrequencies[name] || 0
    const count2 = fp2.nameFrequencies[name] || 0
    const diff = Math.abs(count1 - count2)
    
    if (diff > 0) {
      const severity = diff > 3 ? 'critical' : diff > 1 ? 'high' : 'medium'
      patterns.push({
        type: 'content_insertion',
        severity,
        description: `Name frequency alteration detected for "${name}"`,
        evidence: [
          `${doc1Title}: ${count1} mentions`,
          `${doc2Title}: ${count2} mentions`,
          `Difference: ${diff} mentions`
        ],
        confidence: Math.min(95, 60 + (diff * 15)),
        location: 'Name Analysis',
        documentIds: ['comparison']
      })
    }
  })
  
  // Evidence identifier changes
  const ids1 = new Set(fp1.evidenceNumbers)
  const ids2 = new Set(fp2.evidenceNumbers)
  const addedIds = [...ids2].filter(id => !ids1.has(id))
  const removedIds = [...ids1].filter(id => !ids2.has(id))
  
  if (addedIds.length > 0 || removedIds.length > 0) {
    patterns.push({
      type: 'cross_reference_break',
      severity: 'critical',
      description: 'Evidence identifier inconsistencies detected',
      evidence: [
        `Added identifiers: ${addedIds.join(', ') || 'none'}`,
        `Removed identifiers: ${removedIds.join(', ') || 'none'}`
      ],
      confidence: 90,
      location: 'Evidence ID Analysis',
      documentIds: ['comparison']
    })
  }
  
  // Structural changes
  const struct1 = new Set(fp1.structuralMarkers)
  const struct2 = new Set(fp2.structuralMarkers)
  const structDiff = [...struct1].filter(s => !struct2.has(s)).length + 
                    [...struct2].filter(s => !struct1.has(s)).length
  
  if (structDiff > 2) {
    patterns.push({
      type: 'signature_mismatch',
      severity: structDiff > 5 ? 'high' : 'medium',
      description: 'Document structure alterations detected',
      evidence: [
        `Structural differences: ${structDiff} elements`,
        `Original markers: ${fp1.structuralMarkers.length}`,
        `Current markers: ${fp2.structuralMarkers.length}`
      ],
      confidence: Math.min(85, 50 + (structDiff * 5)),
      location: 'Structural Analysis',
      documentIds: ['comparison']
    })
  }
  
  // Content hash mismatch (overall content change)
  if (fp1.contentHash !== fp2.contentHash) {
    patterns.push({
      type: 'content_insertion',
      severity: 'medium',
      description: 'Overall content modifications detected',
      evidence: [
        `Content fingerprint changed`,
        `Original hash: ${fp1.contentHash}`,
        `Current hash: ${fp2.contentHash}`
      ],
      confidence: 70,
      location: 'Content Hash Analysis',
      documentIds: ['comparison']
    })
  }
  
  return patterns
}

/**
 * Advanced analysis for single document integrity
 */
function analyzeSingleDocumentIntegrity(text: string, title: string): EvidencePattern[] {
  const patterns: EvidencePattern[] = []
  
  // Look for redaction traces
  const redactionIndicators = [
    /\[REDACTED\]/gi,
    /\*\*\*+/g,
    /___+/g,
    /\[REMOVED\]/gi,
    /\[DELETED\]/gi,
    /\[\s*\]/g
  ]
  
  redactionIndicators.forEach((pattern, index) => {
    const matches = text.match(pattern)
    if (matches && matches.length > 0) {
      patterns.push({
        type: 'redaction_traces',
        severity: 'medium',
        description: `Redaction indicators found in document`,
        evidence: [
          `Found ${matches.length} redaction marker(s)`,
          `Pattern type: ${['REDACTED tags', 'asterisk blocks', 'underscore blocks', 'REMOVED tags', 'DELETED tags', 'empty brackets'][index]}`,
          `Sample: ${matches[0]}`
        ],
        confidence: 85,
        location: 'Redaction Analysis',
        documentIds: [title]
      })
    }
  })
  
  // Check for inconsistent formatting that might indicate insertion
  const lines = text.split('\n')
  let inconsistentFormatting = 0
  let lastIndentation = 0
  
  lines.forEach(line => {
    const indentation = line.match(/^\s*/)?.[0].length || 0
    const hasNumbers = /\d/.test(line)
    const hasUppercase = /[A-Z]/.test(line)
    
    if (Math.abs(indentation - lastIndentation) > 8) {
      inconsistentFormatting++
    }
    lastIndentation = indentation
  })
  
  if (inconsistentFormatting > 5) {
    patterns.push({
      type: 'signature_mismatch',
      severity: 'low',
      description: 'Inconsistent formatting detected - possible content insertion',
      evidence: [
        `${inconsistentFormatting} formatting inconsistencies found`,
        `May indicate inserted or modified content`
      ],
      confidence: 60,
      location: 'Formatting Analysis',
      documentIds: [title]
    })
  }
  
  // Check for timestamp inconsistencies
  const timestamps = extractTimestamps(text)
  const dates = timestamps.filter(t => t.match(/\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/))
  
  if (dates.length > 1) {
    const uniqueDates = [...new Set(dates)]
    if (uniqueDates.length > 3) {
      patterns.push({
        type: 'timestamp_manipulation',
        severity: 'medium',
        description: 'Multiple inconsistent dates found in single document',
        evidence: [
          `Found ${dates.length} date references`,
          `${uniqueDates.length} unique dates`,
          `Dates: ${uniqueDates.slice(0, 5).join(', ')}`
        ],
        confidence: 75,
        location: 'Timestamp Analysis',
        documentIds: [title]
      })
    }
  }
  
  return patterns
}

/**
 * Main advanced tampering analysis function
 */
export function analyzeAdvancedTampering(documents: Array<{
  id: string
  title: string
  textContent?: string
  uploadedAt: string
  lastModified: string
  currentVersion: number
}>): TamperingReport {
  const analysisId = `tampering-${Date.now()}`
  const timestamp = new Date().toISOString()
  const allPatterns: EvidencePattern[] = []
  
  // Analyze each document individually
  documents.forEach(doc => {
    if (doc.textContent) {
      const singleDocPatterns = analyzeSingleDocumentIntegrity(doc.textContent, doc.title)
      allPatterns.push(...singleDocPatterns)
    }
  })
  
  // Group documents by date for comparative analysis
  const dateGroups: Record<string, typeof documents> = {}
  documents.forEach(doc => {
    const date = doc.uploadedAt.split('T')[0] // Get date part
    if (!dateGroups[date]) {
      dateGroups[date] = []
    }
    dateGroups[date].push(doc)
  })
  
  // Compare documents within each date group
  Object.values(dateGroups).forEach(group => {
    if (group.length > 1) {
      for (let i = 0; i < group.length; i++) {
        for (let j = i + 1; j < group.length; j++) {
          const doc1 = group[i]
          const doc2 = group[j]
          
          if (doc1.textContent && doc2.textContent) {
            const fp1 = extractDocumentFingerprint(doc1.textContent, doc1.title)
            const fp2 = extractDocumentFingerprint(doc2.textContent, doc2.title)
            
            const comparisonPatterns = compareFingerprints(fp1, fp2, doc1.title, doc2.title)
            allPatterns.push(...comparisonPatterns)
          }
        }
      }
    }
  })
  
  // Calculate overall risk and confidence
  const criticalCount = allPatterns.filter(p => p.severity === 'critical').length
  const highCount = allPatterns.filter(p => p.severity === 'high').length
  const mediumCount = allPatterns.filter(p => p.severity === 'medium').length
  
  let riskLevel: TamperingReport['riskLevel'] = 'minimal'
  if (criticalCount > 0) riskLevel = 'critical'
  else if (highCount > 2 || (highCount > 0 && mediumCount > 3)) riskLevel = 'high'
  else if (highCount > 0 || mediumCount > 2) riskLevel = 'moderate'
  else if (mediumCount > 0) riskLevel = 'low'
  
  const avgConfidence = allPatterns.length > 0 
    ? allPatterns.reduce((sum, p) => sum + p.confidence, 0) / allPatterns.length 
    : 0
  
  // Generate recommendations
  const recommendations: string[] = []
  if (criticalCount > 0) {
    recommendations.push('IMMEDIATE: Preserve all document versions and initiate forensic investigation')
    recommendations.push('Contact legal counsel regarding potential evidence tampering')
    recommendations.push('Implement enhanced document security and access logging')
  }
  if (highCount > 0) {
    recommendations.push('Conduct detailed review of flagged documents with subject matter experts')
    recommendations.push('Cross-reference findings with original source documents')
  }
  if (allPatterns.length > 0) {
    recommendations.push('Implement regular automated tampering detection scans')
    recommendations.push('Establish clear document handling and modification protocols')
  } else {
    recommendations.push('Continue periodic integrity monitoring')
    recommendations.push('Maintain current document security practices')
  }
  
  // Create executive summary
  let executiveSummary = ''
  if (riskLevel === 'critical') {
    executiveSummary = `🚨 CRITICAL ALERT: Advanced analysis detected ${criticalCount} critical and ${highCount} high-severity tampering indicators across ${documents.length} documents. Evidence manipulation is likely present and requires immediate investigation.`
  } else if (riskLevel === 'high') {
    executiveSummary = `⚠️ HIGH RISK: Analysis identified ${highCount} high-severity indicators suggesting possible document alterations. Professional review recommended.`
  } else if (riskLevel === 'moderate') {
    executiveSummary = `⚠️ MODERATE RISK: ${allPatterns.length} potential indicators detected. While not immediately critical, patterns warrant closer examination.`
  } else if (riskLevel === 'low') {
    executiveSummary = `ℹ️ LOW RISK: Minimal indicators found. Documents appear largely intact but continue monitoring.`
  } else {
    executiveSummary = `✅ MINIMAL RISK: No significant tampering indicators detected. Document integrity appears sound.`
  }
  
  return {
    analysisId,
    timestamp,
    documentsAnalyzed: documents.length,
    patternsDetected: allPatterns.sort((a, b) => {
      const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 }
      return severityOrder[b.severity] - severityOrder[a.severity]
    }),
    riskLevel,
    confidenceScore: Math.round(avgConfidence),
    recommendations,
    executiveSummary
  }
}

/**
 * Export analysis results for oversight agencies
 */
export function exportForensicReport(report: TamperingReport): {
  executiveReport: string
  technicalReport: string
  evidenceLog: string
} {
  const timestamp = new Date().toLocaleString()
  
  const executiveReport = `
EXECUTIVE SUMMARY - EVIDENCE INTEGRITY ANALYSIS
Generated: ${timestamp}
Analysis ID: ${report.analysisId}

OVERALL ASSESSMENT: ${report.riskLevel.toUpperCase()} RISK
Documents Analyzed: ${report.documentsAnalyzed}
Patterns Detected: ${report.patternsDetected.length}
Confidence Score: ${report.confidenceScore}%

${report.executiveSummary}

IMMEDIATE ACTIONS:
${report.recommendations.slice(0, 3).map(r => `• ${r}`).join('\n')}

This analysis uses advanced pattern detection algorithms to identify potential evidence tampering.
Results should be reviewed by qualified forensic analysts and legal professionals.
`.trim()

  const technicalReport = `
TECHNICAL ANALYSIS REPORT - DOCUMENT INTEGRITY VERIFICATION
Generated: ${timestamp}
Analysis ID: ${report.analysisId}

METHODOLOGY:
- Structural fingerprinting and comparison analysis
- Name frequency deviation detection  
- Evidence identifier consistency verification
- Temporal analysis and timeline verification
- Content insertion and redaction trace detection

DETAILED FINDINGS:
${report.patternsDetected.map((pattern, i) => `
${i + 1}. ${pattern.type.toUpperCase().replace('_', ' ')} (${pattern.severity.toUpperCase()})
   Description: ${pattern.description}
   Confidence: ${pattern.confidence}%
   Location: ${pattern.location}
   Evidence:
${pattern.evidence.map(e => `   - ${e}`).join('\n')}
`).join('')}

RECOMMENDATIONS:
${report.recommendations.map(r => `• ${r}`).join('\n')}
`.trim()

  const evidenceLog = `
EVIDENCE LOG - TAMPERING DETECTION ANALYSIS
Timestamp,Pattern Type,Severity,Confidence,Description,Evidence Count
${report.patternsDetected.map(p => 
  `${report.timestamp},${p.type},${p.severity},${p.confidence}%,"${p.description}",${p.evidence.length}`
).join('\n')}
`.trim()

  return {
    executiveReport,
    technicalReport,  
    evidenceLog
  }
}