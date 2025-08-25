/**
 * Sample documents with temporal patterns for testing tampering detection
 * These simulate different versions of documents with intentional alterations
 */

export const sampleDocumentsWithDates = [
  {
    id: 'doc-incident-001-original',
    fileName: 'incident_report_001_original.pdf',
    title: 'Initial Incident Report - Case #2024-001',
    description: 'Original incident report filed on January 15, 2024. Contains initial witness statements and evidence documentation.',
    category: 'Primary' as const,
    children: ['Noel', 'Josh'],
    laws: ['Due Process (14th Amendment)', 'CAPTA'],
    misconduct: [
      {
        law: 'Due Process (14th Amendment)',
        page: '2',
        paragraph: '3',
        notes: 'Initial violation documented'
      }
    ],
    include: 'YES' as const,
    placement: {
      masterFile: true,
      exhibitBundle: true,
      oversightPacket: true
    },
    uploadedAt: '2024-01-15T09:30:00.000Z',
    lastModified: '2024-01-15T09:30:00.000Z',
    lastModifiedBy: 'Officer Martinez',
    currentVersion: 1,
    textContent: `INCIDENT REPORT #2024-001
Date: January 15, 2024
Time: 09:30 AM
Reporting Officer: Officer Martinez
Badge #: 4521

INCIDENT DETAILS:
Location: 123 Maple Street, Anytown
Date of Incident: January 14, 2024
Time of Incident: 6:30 PM

INVOLVED PARTIES:
Primary: Noel Anderson (DOB: 05/12/2010)
Witness: Josh Thompson (DOB: 03/08/2009)
Guardian: Sarah Anderson (Mother)

NARRATIVE:
Initial report indicates possible neglect situation involving minor Noel Anderson. Witness Josh Thompson provided statement regarding conditions at residence. Evidence collected includes photographs of living conditions and initial medical examination results.

EVIDENCE COLLECTED:
- Photo Set A: Living conditions (Evidence #E2024-001-A)
- Medical Exam: Dr. Wilson (Evidence #E2024-001-B)
- Witness Statement: Josh Thompson (Evidence #E2024-001-C)

INITIAL ASSESSMENT:
Situation requires immediate intervention. Child appears undernourished and showing signs of neglect. Recommend immediate protective custody and full investigation.

STATUS: ACTIVE - INVESTIGATION ONGOING
Next Action: Schedule follow-up interview with Noel Anderson
Supervisor Review: Pending

Signed: Officer Martinez
Badge #4521
Date: 01/15/2024`
  },
  
  {
    id: 'doc-incident-001-altered',
    fileName: 'incident_report_001_revised.pdf',
    title: 'Revised Incident Report - Case #2024-001',
    description: 'Revised incident report with updated information and corrected details.',
    category: 'Primary' as const,
    children: ['Nicholas', 'Josh'], // Changed Noel to Nicholas
    laws: ['Due Process (14th Amendment)'], // Removed CAPTA
    misconduct: [
      {
        law: 'Due Process (14th Amendment)',
        page: '2',
        paragraph: '3',
        notes: 'Updated assessment - reduced severity'
      }
    ],
    include: 'YES' as const,
    placement: {
      masterFile: true,
      exhibitBundle: true,
      oversightPacket: true
    },
    uploadedAt: '2024-01-15T14:20:00.000Z', // Same date, later time
    lastModified: '2024-01-16T10:15:00.000Z', // Modified next day
    lastModifiedBy: 'Supervisor Johnson',
    currentVersion: 2,
    textContent: `INCIDENT REPORT #2024-001 (REVISED)
Date: January 15, 2024  
Time: 09:30 AM
Reporting Officer: Officer Martinez
Badge #: 4521

INCIDENT DETAILS:
Location: 123 Maple Street, Anytown
Date of Incident: January 14, 2024
Time of Incident: 6:30 PM

INVOLVED PARTIES:
Primary: Nicholas Anderson (DOB: 05/12/2010)
Witness: Josh Thompson (DOB: 03/08/2009)
Guardian: Sarah Anderson (Mother)

NARRATIVE:
Upon further review, incident appears to be minor housekeeping issue rather than neglect. Nicholas Anderson appears well-cared for with adequate nutrition and supervision. Witness Josh Thompson's statement has been re-evaluated as potentially exaggerated.

EVIDENCE COLLECTED:
- Photo Set A: Living conditions (Evidence #E2024-001-A)
- Medical Exam: Dr. Wilson - RESULTS NORMAL (Evidence #E2024-001-B)
- Witness Statement: Josh Thompson - CLARIFICATION NEEDED (Evidence #E2024-001-C)

REVISED ASSESSMENT:
Situation does not meet threshold for intervention. Child appears healthy and well-cared for. Family cooperation noted. No immediate action required.

STATUS: RESOLVED - NO FURTHER ACTION
Case Disposition: UNFOUNDED
Supervisor Review: APPROVED

REVISION NOTES:
- Corrected subject name from previous error
- Updated medical findings after complete review
- Clarified witness statement accuracy

Revised by: Supervisor Johnson
Date: 01/16/2024
Original Officer: Officer Martinez`
  },

  {
    id: 'doc-followup-002',
    fileName: 'followup_interview_002.pdf',
    title: 'Follow-up Interview Report - Case #2024-002',
    description: 'Follow-up interview conducted one week after initial incident.',
    category: 'Supporting' as const,
    children: ['Noel', 'Jace', 'Owen'],
    laws: ['Brady v. Maryland', 'Evidence Tampering'],
    misconduct: [
      {
        law: 'Brady v. Maryland',
        page: '1',
        paragraph: '2',
        notes: 'Potential exculpatory evidence suppression'
      }
    ],
    include: 'YES' as const,
    placement: {
      masterFile: true,
      exhibitBundle: false,
      oversightPacket: true
    },
    uploadedAt: '2024-01-22T11:45:00.000Z',
    lastModified: '2024-01-22T11:45:00.000Z',
    lastModifiedBy: 'Detective Williams',
    currentVersion: 1,
    textContent: `FOLLOW-UP INTERVIEW REPORT
Case #: 2024-002 (Related to #2024-001)
Date: January 22, 2024
Time: 11:45 AM
Interviewer: Detective Williams
Badge #: 7834

INTERVIEW SUBJECTS:
Primary: Noel Anderson (Age 13)
Additional: Jace Miller (Age 14, neighbor)
Additional: Owen Davis (Age 12, friend)

INTERVIEW LOCATION:
Child Advocacy Center, 456 Oak Avenue

SUMMARY:
Follow-up interview reveals additional details not captured in initial report. Noel Anderson provided detailed account of ongoing situation. Witnesses Jace Miller and Owen Davis corroborate key elements of Noel's statement.

KEY FINDINGS:
- Noel confirms identity (not Nicholas as in revised report)
- Multiple witnesses describe concerning patterns
- Timeline of events differs from official record
- Evidence of potential suppression of witness statements

WITNESS STATEMENTS:
Jace Miller: "Noel told us about problems at home for months"
Owen Davis: "We saw Noel asking for food at school regularly"
Noel Anderson: "I don't understand why they changed my name in the report"

EVIDENCE REFERENCES:
- Original Statement: Evidence #E2024-001-C (Josh Thompson)
- New Statements: Evidence #E2024-002-A (Jace Miller)
- New Statements: Evidence #E2024-002-B (Owen Davis)
- Audio Recording: Evidence #E2024-002-C (Interview)

DISCREPANCIES NOTED:
1. Subject name changed from Noel to Nicholas in revised report
2. Medical findings contradicted by current physical examination
3. Witness credibility questioned without apparent basis
4. Case status changed from ACTIVE to RESOLVED prematurely

RECOMMENDATIONS:
- Review all evidence handling procedures
- Interview Officer Martinez regarding initial report
- Question Supervisor Johnson about revision process
- Forensic examination of all documentation

STATUS: UNDER REVIEW
Supervisor: Captain Rodriguez
Date: 01/22/2024

Signed: Detective Williams
Badge #7834`
  },

  {
    id: 'doc-medical-003',
    fileName: 'medical_examination_003.pdf',
    title: 'Independent Medical Examination - Case #2024-003',
    description: 'Independent medical examination conducted by external physician.',
    category: 'Primary' as const,
    children: ['Noel'],
    laws: ['CAPTA', 'Evidence Tampering'],
    misconduct: [
      {
        law: 'Evidence Tampering',
        page: '3',
        paragraph: '1',
        notes: 'Conflicting medical findings suggest document alteration'
      }
    ],
    include: 'YES' as const,
    placement: {
      masterFile: true,
      exhibitBundle: true,
      oversightPacket: true
    },
    uploadedAt: '2024-01-25T16:20:00.000Z',
    lastModified: '2024-01-25T16:20:00.000Z',
    lastModifiedBy: 'Dr. Sarah Chen',
    currentVersion: 1,
    textContent: `INDEPENDENT MEDICAL EXAMINATION REPORT
Case Reference: 2024-003 (Related to Cases #2024-001, #2024-002)
Date: January 25, 2024
Time: 4:20 PM
Examining Physician: Dr. Sarah Chen, MD
License: MD-12345

PATIENT INFORMATION:
Name: Noel Anderson
DOB: May 12, 2010
Age: 13 years old
Guardian: Sarah Anderson (Mother)

EXAMINATION PURPOSE:
Independent medical evaluation requested due to conflicting reports regarding patient's health status and welfare.

PHYSICAL EXAMINATION FINDINGS:
Height: 4'8" (Below 10th percentile for age)
Weight: 72 lbs (Below 5th percentile for age)
BMI: 15.2 (Significantly underweight)

CLINICAL OBSERVATIONS:
- Evidence of chronic malnutrition
- Poor dental hygiene with multiple cavities
- Old healing bruises on arms and back (estimated 2-3 weeks old)
- Patient appears anxious and withdrawn
- Delayed physical development consistent with nutritional deficiency

PATIENT INTERVIEW:
Noel confirms identity and provides consistent account of living conditions. Patient states: "I'm always hungry at home" and "Sometimes there's no food for days."

COMPARISON WITH PREVIOUS REPORTS:
This examination directly contradicts the "RESULTS NORMAL" notation in Evidence #E2024-001-B. The physical findings are inconsistent with a healthy, well-nourished child.

PHOTOGRAPHIC DOCUMENTATION:
- Evidence #E2024-003-A: Height/weight measurements
- Evidence #E2024-003-B: Nutritional assessment markers
- Evidence #E2024-003-C: Documented injuries (healed)

PROFESSIONAL OPINION:
The physical evidence strongly supports concerns of neglect and possible abuse. The prior medical clearance appears to be erroneous or potentially falsified.

RECOMMENDATIONS:
1. Immediate nutritional intervention
2. Psychological evaluation
3. Review of all previous medical documentation
4. Investigation into discrepant medical findings

CONCERN FOR EVIDENCE INTEGRITY:
The significant discrepancy between this examination and prior medical findings (Evidence #E2024-001-B) raises serious questions about document authenticity or potential tampering.

Signed: Dr. Sarah Chen, MD
License: MD-12345
Date: January 25, 2024

COPY TO: Child Protective Services, District Attorney's Office`
  },

  {
    id: 'doc-witness-004',
    fileName: 'witness_statement_supplemental.pdf',
    title: 'Supplemental Witness Statement - Josh Thompson',
    description: 'Additional witness statement clarifying previous testimony.',
    category: 'Supporting' as const,
    children: ['Noel', 'Josh'],
    laws: ['Brady v. Maryland', 'Perjury'],
    misconduct: [
      {
        law: 'Perjury',
        page: '2',
        paragraph: '4',
        notes: 'Witness recants parts of previous statement'
      }
    ],
    include: 'YES' as const,
    placement: {
      masterFile: true,
      exhibitBundle: true,
      oversightPacket: true
    },
    uploadedAt: '2024-01-28T13:15:00.000Z',
    lastModified: '2024-01-28T13:15:00.000Z',
    lastModifiedBy: 'Josh Thompson',
    currentVersion: 1,
    textContent: `SUPPLEMENTAL WITNESS STATEMENT
Case Reference: 2024-001 and related cases
Date: January 28, 2024
Time: 1:15 PM
Witness: Josh Thompson
DOB: March 8, 2009
Age: 14 years old

STATEMENT GIVEN TO:
Detective Williams, Badge #7834
Child Advocacy Specialist: Maria Santos

PURPOSE:
Clarification of previous statement regarding Noel Anderson and observed conditions.

SUPPLEMENTAL STATEMENT:
I want to clarify my previous statement about Noel Anderson. I've been friends with Noel for three years, and I need to correct some things that might have been misunderstood.

CORRECTIONS TO PREVIOUS STATEMENT:
1. Noel's name: It's definitely Noel, not Nicholas. I've known Noel since we were in 5th grade together.

2. Home conditions: I have been to Noel's house many times. There often isn't enough food, and Noel frequently asks other kids for lunch money or food.

3. Physical appearance: Noel is much thinner than other kids our age and often seems tired and hungry.

CLARIFICATION REGARDING STATEMENT REVISION:
Someone told me that my statement was being questioned as "potentially exaggerated." I want to be clear that everything I said was true. I saw:
- Empty refrigerator multiple times
- Noel eating ketchup packets for lunch
- Noel wearing the same clothes for weeks
- Bruises on Noel's arms that Noel said were from "accidents"

WHY I'M SPEAKING UP AGAIN:
After hearing that the case was marked "RESOLVED" and "UNFOUNDED," I became worried. Noel is my friend, and the problems at home are real. I don't understand how they could say everything is fine.

ADDITIONAL WITNESSES:
Other kids at school have noticed the same things:
- Jace Miller (neighbor)
- Owen Davis (classmate)
- Peyton Lee (sits next to Noel in math class)

ADULT WITNESSES:
- Mrs. Rodriguez (school counselor) - has given Noel extra food
- Mr. Kim (teacher) - noticed Noel falling asleep in class from hunger

CONCERN ABOUT ORIGINAL INVESTIGATION:
I'm confused about why my original statement was labeled as unreliable. Everything I said was true. I'm worried that someone doesn't want people to know about Noel's situation.

I understand this is serious, and I promise I'm telling the truth.

Signed: Josh Thompson
Date: January 28, 2024
Witnessed by: Detective Williams, Badge #7834
Witnessed by: Maria Santos, Child Advocacy Specialist`
  }
]

// Additional metadata for enhanced tampering detection
export const documentMetadata = {
  'doc-incident-001-original': {
    originalHash: 'a1b2c3d4e5f6',
    creationTimestamp: '2024-01-15T09:30:00.000Z',
    lastAccessLog: ['Officer Martinez', 'Supervisor Johnson'],
    versionHistory: ['v1.0 - Initial report']
  },
  'doc-incident-001-altered': {
    originalHash: 'a1b2c3d4e5f6',  // Same hash indicates same base content
    currentHash: 'x9y8z7w6v5u4',   // Different hash indicates alteration
    creationTimestamp: '2024-01-15T09:30:00.000Z',
    revisionTimestamp: '2024-01-16T10:15:00.000Z',
    lastAccessLog: ['Officer Martinez', 'Supervisor Johnson', 'Unknown User'],
    versionHistory: ['v1.0 - Initial report', 'v2.0 - Revised by Supervisor Johnson'],
    alterationFlags: ['name_change', 'status_change', 'conclusion_modification']
  },
  'doc-followup-002': {
    originalHash: 'b2c3d4e5f6g7',
    creationTimestamp: '2024-01-22T11:45:00.000Z',
    lastAccessLog: ['Detective Williams', 'Captain Rodriguez'],
    versionHistory: ['v1.0 - Follow-up interview'],
    crossReferences: ['doc-incident-001-original', 'doc-incident-001-altered']
  },
  'doc-medical-003': {
    originalHash: 'c3d4e5f6g7h8',
    creationTimestamp: '2024-01-25T16:20:00.000Z',
    lastAccessLog: ['Dr. Sarah Chen'],
    versionHistory: ['v1.0 - Independent medical examination'],
    crossReferences: ['doc-incident-001-altered'],
    contradictoryFindings: ['Evidence #E2024-001-B']
  },
  'doc-witness-004': {
    originalHash: 'd4e5f6g7h8i9',
    creationTimestamp: '2024-01-28T13:15:00.000Z',
    lastAccessLog: ['Josh Thompson', 'Detective Williams', 'Maria Santos'],
    versionHistory: ['v1.0 - Supplemental witness statement'],
    crossReferences: ['doc-incident-001-original', 'doc-incident-001-altered', 'doc-followup-002']
  }
}