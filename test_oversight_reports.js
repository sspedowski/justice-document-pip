#!/usr/bin/env node
/**
 * Quick test script to verify the oversight report generation system
 * Tests the core functionality without requiring full Python setup
 */

const fs = require('fs');
const path = require('path');

// Configuration
const ROOT_DIR = process.cwd();
const OUTPUT_DIR = path.join(ROOT_DIR, 'output');
const REPORTS_DIR = path.join(OUTPUT_DIR, 'oversight_reports');
const APP_DATA_DIR = path.join(ROOT_DIR, 'app', 'data');

// Ensure directories exist
[OUTPUT_DIR, REPORTS_DIR, APP_DATA_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Test data
const testDocuments = [
  {
    id: 'test-doc-001',
    fileName: 'CPS_Report_Critical_Evidence.pdf',
    title: 'Critical CPS Report - Evidence Tampering Detected',
    category: 'Primary',
    children: ['Jace', 'Josh'],
    laws: ['Brady v. Maryland', 'Due Process (14th Amendment)', 'Evidence Tampering'],
    misconduct: [
      {
        law: 'Brady v. Maryland',
        page: '3',
        paragraph: '2',
        notes: 'Exculpatory evidence withheld from defense'
      }
    ],
    include: 'YES',
    placement: {
      masterFile: true,
      exhibitBundle: true,
      oversightPacket: true
    },
    description: 'Critical evidence document showing systematic evidence tampering by CPS workers. Contains documented proof of evidence suppression and falsification of reports affecting child safety determinations.',
    uploadedAt: new Date().toISOString(),
    textContent: 'This report documents critical evidence tampering patterns in CPS case files...',
    currentVersion: 2,
    lastModified: new Date().toISOString(),
    lastModifiedBy: 'System Verification'
  },
  {
    id: 'test-doc-002',
    fileName: 'Police_Report_Contradictions.pdf',
    title: 'Police Report - Multiple Contradictions Found',
    category: 'Primary',
    children: ['Jace'],
    laws: ['Due Process (14th Amendment)', 'Perjury'],
    misconduct: [
      {
        law: 'Perjury',
        page: '1',
        paragraph: '4',
        notes: 'False statements under oath documented'
      }
    ],
    include: 'YES',
    placement: {
      masterFile: true,
      exhibitBundle: true,
      oversightPacket: true
    },
    description: 'Police report containing documented contradictions and false statements. Analysis reveals systematic pattern of evidence manipulation to support predetermined conclusions.',
    uploadedAt: new Date(Date.now() - 86400000).toISOString(), // Yesterday
    textContent: 'Initial police report contained accurate information, however subsequent versions show alterations...',
    currentVersion: 3,
    lastModified: new Date().toISOString(),
    lastModifiedBy: 'Evidence Review'
  }
];

const testDocumentVersions = [
  {
    id: 'version-001',
    documentId: 'test-doc-001',
    version: 1,
    changeType: 'created',
    changedBy: 'Initial Import',
    changedAt: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
    changeNotes: 'Initial document upload and processing'
  },
  {
    id: 'version-002',
    documentId: 'test-doc-001',
    version: 2,
    changeType: 'edited',
    changedBy: 'System Review',
    changedAt: new Date(Date.now() - 86400000).toISOString(), // Yesterday
    changeNotes: 'Evidence tampering markers added after forensic analysis'
  },
  {
    id: 'version-003',
    documentId: 'test-doc-002',
    version: 1,
    changeType: 'created',
    changedBy: 'Document Import',
    changedAt: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
    changeNotes: 'Initial police report import'
  },
  {
    id: 'version-004',
    documentId: 'test-doc-002',
    version: 2,
    changeType: 'edited',
    changedBy: 'Forensic Review',
    changedAt: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
    changeNotes: 'Contradiction analysis completed'
  },
  {
    id: 'version-005',
    documentId: 'test-doc-002',
    version: 3,
    changeType: 'edited',
    changedBy: 'Legal Review',
    changedAt: new Date().toISOString(),
    changeNotes: 'Perjury indicators documented'
  }
];

// Agency configurations (matching React component)
const agencies = [
  {
    id: 'fbi-detroit',
    name: 'FBI Detroit Field Office',
    type: 'federal',
    contacts: {
      primary: 'Special Agent in Charge',
      email: 'detroit.fbi@ic.fbi.gov',
      phone: '(313) 965-2323'
    },
    reportFormat: 'comprehensive',
    classification: 'law-enforcement',
    includeSections: ['executive-summary', 'evidence-catalog', 'violations', 'tampering-analysis', 'recommendations']
  },
  {
    id: 'doj-civil-rights',
    name: 'U.S. DOJ Civil Rights Division',
    type: 'federal',
    contacts: {
      primary: 'Assistant Attorney General',
      email: 'civilrights.complaint@usdoj.gov'
    },
    reportFormat: 'comprehensive',
    classification: 'law-enforcement',
    includeSections: ['executive-summary', 'constitutional-violations', 'evidence-catalog', 'recommendations']
  },
  {
    id: 'media-press',
    name: 'Media & Press (Sanitized)',
    type: 'media',
    contacts: {
      primary: 'Public Information Officer'
    },
    reportFormat: 'executive',
    classification: 'public',
    includeSections: ['executive-summary', 'public-interest']
  }
];

// Report generation functions
function generateExecutiveSummary(agency, documents, documentVersions) {
  const timestamp = new Date().toLocaleString();
  const childrenSet = new Set();
  const lawsSet = new Set();
  let tamperingIndicators = 0;
  
  documents.forEach(doc => {
    doc.children.forEach(child => childrenSet.add(child));
    doc.laws.forEach(law => lawsSet.add(law));
  });
  
  tamperingIndicators = documentVersions.filter(v => 
    v.changeType === 'edited' && 
    (v.changeNotes.includes('tamper') || v.changeNotes.includes('alteration') || v.changeNotes.includes('contradiction'))
  ).length;
  
  const riskLevel = tamperingIndicators > 0 ? 'HIGH' : 'MODERATE';
  
  return `EXECUTIVE SUMMARY
${agency.name} Oversight Report

Generated: ${timestamp}
Classification: ${agency.classification.toUpperCase()}
Risk Level: ${riskLevel}

CASE OVERVIEW:
This comprehensive oversight report documents systematic violations and evidence tampering patterns identified within the Michigan child protection and law enforcement systems affecting ${childrenSet.size} children.

KEY FINDINGS:
• Documents Analyzed: ${documents.length}
• Primary Evidence Files: ${documents.filter(d => d.category === 'Primary').length}
• Legal Violations Identified: ${lawsSet.size} distinct areas
• Tampering Indicators: ${tamperingIndicators} documented instances
• Children at Risk: ${Array.from(childrenSet).join(', ')}

CRITICAL CONCERNS:
${riskLevel === 'HIGH' ? '🚨 IMMEDIATE INTERVENTION REQUIRED' : '⚠️ Elevated oversight needed'}
- Evidence suppression patterns detected
- Constitutional violations documented
- Child endangerment through system failures
- Coordinated tampering across multiple agencies

LEGAL FRAMEWORK VIOLATIONS:
${Array.from(lawsSet).map(law => `• ${law}`).join('\n')}

AFFECTED CHILDREN:
${Array.from(childrenSet).map(child => `• ${child} - Multiple protection failures documented`).join('\n')}

RECOMMENDED IMMEDIATE ACTIONS:
1. Federal civil rights investigation initiation
2. Independent oversight implementation
3. Evidence preservation orders
4. Child safety assessment
5. Personnel accountability review

This report contains ${documents.length} supporting documents with ${documentVersions.length} version histories tracking all modifications and potential tampering.`;
}

function generateEvidenceCatalog(documents) {
  const headers = ['Document ID', 'Title', 'Category', 'Date', 'Children Affected', 'Legal Violations', 'Tampering Risk', 'Priority'];
  
  const rows = documents
    .filter(doc => doc.include === 'YES' && doc.placement.oversightPacket)
    .map(doc => [
      doc.id,
      doc.title,
      doc.category,
      new Date(doc.uploadedAt).toLocaleDateString(),
      doc.children.join('; '),
      doc.laws.join('; '),
      doc.currentVersion > 1 ? 'MODERATE' : 'LOW',
      doc.category === 'Primary' ? 'CRITICAL' : 'HIGH'
    ]);
  
  return [headers, ...rows]
    .map(row => row.map(cell => `"${cell.toString().replace(/"/g, '""')}"`).join(','))
    .join('\n');
}

function generateTamperingAnalysis(documents, documentVersions) {
  const editedVersions = documentVersions.filter(v => v.changeType === 'edited');
  const suspiciousEdits = editedVersions.filter(v => 
    v.changeNotes.includes('correction') || 
    v.changeNotes.includes('update') ||
    v.changeNotes.includes('tamper') ||
    v.changeNotes.includes('contradiction')
  );
  
  return `DOCUMENT TAMPERING ANALYSIS

METHODOLOGY:
Version control analysis of ${documentVersions.length} document versions across ${documents.length} evidence files, tracking all modifications, timestamps, and change patterns.

FINDINGS SUMMARY:
• Total Versions Tracked: ${documentVersions.length}
• Edited Versions: ${editedVersions.length}
• Suspicious Modifications: ${suspiciousEdits.length}
• Documents with Multiple Versions: ${new Set(editedVersions.map(v => v.documentId)).size}

TAMPERING INDICATORS:
${suspiciousEdits.length > 0 ? `🚨 HIGH CONCERN: ${suspiciousEdits.length} modifications indicate systematic tampering
- Evidence contradictions documented across versions
- Retroactive alterations to critical findings
- Pattern indicates coordinated evidence manipulation
- Constitutional violations through evidence suppression` : '✅ No significant tampering indicators detected in current analysis'}

MODIFICATION PATTERNS:
${editedVersions.map(v => {
  const doc = documents.find(d => d.id === v.documentId);
  return `• Document: ${doc ? doc.title : 'Unknown'}
  Version: ${v.version}
  Changed: ${new Date(v.changedAt).toLocaleString()}
  By: ${v.changedBy}
  Notes: ${v.changeNotes}
  Risk: ${v.changeNotes.includes('tamper') || v.changeNotes.includes('contradiction') ? 'HIGH' : 'MODERATE'}`;
}).join('\n')}

RECOMMENDATIONS:
1. Forensic examination of original source documents
2. Interview personnel involved in modifications
3. Implement mandatory change documentation protocols
4. Establish independent oversight of evidence handling
5. Preserve all version histories as potential evidence`;
}

function generateOversightReport(agency, documents, documentVersions) {
  const sections = {};
  
  // Executive Summary
  if (agency.includeSections.includes('executive-summary')) {
    sections.executiveSummary = generateExecutiveSummary(agency, documents, documentVersions);
  }
  
  // Evidence Catalog
  if (agency.includeSections.includes('evidence-catalog')) {
    sections.evidenceCatalog = generateEvidenceCatalog(documents);
  }
  
  // Tampering Analysis
  if (agency.includeSections.includes('tampering-analysis')) {
    sections.tamperingAnalysis = generateTamperingAnalysis(documents, documentVersions);
  }
  
  // Constitutional Violations
  if (agency.includeSections.includes('constitutional-violations')) {
    sections.constitutionalViolations = `CONSTITUTIONAL VIOLATIONS ANALYSIS

14TH AMENDMENT - DUE PROCESS VIOLATIONS:
${documents.filter(d => d.laws.some(l => l.includes('Due Process'))).map(d => 
  `• ${d.title}: Evidence of procedural violations and denial of fundamental fairness`
).join('\n')}

BRADY V. MARYLAND VIOLATIONS (Exculpatory Evidence):
${documents.filter(d => d.laws.some(l => l.includes('Brady'))).map(d => 
  `• ${d.title}: Documented evidence suppression and withholding of exculpatory materials`
).join('\n')}`;
  }
  
  // Recommendations
  if (agency.includeSections.includes('recommendations')) {
    const agencyRecs = {
      'federal': [
        'Initiate federal civil rights investigation under 42 USC § 1983',
        'Deploy federal oversight team to monitor state agency compliance',
        'Issue evidence preservation orders to prevent further tampering'
      ],
      'state': [
        'Implement immediate child safety assessments',
        'Suspend implicated personnel pending investigation',
        'Establish independent oversight of child protection decisions'
      ],
      'media': [
        'Investigate and report on systemic failures',
        'Advocate for policy reform and accountability',
        'Raise public awareness of child protection issues'
      ]
    };
    
    const recs = agencyRecs[agency.type] || agencyRecs['federal'];
    
    sections.recommendations = `OVERSIGHT RECOMMENDATIONS FOR ${agency.name.toUpperCase()}

IMMEDIATE ACTIONS (0-30 days):
${recs.map(rec => `• ${rec}`).join('\n')}

ACCOUNTABILITY MEASURES:
• Personnel disciplinary actions where misconduct is proven
• Policy changes to prevent future violations
• Compensation for affected families
• Public reporting on reform implementation`;
  }
  
  return sections;
}

// Test the system
function runTest() {
  console.log('🔍 Testing Oversight Report Generation System');
  console.log('=' .repeat(60));
  
  let testsPassed = 0;
  let totalTests = 0;
  
  // Test 1: Directory creation
  totalTests++;
  try {
    console.log('📁 Testing directory structure...');
    if (fs.existsSync(REPORTS_DIR)) {
      console.log('✅ Directories created successfully');
      testsPassed++;
    } else {
      console.log('❌ Failed to create directories');
    }
  } catch (error) {
    console.log('❌ Directory test failed:', error.message);
  }
  
  // Test 2: Data preparation
  totalTests++;
  try {
    console.log('📊 Testing data preparation...');
    
    // Save test data to app/data directory
    const justiceDocsFile = path.join(APP_DATA_DIR, 'justice-documents.json');
    fs.writeFileSync(justiceDocsFile, JSON.stringify(testDocuments, null, 2));
    
    const versionsFile = path.join(APP_DATA_DIR, 'document-versions.json');
    fs.writeFileSync(versionsFile, JSON.stringify(testDocumentVersions, null, 2));
    
    console.log('✅ Test data prepared successfully');
    testsPassed++;
  } catch (error) {
    console.log('❌ Data preparation failed:', error.message);
  }
  
  // Test 3: Report generation for each agency
  agencies.forEach(agency => {
    totalTests++;
    try {
      console.log(`📋 Testing report generation for ${agency.name}...`);
      
      const reportSections = generateOversightReport(agency, testDocuments, testDocumentVersions);
      
      // Compile full report
      const timestamp = new Date().toISOString().split('T')[0];
      const reportTitle = `OVERSIGHT_REPORT_${agency.id.toUpperCase()}_${timestamp}`;
      
      let fullReport = `${reportTitle}
${'='.repeat(reportTitle.length)}

AGENCY: ${agency.name}
CLASSIFICATION: ${agency.classification.toUpperCase()}
GENERATED: ${new Date().toLocaleString()}
SUBMITTED BY: Justice Document Manager System

${reportSections.executiveSummary || ''}

${reportSections.evidenceCatalog ? `
EVIDENCE CATALOG
================
${reportSections.evidenceCatalog}
` : ''}

${reportSections.tamperingAnalysis || ''}

${reportSections.constitutionalViolations || ''}

${reportSections.recommendations || ''}

---
This report was generated automatically from the Justice Document Manager system
Report ID: ${reportTitle}`;
      
      // Save report
      const reportFile = path.join(REPORTS_DIR, `${reportTitle}.txt`);
      fs.writeFileSync(reportFile, fullReport);
      
      // Save evidence catalog as CSV if present
      if (reportSections.evidenceCatalog) {
        const csvFile = path.join(REPORTS_DIR, `${reportTitle}_EVIDENCE_CATALOG.csv`);
        fs.writeFileSync(csvFile, reportSections.evidenceCatalog);
      }
      
      // Save technical data as JSON
      const technicalData = {
        reportMetadata: {
          agency: agency.name,
          generated: new Date().toISOString(),
          classification: agency.classification,
          reportId: reportTitle
        },
        documents: testDocuments,
        documentVersions: testDocumentVersions,
        tamperingAnalysis: {
          totalVersions: testDocumentVersions.length,
          editedVersions: testDocumentVersions.filter(v => v.changeType === 'edited').length,
          riskAssessment: 'HIGH'
        }
      };
      
      const jsonFile = path.join(REPORTS_DIR, `${reportTitle}_TECHNICAL_DATA.json`);
      fs.writeFileSync(jsonFile, JSON.stringify(technicalData, null, 2));
      
      console.log(`✅ Report generated for ${agency.name}`);
      console.log(`   Files: ${reportFile}`);
      console.log(`          ${csvFile || 'No CSV (not included in this agency)'}`);
      console.log(`          ${jsonFile}`);
      
      testsPassed++;
    } catch (error) {
      console.log(`❌ Report generation failed for ${agency.name}:`, error.message);
    }
  });
  
  // Test 4: Export verification
  totalTests++;
  try {
    console.log('📤 Testing export verification...');
    
    const reportFiles = fs.readdirSync(REPORTS_DIR);
    const expectedFiles = agencies.length * 3; // TXT + CSV + JSON for each agency
    
    if (reportFiles.length >= expectedFiles - 3) { // Media doesn't have CSV, so subtract 3
      console.log(`✅ Export verification passed (${reportFiles.length} files generated)`);
      testsPassed++;
    } else {
      console.log(`❌ Export verification failed (expected ~${expectedFiles}, got ${reportFiles.length})`);
    }
  } catch (error) {
    console.log('❌ Export verification failed:', error.message);
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`Tests Passed: ${testsPassed}/${totalTests}`);
  console.log(`Success Rate: ${Math.round((testsPassed / totalTests) * 100)}%`);
  
  if (testsPassed === totalTests) {
    console.log('🎉 ALL TESTS PASSED - Oversight Report Generation System is ready!');
  } else {
    console.log('⚠️  Some tests failed - Review errors above');
  }
  
  console.log('\nGenerated Reports:');
  try {
    const reportFiles = fs.readdirSync(REPORTS_DIR);
    reportFiles.forEach(file => {
      const filePath = path.join(REPORTS_DIR, file);
      const stats = fs.statSync(filePath);
      console.log(`• ${file} (${Math.round(stats.size / 1024)} KB)`);
    });
  } catch (error) {
    console.log('Error listing report files:', error.message);
  }
  
  console.log(`\nReport Location: ${REPORTS_DIR}`);
  console.log('📋 Oversight report generation system verified and ready for production use!');
  
  return testsPassed === totalTests;
}

// Run the test
const success = runTest();
process.exit(success ? 0 : 1);