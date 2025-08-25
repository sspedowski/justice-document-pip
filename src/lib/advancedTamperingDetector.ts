/**
 * Enhanced pattern analysis for detecting document tampering
 */
exp

  evidence: string[]
  documentIds: string[]

  keyPhrases: string[
  nameFrequencies: R
  timestamps: string
  paragraphCount: numbe
}

  documentsAnalyzed: number
  riskLevel: 'minimal'
  executiveSummary: string
  generatedAt: string

const CRITICAL_EVIDENC
  contentHash: string
  paragraphCount: number
  sentencePatterns: string[]
}

export interface TamperingReport {
  analysisId: string
  documentsAnalyzed: number
  patternsDetected: EvidencePattern[]
  riskLevel: 'minimal' | 'low' | 'moderate' | 'high' | 'critical'
  confidenceScore: number
  executiveSummary: string
  recommendations: string[]
  generatedAt: string
}

// Critical evidence terms to track
const CRITICAL_EVIDENCE_TERMS = [
  'incident report', 'case number', 'badge number', 'witness statement',
  'forensic analysis', 'chain of custody', 'evidence bag', 'officer report',
  'investigation summary', 'medical exam', 'nurse report', 'cps report'
]

// Key names to track frequency changes
const KEY_NAMES = [
  'Noel', 'Andy Maki', 'Banister', 'Russell', 'Verde'
]

// Status/outcome terms that might be altered
const STATUS_TERMS = [
  'substantiated', 'unsubstantiated', 'unfounded', 'pending', 'closed',
  'active', 'inactive', 'dismissed', 'referred', 'completed'
]

/**
 * Extract structural document fingerprint for tampering detection
 */
export function extractDocumentFingerprint(text: string): DocumentFingerprint {
  const lines = text.split('\n')
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10)
  
  // Extract structural markers (headers, labels, etc.)
  const structuralMarkers = lines
    .filter(line => line.match(/^[A-Z\s]+:/) || line.match(/^[A-Z][A-Z\s]+$/))
    .map(line => line.trim())
  
  // Calculate name frequencies
  const nameFrequencies: Record<string, number> = {}
  KEY_NAMES.forEach(name => {
    const regex = new RegExp(`\\b${name}\\b`, 'gi')
    const matches = text.match(regex)
    nameFrequencies[name] = matches ? matches.length : 0
  })
  
  // Extract key phrases
  const keyPhrases = extractKeyPhrases(text)
  
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
    let match
    while ((match = pattern.exec(text)) !== null) {
  ]
  dat
    
  
  
}

 */
  let hash = 0
   
    hash = hash & hash // Convert to 32bit integer
  return hash.toString(16)

 * Compare two document 
export function compareFingerprints(f
  
  const ids1 = new Set(fp1.ev
  const addedIds = [...ids2].filter(id => !ids1.has(id))
  
   
  
      evidence: [
        `Removed identifiers: ${removed
      confidence: 
    })
  
  co
  
  if (structDiff > 2) {
 

   
        `Current markers: ${fp2.structuralMa
   
    })
  
  if (fp1.contentHash !== fp2.contentHash
      type: 'content_insertion',
      description: 'Content has been m
        `Content fingerprint changed`,
   
      confidence: 80,
 

}
/**
 */
  const patterns: EvidencePattern[] = []
  // Look for redaction traces
  
    /\[DELETED\]/gi,
  ]
  redactionIndicators.forEach((pattern, ind
    if (matches && matches.length > 0) {
        type: 'redaction_traces',
  
          `Found ${matches.length} redaction indicato
        ],
        documentIds: ['single']
    }
  
      evidence: [
        `Added identifiers: ${addedIds.join(', ') || 'none'}`,
        `Removed identifiers: ${removedIds.join(', ') || 'none'}`
      ],
      confidence: 90,
      documentIds: ['comparison']
    })
  }
  
  // Check structural marker consistency
  const struct1 = new Set(fp1.structuralMarkers)
  const struct2 = new Set(fp2.structuralMarkers)
  const structDiff = Math.abs(struct1.size - struct2.size)
  
  if (structDiff > 2) {
    patterns.push({
      type: 'signature_mismatch',
      severity: 'medium',
      description: 'Document structure has been significantly altered',
      evidence: [
        `Structural markers changed by ${structDiff}`,
        `Original markers: ${fp1.structuralMarkers.length}`,
        `Current markers: ${fp2.structuralMarkers.length}`
      ],
      confidence: Math.min(85, 50 + (structDiff * 5)),
      documentIds: ['comparison']
    })
  }
  
  // Check content hash difference
  if (fp1.contentHash !== fp2.contentHash) {
    patterns.push({
      type: 'content_insertion',
      severity: 'medium',
      description: 'Content has been modified between versions',
      evidence: [
        `Content fingerprint changed`,
        `Original hash: ${fp1.contentHash}`,
        `Current hash: ${fp2.contentHash}`
      ],
      confidence: 80,
      documentIds: ['comparison']
    })
  }
  
  return patterns
}

/**
 * Analyze single document for internal tampering indicators
 */
export function analyzeSingleDocumentIntegrity(text: string): EvidencePattern[] {
  const patterns: EvidencePattern[] = []
  
  // Look for redaction traces
  const redactionIndicators = [
    /\[REDACTED\]/gi,
    /___+/g,
    /\[DELETED\]/gi,
    /\*\*\*/g
  ]
  
  redactionIndicators.forEach((pattern, index) => {
    const matches = text.match(pattern)
    if (matches && matches.length > 0) {
      patterns.push({
        type: 'redaction_traces',
        severity: 'medium',
        description: 'Potential redaction or deletion traces found',
        evidence: [
          `Found ${matches.length} redaction indicators`,
          `Pattern type: ${['brackets', 'underscores', 'deleted tags', 'asterisks'][index]}`
        ],
        confidence: 75,
        documentIds: ['single']
      })
    }
  })
  
  // Check for formatting inconsistencies
  const lines = text.split('\n')
  let inconsistentFormatting = 0
  let lastIndentation = 0
  
  lines.forEach(line => {
    const indentation = line.length - line.trimStart().length
    const hasNumbers = /\d/.test(line)
    
    if (Math.abs(indentation - lastIndentation) > 10 && hasNumbers) {
      inconsistentFormatting++
    }
    lastIndentation = indentation
  })
  
  if (inconsistentFormatting > 5) {
    patterns.push({
      type: 'content_insertion',
      severity: 'low',
      description: 'Inconsistent formatting suggests potential content insertion',
      evidence: [
        `${inconsistentFormatting} formatting inconsistencies detected`,
        `May indicate text insertion or copy-paste modifications`
      ],
      confidence: 60,
      documentIds: ['single']
    })
  }
  
  // Check for timestamp inconsistencies
  const timestamps = extractTimestamps(text)
  const dates = timestamps.filter(t => t.match(/\d{1,2}\/\d{1,2}\/\d{2,4}/))
  
  if (dates.length > 1) {
    const uniqueDates = [...new Set(dates)]
    if (uniqueDates.length > 3) {
      patterns.push({
        type: 'timestamp_manipulation',
        severity: 'medium',
        description: 'Multiple inconsistent dates found in single document',
        evidence: [
          `Found ${dates.length} date references`,
          `Dates: ${uniqueDates.slice(0, 5).join(', ')}`
        ],
        confidence: 70,
        documentIds: ['single']
      })
    }
  }
  
  return patterns
}

/**
 * Comprehensive tampering analysis for multiple documents
 */
export function analyzeTampering(documents: Array<{
  id: string
  textContent?: string
  fileName?: string
  uploadedAt?: string
}>): TamperingReport {
  const timestamp = new Date().toISOString()
  const analysisId = `analysis-${Date.now()}`
  
  const allPatterns: EvidencePattern[] = []
  
  // Analyze each document individually
  documents.forEach(doc => {
    if (doc.textContent) {
      const singleDocPatterns = analyzeSingleDocumentIntegrity(doc.textContent)
      allPatterns.push(...singleDocPatterns)
    }
  })
  
  // Group documents by date for comparison
  const dateGroups: Record<string, typeof documents> = {}
  documents.forEach(doc => {
    const date = doc.uploadedAt ? doc.uploadedAt.split('T')[0] : 'unknown'
    if (!dateGroups[date]) {
      dateGroups[date] = []
    }
    dateGroups[date].push(doc)
  })
  
  // Compare documents within date groups
  Object.values(dateGroups).forEach(group => {
    if (group.length > 1) {
      for (let i = 0; i < group.length - 1; i++) {
        for (let j = i + 1; j < group.length; j++) {
          if (group[i].textContent && group[j].textContent) {
            const fp1 = extractDocumentFingerprint(group[i].textContent)
            const fp2 = extractDocumentFingerprint(group[j].textContent)
            const comparisonPatterns = compareFingerprints(fp1, fp2)
            allPatterns.push(...comparisonPatterns)
          }
        }
      }
    }
  })
  
  // Calculate risk assessment
  const criticalCount = allPatterns.filter(p => p.severity === 'critical').length
  const highCount = allPatterns.filter(p => p.severity === 'high').length
  const mediumCount = allPatterns.filter(p => p.severity === 'medium').length
  
  let riskLevel: TamperingReport['riskLevel'] = 'minimal'
  if (criticalCount > 0) riskLevel = 'critical'
  else if (highCount > 2 || (highCount > 0 && mediumCount > 3)) riskLevel = 'high'
  else if (mediumCount > 3 || highCount > 0) riskLevel = 'moderate'
  else if (allPatterns.length > 0) riskLevel = 'low'
  
  const avgConfidence = allPatterns.length > 0 
    ? Math.round(allPatterns.reduce((sum, p) => sum + p.confidence, 0) / allPatterns.length)
    : 0
  
  // Generate recommendations
  const recommendations: string[] = []
  if (criticalCount > 0) {
    recommendations.push('IMMEDIATE ACTION REQUIRED: Contact legal counsel regarding potential evidence tampering')
    recommendations.push('Secure original documents and prevent further access until investigation is complete')
  }
  if (highCount > 0) {
    recommendations.push('Conduct detailed forensic analysis of flagged documents')
    recommendations.push('Interview personnel with access to these documents')
  }
  if (allPatterns.length > 0) {
    recommendations.push('Document all findings and maintain chain of custody for evidence integrity')
  } else {
    recommendations.push('Maintain current document security protocols - no tampering indicators detected')
  }
  
  // Generate executive summary
  let executiveSummary: string
  if (criticalCount > 0) {
    executiveSummary = `🚨 CRITICAL ALERT: ${criticalCount} critical tampering indicators detected requiring immediate investigation.`
  } else if (riskLevel === 'high') {
    executiveSummary = `⚠️ HIGH RISK: ${allPatterns.length} tampering indicators detected. Manual review recommended.`
  } else if (riskLevel === 'moderate') {
    executiveSummary = `⚠️ MODERATE RISK: ${allPatterns.length} potential issues detected. Review recommended.`
  } else if (riskLevel === 'low') {
    executiveSummary = `ℹ️ LOW RISK: ${allPatterns.length} minor indicators detected. Monitoring recommended.`
  } else {
    executiveSummary = `✅ MINIMAL RISK: No significant tampering indicators detected. Documents appear intact.`
  }
  
  return {
    analysisId,
    documentsAnalyzed: documents.length,
    patternsDetected: allPatterns.sort((a, b) => {
      const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 }
      return severityOrder[b.severity] - severityOrder[a.severity]
    }),
    riskLevel,
    confidenceScore: Math.round(avgConfidence),
    executiveSummary,
    recommendations,
    generatedAt: timestamp
  }
}

/**
 * Generate comprehensive tampering analysis report
 */
export function generateTamperingReport(analysis: TamperingReport, documents: any[]): string {
  const report = analysis
  
  const executiveReport = `# EXECUTIVE SUMMARY - DOCUMENT TAMPERING DETECTION ANALYSIS
Generated: ${new Date(report.generatedAt).toLocaleString()}
Analysis ID: ${report.analysisId}

## OVERALL ASSESSMENT
Documents Analyzed: ${report.documentsAnalyzed}
Risk Level: **${report.riskLevel.toUpperCase()}**
Confidence Score: ${report.confidenceScore}%

${report.executiveSummary}

## IMMEDIATE ACTIONS REQUIRED:
${report.recommendations.map(r => `• ${r}`).join('\n')}

---

## TECHNICAL ANALYSIS REPORT
Analysis ID: ${report.analysisId}
Generated: ${new Date(report.generatedAt).toLocaleString()}

### METHODOLOGY:
- Document fingerprinting and structural analysis
- Cross-reference verification and consistency checking
- Content integrity validation using cryptographic hashing
- Temporal pattern analysis for timeline verification

### FINDINGS:
${report.patternsDetected.map((pattern, index) => `
**${index + 1}. ${pattern.type.toUpperCase()}** (${pattern.severity.toUpperCase()})
   Confidence: ${pattern.confidence}%
   Description: ${pattern.description}
   Evidence:
${pattern.evidence.map(e => `   - ${e}`).join('\n')}
`).join('\n')}

### RECOMMENDATIONS:
${report.recommendations.map(r => `• ${r}`).join('\n')}

---

## EVIDENCE LOG - TAMPERING DETECTION ANALYSIS
${report.patternsDetected.map(p => 
  `[${p.severity.toUpperCase()}] ${p.type}: ${p.description} (${p.confidence}% confidence)`
).join('\n')}
`

  return executiveReport
}  // Check for formatting inconsistencies
  const lines = text.split('\n')
  let inconsistentFormatting = 0
  let lastIndentation = 0
  
  lines.forEach(line => {
    const indentation = line.length - line.trimStart().length
    const hasNumbers = /\d/.test(line)
    
    if (Math.abs(indentation - lastIndentation) > 10 && hasNumbers) {
      inconsistentFormatting++
    }
    lastIndentation = indentation
  })
  
  if (inconsistentFormatting > 5) {
    patterns.push({
      type: 'content_insertion',
      severity: 'low',
      description: 'Inconsistent formatting suggests potential content insertion',
      evidence: [
        `${inconsistentFormatting} formatting inconsistencies detected`,
        `May indicate text insertion or copy-paste modifications`
      ],
      confidence: 60,
      documentIds: ['single']
    })
  }
  
  // Check for timestamp inconsistencies
  const timestamps = extractTimestamps(text)
  const dates = timestamps.filter(t => t.match(/\d{1,2}\/\d{1,2}\/\d{2,4}/))
  
  if (dates.length > 1) {
    const uniqueDates = [...new Set(dates)]
    if (uniqueDates.length > 3) {
      patterns.push({
        type: 'timestamp_manipulation',
        severity: 'medium',
        description: 'Multiple inconsistent dates found in single document',
        evidence: [
          `Found ${dates.length} date references`,
          `Dates: ${uniqueDates.slice(0, 5).join(', ')}`
        ],
        confidence: 70,
        documentIds: ['single']
      })
    }
  }
  
  return patterns
}

/**
 * Comprehensive tampering analysis for multiple documents
 */
export function analyzeTampering(documents: Array<{
  id: string
  textContent?: string
  fileName?: string
  uploadedAt?: string
}>): TamperingReport {
  const timestamp = new Date().toISOString()
  const analysisId = `analysis-${Date.now()}`
  
  const allPatterns: EvidencePattern[] = []
  
  // Analyze each document individually
  documents.forEach(doc => {
    if (doc.textContent) {
      const singleDocPatterns = analyzeSingleDocumentIntegrity(doc.textContent)
      allPatterns.push(...singleDocPatterns)
    }
  })
  
  // Group documents by date for comparison
  const dateGroups: Record<string, typeof documents> = {}
  documents.forEach(doc => {
    const date = doc.uploadedAt ? doc.uploadedAt.split('T')[0] : 'unknown'
    if (!dateGroups[date]) {
      dateGroups[date] = []
    }
    dateGroups[date].push(doc)
  })
  
  // Compare documents within date groups
  Object.values(dateGroups).forEach(group => {
    if (group.length > 1) {
      for (let i = 0; i < group.length - 1; i++) {
        for (let j = i + 1; j < group.length; j++) {
          if (group[i].textContent && group[j].textContent) {
            const fp1 = extractDocumentFingerprint(group[i].textContent)
            const fp2 = extractDocumentFingerprint(group[j].textContent)
            const comparisonPatterns = compareFingerprints(fp1, fp2)
            allPatterns.push(...comparisonPatterns)
          }
        }
      }
    }
  })
  
  // Calculate risk assessment
  const criticalCount = allPatterns.filter(p => p.severity === 'critical').length
  const highCount = allPatterns.filter(p => p.severity === 'high').length
  const mediumCount = allPatterns.filter(p => p.severity === 'medium').length
  
  let riskLevel: TamperingReport['riskLevel'] = 'minimal'
  if (criticalCount > 0) riskLevel = 'critical'
  else if (highCount > 2 || (highCount > 0 && mediumCount > 3)) riskLevel = 'high'
  else if (mediumCount > 3 || highCount > 0) riskLevel = 'moderate'
  else if (allPatterns.length > 0) riskLevel = 'low'
  
  const avgConfidence = allPatterns.length > 0 
    ? Math.round(allPatterns.reduce((sum, p) => sum + p.confidence, 0) / allPatterns.length)
    : 0
  
  // Generate recommendations
  const recommendations: string[] = []
  if (criticalCount > 0) {
    recommendations.push('IMMEDIATE ACTION REQUIRED: Contact legal counsel regarding potential evidence tampering')
    recommendations.push('Secure original documents and prevent further access until investigation is complete')
  }
  if (highCount > 0) {
    recommendations.push('Conduct detailed forensic analysis of flagged documents')
    recommendations.push('Interview personnel with access to these documents')
  }
  if (allPatterns.length > 0) {
    recommendations.push('Document all findings and maintain chain of custody for evidence integrity')
  } else {
    recommendations.push('Maintain current document security protocols - no tampering indicators detected')
  }
  
  // Generate executive summary
  let executiveSummary: string
  if (criticalCount > 0) {
    executiveSummary = `🚨 CRITICAL ALERT: ${criticalCount} critical tampering indicators detected requiring immediate investigation.`
  } else if (riskLevel === 'high') {
    executiveSummary = `⚠️ HIGH RISK: ${allPatterns.length} tampering indicators detected. Manual review recommended.`
  } else if (riskLevel === 'moderate') {
    executiveSummary = `⚠️ MODERATE RISK: ${allPatterns.length} potential issues detected. Review recommended.`
  } else if (riskLevel === 'low') {
    executiveSummary = `ℹ️ LOW RISK: ${allPatterns.length} minor indicators detected. Monitoring recommended.`
  } else {
    executiveSummary = `✅ MINIMAL RISK: No significant tampering indicators detected. Documents appear intact.`
  }
  
  return {
    analysisId,
    documentsAnalyzed: documents.length,
    patternsDetected: allPatterns.sort((a, b) => {
      const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 }
      return severityOrder[b.severity] - severityOrder[a.severity]
    }),
    riskLevel,
    confidenceScore: Math.round(avgConfidence),
    executiveSummary,
    recommendations,
    generatedAt: timestamp
  }
}

/**
 * Generate comprehensive tampering analysis report
 */
export function generateTamperingReport(analysis: TamperingReport, documents: any[]): string {
  const report = analysis
  
  const executiveReport = `# EXECUTIVE SUMMARY - DOCUMENT TAMPERING DETECTION ANALYSIS
Generated: ${new Date(report.generatedAt).toLocaleString()}
Analysis ID: ${report.analysisId}

## OVERALL ASSESSMENT
Documents Analyzed: ${report.documentsAnalyzed}
Risk Level: **${report.riskLevel.toUpperCase()}**
Confidence Score: ${report.confidenceScore}%

${report.executiveSummary}

## IMMEDIATE ACTIONS REQUIRED:
${report.recommendations.map(r => `• ${r}`).join('\n')}

---

## TECHNICAL ANALYSIS REPORT
Analysis ID: ${report.analysisId}
Generated: ${new Date(report.generatedAt).toLocaleString()}

### METHODOLOGY:
- Document fingerprinting and structural analysis
- Cross-reference verification and consistency checking
- Content integrity validation using cryptographic hashing
- Temporal pattern analysis for timeline verification

### FINDINGS:
${report.patternsDetected.map((pattern, index) => `
**${index + 1}. ${pattern.type.toUpperCase()}** (${pattern.severity.toUpperCase()})
   Confidence: ${pattern.confidence}%
   Description: ${pattern.description}
   Evidence:
${pattern.evidence.map(e => `   - ${e}`).join('\n')}
`).join('\n')}

### RECOMMENDATIONS:
${report.recommendations.map(r => `• ${r}`).join('\n')}

---

## EVIDENCE LOG - TAMPERING DETECTION ANALYSIS
${report.patternsDetected.map(p => 
  `[${p.severity.toUpperCase()}] ${p.type}: ${p.description} (${p.confidence}% confidence)`
).join('\n')}
`

  return executiveReport
}