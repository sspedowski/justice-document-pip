# Duplicate Detection System

## Overview

The duplicate detection system prevents redundant document uploads by analyzing multiple characteristics of PDF files. It uses a multi-layered approach to identify potential duplicates with varying confidence levels.

## Features

### Detection Methods

1. **Exact Hash Match (100% confidence)**
   - Byte-for-byte identical files
   - Uses SHA-256 hashing of file contents
   - Catches exact duplicates regardless of filename

2. **Filename + Size Match (95% confidence)**
   - Same filename and file size
   - Catches renamed files or metadata changes
   - High confidence for practical purposes

3. **Content Match (90% confidence)**
   - Identical first page content
   - SHA-256 hash of first 2000 characters
   - Catches rescanned documents

4. **Similar Content (85%+ confidence)**
   - Text similarity using Jaccard index
   - Compares 500-character content previews
   - Configurable similarity threshold

5. **Size + Page Count (60% confidence)**
   - Same file size and page count
   - Lower confidence (possible coincidence)
   - Flags potential rescans/reprints

### User Actions

When duplicates are detected, users can:

- **Skip Upload**: Keep existing, ignore new file
- **Replace Existing**: Update with new version
- **Keep Both**: Add with modified filename

### File Fingerprinting

Each document gets a comprehensive fingerprint:

```typescript
interface FileFingerprint {
  fileName: string
  fileSize: number
  fileHash: string        // SHA-256 of file contents
  pageCount?: number      // From PDF metadata
  firstPageHash?: string  // Hash of first page text
  lastModified?: number   // File timestamp
  contentPreview?: string // First 500 chars for fuzzy matching
}
```

## Implementation

### Core Functions

- `generateFileFingerprint()`: Creates unique document fingerprint
- `detectDuplicate()`: Compares against existing documents
- `handleDuplicateAction()`: Processes user decisions
- `getDuplicatePreventionRules()`: Returns detection rule information

### Integration Points

1. **PDF Upload Process**
   - Fingerprint generation after text extraction
   - Duplicate check before document creation
   - User prompt for handling decisions

2. **Document Storage**
   - Fingerprint data stored with documents
   - Used for future duplicate comparisons
   - Supports both local and processed documents

3. **Version Tracking**
   - Replacement creates new version entry
   - Change notes record duplicate handling
   - Maintains audit trail

### UI Components

- **DuplicateDetectionDialog**: User decision interface
- **Processing Status**: Shows duplicate check progress
- **Settings Panel**: Displays detection rules and confidence levels

## Usage

The system operates automatically during PDF upload:

1. File validation occurs first
2. Text extraction provides content for fingerprinting
3. Duplicate detection runs before document creation
4. User prompted if duplicates found
5. Processing continues based on user choice

## Testing

Comprehensive test suite covers:

- Fingerprint generation
- All detection methods
- User action handling
- Edge cases (missing data, special characters)
- Performance with large content

## Configuration

Detection rules are configurable via `getDuplicatePreventionRules()`:

- Confidence thresholds
- Similarity algorithms
- Rule descriptions for UI display

## Performance

- Efficient hashing using CryptoJS
- Content preview limited to 500 characters
- First page hash for quick comparison
- Minimal impact on upload process

## Security

- Client-side processing only
- No file contents sent to external services
- SHA-256 provides strong hash collision resistance
- File fingerprints stored locally