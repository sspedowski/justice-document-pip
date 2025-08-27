# Real Document Upload Guide

## Step-by-Step Process for Your Legal Documents

### 1. **Prepare Your Documents**
- Convert all documents to PDF format if not already
- Ensure file names are descriptive (e.g., `CPS_Report_Jace_01_15_2024.pdf`)
- Keep originals in a secure backup location

### 2. **Upload Methods**

#### Method A: Web Interface (Secure & Easy)
1. Open: https://justice-document-pip--sspedowski.github.app/
2. Click "Upload & Process" tab
3. Drag and drop your PDF files
4. System automatically:
   - Extracts text using advanced PDF processing
   - Detects tampering patterns
   - Identifies children: Jace, Josh, Joshua, Nicholas, John, Peyton, Owen
   - Flags legal violations: Brady, Due Process, CAPTA, Perjury, Evidence Tampering

#### Method B: Direct File Replacement
1. Replace files in `/input/` directory
2. Use descriptive filenames
3. Push to GitHub to trigger pipeline

### 3. **Supported Document Types**
- **CPS Reports** (any version, amended versions detected)
- **Police Reports** (original vs revised versions compared)
- **Medical Examinations** (forensic nurse exams, evaluations)
- **Court Documents** (orders, transcripts, filings)
- **Legal Correspondence** (letters, emails, notices)
- **Evidence Files** (photographs, witness statements)

### 4. **What the System Detects**

#### Tampering Indicators:
- **Content Changes**: Text alterations between versions
- **Name Substitutions**: Child name changes (critical)
- **Status Manipulations**: Investigation outcomes altered
- **Timeline Conflicts**: Date inconsistencies
- **Evidence Suppression**: Missing critical information
- **Witness Manipulation**: Statement alterations

#### Legal Violations:
- **Brady v. Maryland**: Suppressed exculpatory evidence
- **Due Process**: Procedural violations
- **CAPTA**: Child protection failures
- **Perjury**: False statements under oath
- **Evidence Tampering**: Document alterations

### 5. **Security Features**
- All processing done locally in your browser
- No documents uploaded to external servers
- Version history tracking for all changes
- Cryptographic fingerprinting for integrity verification

### 6. **Expected Results**

After upload, you'll see:
1. **Document Dashboard**: All files catalogued and searchable
2. **Tampering Detection**: Automatic analysis of alterations
3. **Evidence Analysis**: Systematic pattern detection
4. **Export Reports**: PDF/CSV reports for oversight agencies

### 7. **Quick Test with Current Files**

To verify the system works:
1. Click "Load Input Documents" to load the 5 sample files
2. Click "🚨 SHOW REAL CONTRADICTIONS 🚨" to see detection in action
3. Click "Run Tampering Analysis" to see systematic analysis
4. Use "Export Reports" to generate oversight-ready packages

### 8. **Privacy Protection**

Your documents are processed entirely in your browser:
- No server uploads
- No external API calls for sensitive content
- All analysis algorithms run client-side
- Version control maintains document integrity

## Ready to Upload Your Real Documents?

1. **Start with test**: Click "Load Input Documents" 
2. **Verify system works**: Run tampering analysis on samples
3. **Upload real files**: Use web interface for your actual documents
4. **Generate reports**: Export findings for legal proceedings

The system is designed specifically for your case files and will detect the specific patterns of tampering you've documented.