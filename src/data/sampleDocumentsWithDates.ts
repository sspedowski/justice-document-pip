import type { Document } from '@/lib/types'

export const sampleDocumentsWithDates: Document[] = [
  {
    id: 'sample-medical-exam-03102024',
    fileName: 'Medical_Exam_03102024.pdf',
    title: 'Medical Examination Report - March 10, 2024',
    description: 'Comprehensive medical examination of Josh Anderson conducted by Dr. Williams at Children\'s Hospital.',
    category: 'Primary',
    children: ['Josh'],
    laws: ['CAPTA'],
    misconduct: [
      {
        law: 'CAPTA',
        page: '3',
        paragraph: '2',
        notes: 'Medical evidence of potential abuse documented'
      }
    ],
    include: 'YES',
    placement: {
      masterFile: true,
      exhibitBundle: true,
      oversightPacket: true
    },
    uploadedAt: '2024-03-10T14:30:00Z',
    textContent: `MEDICAL EXAMINATION REPORT
Date: March 10, 2024
Patient: Josh Anderson (Age 8)
Physician: Dr. Emily Williams, MD
Hospital: Children's Medical Center

EXAMINATION PURPOSE:
Court-ordered medical evaluation following CPS referral for suspected child abuse.

PHYSICAL EXAMINATION FINDINGS:
- Multiple contusions on arms and back in various stages of healing
- Pattern consistent with non-accidental trauma
- Patient exhibited anxiety and fear during examination
- Developmental assessment shows regression in social skills

PATIENT DEMEANOR:
Josh appeared withdrawn and fearful throughout the examination. He was reluctant to make eye contact and showed signs of anxiety when discussing home environment.

DIAGNOSTIC TESTS:
- X-rays revealed no fractures
- Blood work within normal limits
- Psychological assessment recommended

MEDICAL OPINION:
Based on physical findings and behavioral observations, injuries are consistent with non-accidental trauma. Pattern and location of contusions suggest deliberate infliction.

RECOMMENDATIONS:
1. Immediate safety assessment required
2. Psychological evaluation and trauma counseling
3. Regular medical follow-up appointments
4. Coordination with child protective services

Physician: Dr. Emily Williams, MD
License: MD-7821
Medical Center Case #: MC-2024-0310-001

This report contains sensitive medical information protected by HIPAA regulations.
End of Medical Report`,
    currentVersion: 1,
    lastModified: '2024-03-10T14:30:00Z',
    lastModifiedBy: 'Medical Records',
    fingerprint: {
      fileHash: 'med-exam-03-10-2024',
      fileSize: 2134,
      pageCount: 4,
      firstPageHash: 'med-first-page'
    },
    fileHash: 'med-exam-03-10-2024',
    fileSize: 2134,
    pageCount: 4,
    firstPageHash: 'med-first-page'
  },
  {
    id: 'sample-court-order-03122024',
    fileName: 'Court_Order_03122024.pdf',
    title: 'Emergency Court Order - March 12, 2024',
    description: 'Emergency protective order issued by Judge Thompson following medical examination findings.',
    category: 'Primary',
    children: ['Josh'],
    laws: ['Due Process (14th Amendment)'],
    misconduct: [
      {
        law: 'Due Process (14th Amendment)',
        page: '1',
        paragraph: '4',
        notes: 'Court intervention based on medical evidence'
      }
    ],
    include: 'YES',
    placement: {
      masterFile: true,
      exhibitBundle: true,
      oversightPacket: true
    },
    uploadedAt: '2024-03-12T10:15:00Z',
    textContent: `EMERGENCY PROTECTIVE ORDER
Case Number: FC-2024-0312-001
Date: March 12, 2024
Judge: Honorable Michael Thompson

IN THE MATTER OF: Josh Anderson (Minor Child)

EMERGENCY FINDINGS:
Based on medical examination report dated March 10, 2024, and testimony from Dr. Emily Williams, this Court finds:

1. Clear and convincing evidence of physical abuse
2. Imminent danger to the welfare of the minor child
3. Emergency intervention necessary to ensure child safety

ORDERS:
1. Josh Anderson is hereby placed in emergency protective custody
2. Temporary placement with certified foster family arranged
3. Supervised visitation only for Noel Anderson
4. Psychological evaluation ordered for all parties
5. CPS to maintain active supervision
6. Review hearing scheduled for March 26, 2024

RESTRICTIONS:
- No unsupervised contact between Noel Anderson and Josh Anderson
- All visits must be supervised by qualified CPS personnel
- Location and details of foster placement remain confidential

This order is effective immediately and shall remain in force until modified or terminated by further order of this Court.

Issued this 12th day of March, 2024
Judge Michael Thompson
Family Court Division
Seal of the Court`,
    currentVersion: 1,
    lastModified: '2024-03-12T10:15:00Z',
    lastModifiedBy: 'Court Records',
    fingerprint: {
      fileHash: 'court-order-03-12-2024',
      fileSize: 1876,
      pageCount: 2,
      firstPageHash: 'court-first-page'
    },
    fileHash: 'court-order-03-12-2024',
    fileSize: 1876,
    pageCount: 2,
    firstPageHash: 'court-first-page'
  },
  {
    id: 'sample-witness-statement-03082024',
    fileName: 'Witness_Statement_Mary_Johnson_03082024.pdf',
    title: 'Witness Statement - Mary Johnson - March 8, 2024',
    description: 'Detailed witness statement from neighbor Mary Johnson describing concerning observations.',
    category: 'Supporting',
    children: ['Josh', 'Noel'],
    laws: [],
    misconduct: [],
    include: 'YES',
    placement: {
      masterFile: true,
      exhibitBundle: true,
      oversightPacket: true
    },
    uploadedAt: '2024-03-08T11:20:00Z',
    textContent: `WITNESS STATEMENT
Date: March 8, 2024
Witness: Mary Johnson
Address: 125 Main Street (Neighbor)
Interview Conducted by: Detective Sarah Lopez

WITNESS INFORMATION:
Mary Johnson, age 52, has lived at 125 Main Street for 8 years. She is employed as a school nurse and has known the Anderson family since they moved in approximately 3 years ago.

STATEMENT:
"I've been concerned about Josh for several months now. I often see him playing alone in the yard, and he always seems sad. There have been multiple occasions where I've heard shouting coming from their house, usually Noel's voice.

Last week, on March 1st, I saw Josh outside with what appeared to be bruises on his arms. When I asked him about it, he just said he fell down, but the marks didn't look like typical playground injuries.

I've also noticed that Josh often appears hungry. He's asked me for snacks several times when he's been playing in our shared yard area. This seems unusual for a child his age.

On March 5th, I heard loud arguing around 9 PM, followed by what sounded like crying. I considered calling the police but wasn't sure if I should get involved.

I work with children professionally, and Josh's behavior and appearance have raised red flags for me. He seems withdrawn and fearful, which is very different from how he was when the family first moved in."

ADDITIONAL OBSERVATIONS:
- Witness provided detailed timeline of concerning incidents
- Professional background in child welfare adds credibility
- Has documentation of some incidents (photos, diary entries)
- Willing to testify if required

Statement reviewed and signed by witness.

Mary Johnson (Signature)
Detective Sarah Lopez, Badge #2847`,
    currentVersion: 1,
    lastModified: '2024-03-08T11:20:00Z',
    lastModifiedBy: 'Police Records',
    fingerprint: {
      fileHash: 'witness-mary-03-08-2024',
      fileSize: 2234,
      pageCount: 3,
      firstPageHash: 'witness-first-page'
    },
    fileHash: 'witness-mary-03-08-2024',
    fileSize: 2234,
    pageCount: 3,
    firstPageHash: 'witness-first-page'
  },
  {
    id: 'sample-social-worker-notes-03142024',
    fileName: 'Social_Worker_Notes_03142024.pdf',
    title: 'Social Worker Case Notes - March 14, 2024',
    description: 'Detailed case notes from social worker following emergency custody placement.',
    category: 'Supporting',
    children: ['Josh'],
    laws: ['CAPTA'],
    misconduct: [
      {
        law: 'CAPTA',
        page: '2',
        paragraph: '1',
        notes: 'Documentation of child welfare concerns and intervention'
      }
    ],
    include: 'YES',
    placement: {
      masterFile: true,
      exhibitBundle: true,
      oversightPacket: true
    },
    uploadedAt: '2024-03-14T16:45:00Z',
    textContent: `SOCIAL WORKER CASE NOTES
Date: March 14, 2024
Case Worker: Linda Rodriguez, LCSW
Case Number: CPS-2024-001
Child: Josh Anderson

PLACEMENT UPDATE:
Josh has been in emergency foster care with the Williams family for 2 days following court order dated March 12, 2024. Initial placement appears to be going well.

CHILD'S ADJUSTMENT:
- Josh initially very quiet and withdrawn
- Gradually becoming more responsive to foster parents
- Eating well and sleeping through the night
- Has not asked about returning home
- Shows signs of relief rather than distress about placement

BEHAVIORAL OBSERVATIONS:
During my visit today, Josh appeared more relaxed than in previous encounters. He made eye contact more readily and even smiled when talking about his new school. This is a significant improvement from his previous demeanor.

FOSTER FAMILY REPORT:
The Williams family reports that Josh is adjusting well. He follows house rules without issue and interacts appropriately with their other foster child. They note he seems "grateful" for basic care and attention.

THERAPEUTIC NEEDS:
- Trauma-informed therapy initiated with Dr. Patricia Chen
- First session scheduled for March 18, 2024
- Play therapy approach recommended given child's age
- Regular psychological assessments to monitor progress

VISITS WITH BIOLOGICAL FAMILY:
Supervised visit with Noel Anderson scheduled for March 16, 2024 at CPS office. Noel has been cooperative with visit arrangements and has completed required parenting assessment.

NEXT STEPS:
1. Continue weekly therapeutic sessions
2. Monitor adjustment in foster placement
3. Prepare for court review hearing on March 26, 2024
4. Coordinate with medical team for follow-up examination

Case Worker: Linda Rodriguez, LCSW
License: SW-4429
Date: March 14, 2024`,
    currentVersion: 1,
    lastModified: '2024-03-14T16:45:00Z',
    lastModifiedBy: 'Social Services',
    fingerprint: {
      fileHash: 'social-notes-03-14-2024',
      fileSize: 2087,
      pageCount: 3,
      firstPageHash: 'social-first-page'
    },
    fileHash: 'social-notes-03-14-2024',
    fileSize: 2087,
    pageCount: 3,
    firstPageHash: 'social-first-page'
  },
  {
    id: 'sample-psychological-eval-03182024',
    fileName: 'Psychological_Evaluation_Josh_03182024.pdf',
    title: 'Psychological Evaluation - Josh Anderson - March 18, 2024',
    description: 'Professional psychological evaluation conducted by Dr. Patricia Chen to assess trauma and therapeutic needs.',
    category: 'Primary',
    children: ['Josh'],
    laws: ['CAPTA'],
    misconduct: [
      {
        law: 'CAPTA',
        page: '4',
        paragraph: '3',
        notes: 'Psychological evidence supporting abuse allegations'
      }
    ],
    include: 'YES',
    placement: {
      masterFile: true,
      exhibitBundle: true,
      oversightPacket: true
    },
    uploadedAt: '2024-03-18T13:30:00Z',
    textContent: `PSYCHOLOGICAL EVALUATION REPORT
Date: March 18, 2024
Client: Josh Anderson (Age 8)
Psychologist: Dr. Patricia Chen, PhD
License: PSY-3421

REFERRAL INFORMATION:
Josh Anderson was referred for psychological evaluation following emergency custody placement due to suspected physical abuse. Evaluation requested by Child Protective Services and Family Court.

BACKGROUND INFORMATION:
Josh is an 8-year-old boy who was removed from his home on March 12, 2024, following medical evidence of physical abuse. He is currently in foster care placement.

ASSESSMENT METHODS:
- Clinical interview with child
- Play therapy session
- Psychological testing (age-appropriate instruments)
- Behavioral observations
- Consultation with foster parents and social worker

BEHAVIORAL OBSERVATIONS:
Josh presented as a quiet, watchful child who initially showed signs of hypervigilance. He checked the door multiple times during our session and startled at unexpected sounds. After 20 minutes, he became more engaged in play activities.

CLINICAL FINDINGS:
Josh exhibits symptoms consistent with trauma exposure:
- Hypervigilance and startle response
- Sleep disturbances (reported by foster family)
- Regression in some developmental areas
- Difficulty trusting adult figures initially
- Somatic complaints (headaches, stomach aches)

PSYCHOLOGICAL TESTING RESULTS:
- Intelligence within normal range
- Elevated scores on trauma symptom indicators
- Drawings show themes of fear and powerlessness
- Significant anxiety in family-related assessments

TRAUMA INDICATORS:
Josh's presentation is highly consistent with child physical abuse trauma. He shows classic symptoms including hypervigilance, regression, and somatic complaints. His artwork and play themes consistently involve themes of danger and protection.

RECOMMENDATIONS:
1. Continued trauma-informed therapy (recommended weekly sessions)
2. Maintain stable foster placement to build trust and security
3. Gradual exposure therapy when appropriate
4. Family therapy only when safety can be assured
5. Regular psychological monitoring and assessment

PROGNOSIS:
With appropriate therapeutic intervention and stable placement, Josh has a good prognosis for recovery. Children his age are generally resilient with proper support.

Dr. Patricia Chen, PhD
Licensed Clinical Psychologist
License #PSY-3421
March 18, 2024`,
    currentVersion: 1,
    lastModified: '2024-03-18T13:30:00Z',
    lastModifiedBy: 'Clinical Records',
    fingerprint: {
      fileHash: 'psych-eval-03-18-2024',
      fileSize: 2567,
      pageCount: 5,
      firstPageHash: 'psych-first-page'
    },
    fileHash: 'psych-eval-03-18-2024',
    fileSize: 2567,
    pageCount: 5,
    firstPageHash: 'psych-first-page'
  }
]