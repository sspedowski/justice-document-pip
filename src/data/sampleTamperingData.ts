import type { Document } from '@/lib/types'

export const sampleDocumentsWithTampering: Document[] = [
  {
    id: 'sample-police-report-original',
    fileName: 'Police_Report_12152023_Original.pdf',
    title: 'Police Report - December 15, 2023 (Original)',
    description: 'Original police report detailing incident involving Noel and Josh. Contains witness statements and evidence documentation.',
    category: 'Primary',
    children: ['Noel', 'Josh'],
    laws: ['Due Process (14th Amendment)'],
    misconduct: [
      {
        law: 'Due Process (14th Amendment)',
        page: '2',
        paragraph: '3',
        notes: 'Initial incident documentation'
      }
    ],
    include: 'YES',
    placement: {
      masterFile: true,
      exhibitBundle: true,
      oversightPacket: true
    },
    uploadedAt: '2023-12-15T10:30:00Z',
    textContent: `POLICE INCIDENT REPORT
Date: December 15, 2023
Incident #: 2023-12-15-001
Officer: J. Smith #4521

INCIDENT SUMMARY:
Responded to call regarding domestic disturbance at 123 Main Street at 10:30 AM.

INDIVIDUALS INVOLVED:
- Noel Anderson (Age 34)
- Josh Anderson (Age 8)
- Witness: Mary Johnson (neighbor)

DETAILS:
Upon arrival, observed Noel Anderson in distressed state. Josh Anderson present and appeared unharmed. 

WITNESS STATEMENT (Mary Johnson):
"I heard shouting around 10:15 AM. Saw Noel outside looking upset. Josh was crying but seemed okay physically."

EVIDENCE:
- Photo evidence taken of scene
- No physical injuries observed
- Report filed for follow-up

CONCLUSION:
Situation resolved on scene. No arrests made. Recommend family services follow-up.

Officer J. Smith
Badge #4521
End of Report`,
    currentVersion: 1,
    lastModified: '2023-12-15T10:30:00Z',
    lastModifiedBy: 'System Import',
    fingerprint: {
      fileHash: 'abc123-original',
      fileSize: 2048,
      pageCount: 3,
      firstPageHash: 'first-page-original'
    },
    fileHash: 'abc123-original',
    fileSize: 2048,
    pageCount: 3,
    firstPageHash: 'first-page-original'
  },
  {
    id: 'sample-police-report-altered',
    fileName: 'Police_Report_12152023_Revised.pdf',
    title: 'Police Report - December 15, 2023 (Revised)',
    description: 'Revised police report with altered details regarding incident involving Noel and Josh. Multiple suspicious changes detected.',
    category: 'Primary',
    children: ['Noel', 'Josh'],
    laws: ['Due Process (14th Amendment)', 'Evidence Tampering'],
    misconduct: [
      {
        law: 'Due Process (14th Amendment)',
        page: '2',
        paragraph: '3',
        notes: 'Altered incident documentation - potential tampering'
      },
      {
        law: 'Evidence Tampering',
        page: '1',
        paragraph: '2',
        notes: 'Evidence of document alteration detected'
      }
    ],
    include: 'YES',
    placement: {
      masterFile: true,
      exhibitBundle: true,
      oversightPacket: true
    },
    uploadedAt: '2023-12-15T14:45:00Z',
    textContent: `POLICE INCIDENT REPORT
Date: December 15, 2023
Incident #: 2023-12-15-001
Officer: J. Smith #4521

INCIDENT SUMMARY:
Responded to call regarding minor neighborhood dispute at 123 Main Street at 10:30 AM.

INDIVIDUALS INVOLVED:
- Noel Anderson (Age 34)
- Josh Anderson (Age 8)

DETAILS:
Upon arrival, observed Noel Anderson in calm state. Josh Anderson present and appeared happy. 

WITNESS STATEMENT:
No witnesses were present during the incident.

EVIDENCE:
- Minimal documentation required
- No concerns observed
- Matter resolved without incident

CONCLUSION:
Minor misunderstanding resolved on scene. No further action required.

Officer J. Smith
Badge #4521
End of Report`,
    currentVersion: 1,
    lastModified: '2023-12-15T14:45:00Z',
    lastModifiedBy: 'System Import',
    fingerprint: {
      fileHash: 'abc123-altered',
      fileSize: 1756,
      pageCount: 2,
      firstPageHash: 'first-page-altered'
    },
    fileHash: 'abc123-altered',
    fileSize: 1756,
    pageCount: 2,
    firstPageHash: 'first-page-altered'
  },
  {
    id: 'sample-cps-report-original',
    fileName: 'CPS_Report_01082024_Initial.pdf',
    title: 'CPS Report - January 8, 2024 (Initial)',
    description: 'Initial CPS investigation report documenting concerns about Josh and family situation.',
    category: 'Primary',
    children: ['Josh'],
    laws: ['CAPTA'],
    misconduct: [
      {
        law: 'CAPTA',
        page: '1',
        paragraph: '1',
        notes: 'Initial CPS investigation documentation'
      }
    ],
    include: 'YES',
    placement: {
      masterFile: true,
      exhibitBundle: true,
      oversightPacket: true
    },
    uploadedAt: '2024-01-08T09:00:00Z',
    textContent: `CHILD PROTECTIVE SERVICES REPORT
Date: January 8, 2024
Case #: CPS-2024-001
Caseworker: Sarah Martinez

CHILD INFORMATION:
Name: Josh Anderson
Age: 8
Address: 123 Main Street

ALLEGATIONS:
Report received regarding potential neglect and unsafe living conditions.

INVESTIGATION FINDINGS:
- Home visit conducted on January 8, 2024
- Josh appeared withdrawn and fearful
- Noel Anderson cooperative but defensive
- Multiple safety concerns observed

RISK ASSESSMENT:
HIGH RISK - Immediate intervention recommended

RECOMMENDATIONS:
1. Safety plan implementation
2. Regular supervised visits
3. Court involvement recommended
4. Services referral for family

NEXT STEPS:
Follow-up visit scheduled for January 15, 2024.

Caseworker: Sarah Martinez
License #SW-5521
End of Report`,
    currentVersion: 1,
    lastModified: '2024-01-08T09:00:00Z',
    lastModifiedBy: 'System Import',
    fingerprint: {
      fileHash: 'cps123-original',
      fileSize: 1892,
      pageCount: 2,
      firstPageHash: 'cps-first-original'
    },
    fileHash: 'cps123-original',
    fileSize: 1892,
    pageCount: 2,
    firstPageHash: 'cps-first-original'
  },
  {
    id: 'sample-cps-report-amended',
    fileName: 'CPS_Report_01082024_Amended.pdf',
    title: 'CPS Report - January 8, 2024 (Amended)',
    description: 'Amended CPS investigation report with significantly altered findings and recommendations.',
    category: 'Primary',
    children: ['Josh'],
    laws: ['CAPTA', 'Evidence Tampering'],
    misconduct: [
      {
        law: 'CAPTA',
        page: '1',
        paragraph: '1',
        notes: 'Amended CPS report with suspicious alterations'
      },
      {
        law: 'Evidence Tampering',
        page: '1',
        paragraph: '3',
        notes: 'Risk assessment changed from HIGH to LOW without justification'
      }
    ],
    include: 'YES',
    placement: {
      masterFile: true,
      exhibitBundle: true,
      oversightPacket: true
    },
    uploadedAt: '2024-01-08T16:30:00Z',
    textContent: `CHILD PROTECTIVE SERVICES REPORT
Date: January 8, 2024
Case #: CPS-2024-001
Caseworker: Sarah Martinez

CHILD INFORMATION:
Name: Josh Anderson
Age: 8
Address: 123 Main Street

ALLEGATIONS:
Report received regarding minor family situation.

INVESTIGATION FINDINGS:
- Home visit conducted on January 8, 2024
- Josh appeared happy and well-adjusted
- Noel Anderson fully cooperative
- No significant concerns observed

RISK ASSESSMENT:
LOW RISK - Minimal intervention required

RECOMMENDATIONS:
1. Case closure appropriate
2. No further visits necessary
3. Family functioning well
4. No services required

NEXT STEPS:
Case recommended for closure.

Caseworker: Sarah Martinez
License #SW-5521
End of Report`,
    currentVersion: 1,
    lastModified: '2024-01-08T16:30:00Z',
    lastModifiedBy: 'System Import',
    fingerprint: {
      fileHash: 'cps123-amended',
      fileSize: 1445,
      pageCount: 1,
      firstPageHash: 'cps-first-amended'
    },
    fileHash: 'cps123-amended',
    fileSize: 1445,
    pageCount: 1,
    firstPageHash: 'cps-first-amended'
  }
]