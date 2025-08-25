/**
 * Web-based document tampering detection system
 * Analyzes documents for potential alterations and inconsistencies
 */

export interface TamperingFlag {
  type: 'content_change' | 'metadata_inconsistency' | 'timeline_conflict' | 'name_discrepancy' | 'evidence_omission'
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  evidence: string[]
  affectedDocuments: string[]
  confidence: number
  location?: string
}

export interface TamperingAnalysisResult {
  documentId: string
  documentTitle: string
  flags: TamperingFlag[]
  overallRiskScore: number
  comparedWith: string[]
  summary: string
}

export interface DocumentForAnalysis {
  id: string
  fileName: string
  title: string
  description: string
  textContent?: string
  uploadedAt: string
  category: string
  children: string[]
  laws: string[]
  lastModified: string
  lastModifiedBy: string
  currentVersion: number
}

export interface DateGroupAnalysis {
  date: string
  documents: DocumentForAnalysis[]
  tamperingIndicators: TamperingFlag[]
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
}

// Target names to monitor for suspicious changes
const TARGET_NAMES = ['Noel', 'Andy Maki', 'Banister', 'Russell', 'Verde', 'Josh', 'Jace', 'Nicholas', 'John', 'Peyton', 'Owen']

// Key evidence terms that should remain consistent
const EVIDENCE_TERMS = [
  'incident', 'allegation', 'investigation', 'interview', 'statement', 'report',
  'abuse', 'neglect', 'injury', 'bruise', 'mark', 'witness', 'victim',
  'perpetrator', 'suspect', 'CPS', 'police', 'detective', 'officer',
  'medical', 'exam', 'evaluation', 'assessment', 'conclusion', 'finding'
]

/**
 * Extract potential dates from document text
 */
function extractDates(text: string): string[] {
  const datePatterns = [
    /\b(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})\b/g, // MM/DD/YYYY or M/D/YY
    /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),?\s+(\d{4})\b/gi, // Month DD, YYYY
    /\b(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})\b/g, // YYYY/MM/DD
  ]
  
  const dates: string[] = []
  const text_clean = text.toLowerCase()
  
  datePatterns.forEach(pattern => {
    const matches = text_clean.matchAll(pattern)
    for (const match of matches) {
      dates.push(match[0])
    }
  })
  
  return [...new Set(dates)]
}

/**
 * Extract numbers that might be evidence identifiers, ages, page numbers, etc.
 */
function extractNumbers(text: string): string[] {
  const numberPattern = /\b\d+(?:\.\d+)?\b/g
  return [...new Set((text.match(numberPattern) || []))]
}

/**
 * Count mentions of target names in text
 */
function countNameMentions(text: string): Record<string, number> {
  const counts: Record<string, number> = {}
  const textLower = text.toLowerCase()
  
  TARGET_NAMES.forEach(name => {
    const nameRegex = new RegExp(`\\b${name.toLowerCase()}\\b`, 'g')
    const matches = textLower.match(nameRegex)
    counts[name] = matches ? matches.length : 0
  })
  
  return counts
}

/**
 * Extract lines containing target names for contextual analysis
 */
function extractNameContexts(text: string): Record<string, string[]> {
  const contexts: Record<string, string[]> = {}
  const lines = text.split('\n')
  
  TARGET_NAMES.forEach(name => {
    contexts[name] = []
    const nameRegex = new RegExp(`\\b${name}\\b`, 'gi')
    
    lines.forEach((line, index) => {
      if (nameRegex.test(line)) {
        // Include surrounding context
        const prevLine = index > 0 ? lines[index - 1] : ''
        const nextLine = index < lines.length - 1 ? lines[index + 1] : ''
        const context = [prevLine, line, nextLine].filter(l => l.trim()).join(' ')
        contexts[name].push(context.trim())
      }
    })
  })
  
  return contexts
}

/**
 * Analyze potential date-based document tampering
 */
function analyzeDateBasedTampering(documents: DocumentForAnalysis[]): DateGroupAnalysis[] {
  // Group documents by extracted dates from content
  const dateGroups: Record<string, DocumentForAnalysis[]> = {}
  
  documents.forEach(doc => {
    if (!doc.textContent) return
    
    const dates = extractDates(doc.textContent)
    dates.forEach(date => {
      if (!dateGroups[date]) {
        dateGroups[date] = []
      }
      dateGroups[date].push(doc)
    })
  })
  
  const analyses: DateGroupAnalysis[] = []
  
  Object.entries(dateGroups).forEach(([date, docs]) => {
    if (docs.length < 2) return // Need at least 2 docs to compare
    
    const flags: TamperingFlag[] = []
    
    // Compare documents sharing the same date
    for (let i = 0; i < docs.length; i++) {
      for (let j = i + 1; j < docs.length; j++) {
        const docA = docs[i]
        const docB = docs[j]
        
        if (!docA.textContent || !docB.textContent) continue
        
        // Analyze name mention discrepancies
        const nameCountsA = countNameMentions(docA.textContent)
        const nameCountsB = countNameMentions(docB.textContent)
        
        TARGET_NAMES.forEach(name => {
          const countA = nameCountsA[name] || 0
          const countB = nameCountsB[name] || 0
          const diff = Math.abs(countA - countB)
          
          if (diff > 0) {
            const severity = diff > 3 ? 'critical' : diff > 1 ? 'high' : 'medium'
            flags.push({
              type: 'name_discrepancy',
              severity,
              description: `Name "${name}" mentioned ${countA} times in ${docA.title} but ${countB} times in ${docB.title}`,
              evidence: [
                `Document A (${docA.title}): ${countA} mentions`,
                `Document B (${docB.title}): ${countB} mentions`,
                `Difference: ${diff} mentions`
              ],
              affectedDocuments: [docA.id, docB.id],
              confidence: Math.min(90, 60 + (diff * 10))
            })
          }
        })
        
        // Analyze number/identifier changes
        const numbersA = new Set(extractNumbers(docA.textContent))
        const numbersB = new Set(extractNumbers(docB.textContent))
        
        const addedNumbers = [...numbersB].filter(n => !numbersA.has(n))
        const removedNumbers = [...numbersA].filter(n => !numbersB.has(n))
        
        if (addedNumbers.length > 0 || removedNumbers.length > 0) {
          const changeCount = addedNumbers.length + removedNumbers.length
          const severity = changeCount > 10 ? 'critical' : changeCount > 5 ? 'high' : 'medium'
          
          flags.push({
            type: 'content_change',
            severity,
            description: `Numeric values altered between document versions (${changeCount} changes)`,
            evidence: [
              `Added numbers: ${addedNumbers.slice(0, 10).join(', ')}${addedNumbers.length > 10 ? '...' : ''}`,
              `Removed numbers: ${removedNumbers.slice(0, 10).join(', ')}${removedNumbers.length > 10 ? '...' : ''}`
            ],
            affectedDocuments: [docA.id, docB.id],
            confidence: Math.min(85, 50 + (changeCount * 3))
          })
        }
        
        // Content length analysis
        const lengthDiff = Math.abs(docA.textContent.length - docB.textContent.length)
        const lengthChangePercent = (lengthDiff / Math.max(docA.textContent.length, docB.textContent.length)) * 100
        
        if (lengthChangePercent > 20) {
          flags.push({
            type: 'content_change',
            severity: lengthChangePercent > 50 ? 'critical' : 'high',
            description: `Significant content length change (${lengthChangePercent.toFixed(1)}% difference)`,
            evidence: [
              `${docA.title}: ${docA.textContent.length} characters`,
              `${docB.title}: ${docB.textContent.length} characters`,
              `Difference: ${lengthDiff} characters (${lengthChangePercent.toFixed(1)}%)`
            ],
            affectedDocuments: [docA.id, docB.id],
            confidence: Math.min(80, 40 + lengthChangePercent)
          })
        }
        
        // Metadata consistency check
        if (docA.category !== docB.category) {
          flags.push({
            type: 'metadata_inconsistency',
            severity: 'medium',
            description: `Document categorization differs for same-date documents`,
            evidence: [
              `${docA.title}: ${docA.category}`,
              `${docB.title}: ${docB.category}`
            ],
            affectedDocuments: [docA.id, docB.id],
            confidence: 70
          })
        }
      }
    }
    
    // Determine overall risk level
    const criticalFlags = flags.filter(f => f.severity === 'critical').length
    const highFlags = flags.filter(f => f.severity === 'high').length
    const mediumFlags = flags.filter(f => f.severity === 'medium').length
    
    let riskLevel: DateGroupAnalysis['riskLevel'] = 'low'
    if (criticalFlags > 0) riskLevel = 'critical'
    else if (highFlags > 1 || (highFlags > 0 && mediumFlags > 2)) riskLevel = 'high'
    else if (highFlags > 0 || mediumFlags > 1) riskLevel = 'medium'
    
    analyses.push({
      date,
      documents: docs,
      tamperingIndicators: flags,
      riskLevel
    })
  })
  
  return analyses.sort((a, b) => {
    const riskOrder = { critical: 4, high: 3, medium: 2, low: 1 }
    return riskOrder[b.riskLevel] - riskOrder[a.riskLevel]
  })
}

/**
 * Analyze timeline inconsistencies
 */
function analyzeTimelineInconsistencies(documents: DocumentForAnalysis[]): TamperingFlag[] {
  const flags: TamperingFlag[] = []
  
  // Sort documents by upload date
  const sortedDocs = [...documents].sort((a, b) => 
    new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime()
  )
  
  // Check for documents that were modified after newer documents were created
  for (let i = 0; i < sortedDocs.length - 1; i++) {
    const currentDoc = sortedDocs[i]
    const newerDocs = sortedDocs.slice(i + 1)
    
    newerDocs.forEach(newerDoc => {
      const currentModified = new Date(currentDoc.lastModified).getTime()
      const newerUploaded = new Date(newerDoc.uploadedAt).getTime()
      
      if (currentModified > newerUploaded + (24 * 60 * 60 * 1000)) { // More than 1 day later
        flags.push({
          type: 'timeline_conflict',
          severity: 'high',
          description: `Document "${currentDoc.title}" was modified after newer document "${newerDoc.title}" was created`,
          evidence: [
            `${currentDoc.title} last modified: ${new Date(currentDoc.lastModified).toLocaleString()}`,
            `${newerDoc.title} uploaded: ${new Date(newerDoc.uploadedAt).toLocaleString()}`,
            `Modified by: ${currentDoc.lastModifiedBy}`
          ],
          affectedDocuments: [currentDoc.id, newerDoc.id],
          confidence: 85,
          location: 'Timeline Analysis'
        })
      }
    })
  }
  
  return flags
}

/**
 * Main tampering analysis function
 */
export function analyzeTampering(documents: DocumentForAnalysis[]): {
  dateGroupAnalyses: DateGroupAnalysis[]
  timelineFlags: TamperingFlag[]
  overallRiskAssessment: {
    totalFlags: number
    criticalFlags: number
    highRiskDocuments: string[]
    summary: string
  }
} {
  const dateGroupAnalyses = analyzeDateBasedTampering(documents)
  const timelineFlags = analyzeTimelineInconsistencies(documents)
  
  // Combine all flags for overall assessment
  const allFlags = [
    ...dateGroupAnalyses.flatMap(group => group.tamperingIndicators),
    ...timelineFlags
  ]
  
  const criticalFlags = allFlags.filter(f => f.severity === 'critical').length
  const highFlags = allFlags.filter(f => f.severity === 'high').length
  
  const highRiskDocuments = [...new Set(
    allFlags
      .filter(f => f.severity === 'critical' || f.severity === 'high')
      .flatMap(f => f.affectedDocuments)
  )]
  
  let summary = ''
  if (criticalFlags > 0) {
    summary = `🚨 CRITICAL: ${criticalFlags} critical tampering indicators detected. Immediate investigation recommended.`
  } else if (highFlags > 0) {
    summary = `⚠️ HIGH RISK: ${highFlags} high-severity indicators found. Review recommended.`
  } else if (allFlags.length > 0) {
    summary = `ℹ️ MODERATE: ${allFlags.length} potential indicators detected. Monitoring advised.`
  } else {
    summary = `✅ LOW RISK: No significant tampering indicators detected.`
  }
  
  return {
    dateGroupAnalyses,
    timelineFlags,
    overallRiskAssessment: {
      totalFlags: allFlags.length,
      criticalFlags,
      highRiskDocuments,
      summary
    }
  }
}

/**
 * Generate a detailed tampering report
 */
export function generateTamperingReport(
  analysis: ReturnType<typeof analyzeTampering>,
  documents: DocumentForAnalysis[]
): string {
  const { dateGroupAnalyses, timelineFlags, overallRiskAssessment } = analysis
  
  let report = `# Document Tampering Analysis Report\n\n`
  report += `**Generated:** ${new Date().toLocaleString()}\n`
  report += `**Documents Analyzed:** ${documents.length}\n`
  report += `**Total Flags:** ${overallRiskAssessment.totalFlags}\n`
  report += `**Critical Flags:** ${overallRiskAssessment.criticalFlags}\n\n`
  
  report += `## Overall Risk Assessment\n\n`
  report += `${overallRiskAssessment.summary}\n\n`
  
  if (overallRiskAssessment.highRiskDocuments.length > 0) {
    report += `### High-Risk Documents:\n`
    overallRiskAssessment.highRiskDocuments.forEach(docId => {
      const doc = documents.find(d => d.id === docId)
      if (doc) {
        report += `- ${doc.title} (${doc.fileName})\n`
      }
    })
    report += `\n`
  }
  
  if (dateGroupAnalyses.length > 0) {
    report += `## Date-Based Analysis\n\n`
    dateGroupAnalyses.forEach(group => {
      report += `### Date: ${group.date} (${group.riskLevel.toUpperCase()} RISK)\n\n`
      report += `**Documents:** ${group.documents.map(d => d.title).join(', ')}\n\n`
      
      if (group.tamperingIndicators.length > 0) {
        report += `**Tampering Indicators:**\n`
        group.tamperingIndicators.forEach((flag, index) => {
          report += `${index + 1}. **${flag.type.replace('_', ' ').toUpperCase()}** (${flag.severity})\n`
          report += `   - ${flag.description}\n`
          report += `   - Confidence: ${flag.confidence}%\n`
          flag.evidence.forEach(evidence => {
            report += `   - ${evidence}\n`
          })
          report += `\n`
        })
      }
    })
  }
  
  if (timelineFlags.length > 0) {
    report += `## Timeline Inconsistencies\n\n`
    timelineFlags.forEach((flag, index) => {
      report += `${index + 1}. **${flag.description}**\n`
      report += `   - Severity: ${flag.severity}\n`
      report += `   - Confidence: ${flag.confidence}%\n`
      flag.evidence.forEach(evidence => {
        report += `   - ${evidence}\n`
      })
      report += `\n`
    })
  }
  
  report += `## Recommendations\n\n`
  if (overallRiskAssessment.criticalFlags > 0) {
    report += `- **IMMEDIATE ACTION REQUIRED:** Critical tampering indicators detected\n`
    report += `- Preserve all document versions and metadata\n`
    report += `- Conduct forensic analysis of affected documents\n`
    report += `- Review access logs and modification history\n`
    report += `- Consider legal implications of potential evidence tampering\n`
  } else if (overallRiskAssessment.totalFlags > 0) {
    report += `- Review flagged documents for potential issues\n`
    report += `- Verify document authenticity through alternative sources\n`
    report += `- Monitor for additional changes or inconsistencies\n`
    report += `- Document review process and findings\n`
  } else {
    report += `- Continue monitoring for changes\n`
    report += `- Maintain version control and audit trails\n`
    report += `- Regular periodic analysis recommended\n`
  }
  
  return report
}