// Sample documents with potential tampering indicators for testing

export const sampleDocumentsWithTampering = [
  {
    id: "test-doc-1",
    fileName: "Police_Report_2023-03-15_v1.pdf",
    title: "Police Report - March 15, 2023",
    description: "Initial police report regarding incident involving children",
    category: "Primary" as const,
    children: ["Jace", "Josh"],
    laws: ["Brady v. Maryland", "Due Process (14th Amendment)"],
    misconduct: [],
    include: "YES" as const,
    placement: {
      masterFile: true,
      exhibitBundle: true,
      oversightPacket: true
    },
    uploadedAt: "2023-03-15T10:00:00Z",
    textContent: `POLICE REPORT
Date: March 15, 2023
Officer: Andy Maki
Report #: 2023-0315-001

INCIDENT SUMMARY:
Responding to complaint regarding Noel's interaction with children. 
Jace (age 8) and Josh (age 10) were present during the incident.
Officer Banister was also on scene. 
Russell provided witness statement.
Verde assisted with documentation.

DETAILS:
Initial contact at 2:30 PM. Children appeared distressed.
Noel was questioned about the allegations.
Photos taken at scene (evidence bag #127).
Case file number: CF-2023-789.

EVIDENCE COLLECTED:
- Photo evidence (bag #127)
- Witness statements from Russell
- Children interviewed separately

CONCLUSION:
Further investigation required. Case assigned to Detective Verde.`,
    currentVersion: 1,
    lastModified: "2023-03-15T10:00:00Z",
    lastModifiedBy: "Officer Andy Maki"
  },
  {
    id: "test-doc-2", 
    fileName: "Police_Report_2023-03-15_v2.pdf",
    title: "Police Report - March 15, 2023 (Revised)",
    description: "Revised police report with updated information",
    category: "Primary" as const,
    children: ["Jace"],
    laws: ["Brady v. Maryland"],
    misconduct: [],
    include: "YES" as const,
    placement: {
      masterFile: true,
      exhibitBundle: true,
      oversightPacket: true
    },
    uploadedAt: "2023-03-15T10:00:00Z",
    textContent: `POLICE REPORT
Date: March 15, 2023
Officer: Andy Maki
Report #: 2023-0315-001

INCIDENT SUMMARY:
Responding to complaint regarding incident with children.
Jace (age 8) was present during the incident.
Officer Banister was also on scene.
Russell provided witness statement.

DETAILS:
Initial contact at 2:45 PM. Child appeared calm.
Individual was questioned about the allegations.
Photos taken at scene (evidence bag #128).
Case file number: CF-2023-790.

EVIDENCE COLLECTED:
- Photo evidence (bag #128)
- Witness statements from Russell

CONCLUSION:
Investigation complete. No further action required.`,
    currentVersion: 2,
    lastModified: "2023-03-15T10:05:00Z",
    lastModifiedBy: "Officer Andy Maki"
  },
  {
    id: "test-doc-3",
    fileName: "Medical_Exam_2023-03-16.pdf", 
    title: "Medical Examination Report - March 16, 2023",
    description: "Forensic medical examination of children",
    category: "Primary" as const,
    children: ["Jace", "Josh"],
    laws: ["CAPTA", "Evidence Tampering"],
    misconduct: [],
    include: "YES" as const,
    placement: {
      masterFile: true,
      exhibitBundle: true,
      oversightPacket: true
    },
    uploadedAt: "2023-03-16T09:00:00Z",
    textContent: `FORENSIC MEDICAL EXAMINATION
Date: March 16, 2023
Examiner: Dr. Sarah Johnson
Case #: ME-2023-156

PATIENTS EXAMINED:
- Jace (age 8, DOB: 2015-01-10)
- Josh (age 10, DOB: 2013-05-22)

EXAMINATION FINDINGS:
Both children showed signs consistent with recent trauma.
Physical evidence documented via photography.
Samples collected for DNA analysis.
Noel mentioned during child interviews.

CONCLUSIONS:
Evidence supports allegations. 
Full report filed with CPS case #CPS-2023-445.
Recommend immediate protective measures.

EVIDENCE:
- Photographic documentation (45 images)
- DNA samples (kit #DNA-789)
- Interview recordings (2 hours, 15 minutes)`,
    currentVersion: 1,
    lastModified: "2023-03-16T09:00:00Z",
    lastModifiedBy: "Dr. Sarah Johnson"
  }
]