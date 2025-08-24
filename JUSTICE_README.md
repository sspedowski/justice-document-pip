# Justice Document Manager

A professional document management system for legal case files, specifically designed for organizing and tracking justice-related documents with automatic classification and oversight packet generation.

## Features

- **Automatic PDF Processing**: Upload PDF documents and extract text content automatically
- **Smart Classification**: AI-powered categorization of documents (Primary, Supporting, External, No)
- **Legal Analysis**: Automatic detection of relevant laws and children mentioned in documents
- **Oversight Packets**: Generate properly formatted packets for authorities (FBI, DOJ, AG, etc.)
- **Master Index**: Comprehensive CSV tracking with printable index generation
- **Local & Cloud**: Works locally with browser storage or integrates with GitHub Actions pipeline

## Quick Start

### Local Development

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Start Development Server**
   ```bash
   npm run dev
   ```

3. **Upload Documents**
   - Navigate to "Upload & Process" tab
   - Drag and drop PDF files or click to browse
   - Documents are processed entirely in your browser

### GitHub Actions Pipeline (Production)

For automated processing:

1. **Setup Repository**
   - Create `input/` folder in your repository
   - Add PDF files using Git LFS
   - Configure `config.ci.yaml` with your settings

2. **Trigger Pipeline**
   - Push PDF files to the `input/` directory
   - GitHub Actions will automatically process documents
   - Results appear in `output/` folder and downloadable artifacts

## Document Classification

The system automatically categorizes documents:

- **Primary**: Direct evidence (police reports, medical exams, witness statements)
- **Supporting**: Related documentation that supports the case
- **External**: Media reports, news articles, external documentation  
- **No**: Administrative notices, scheduling documents (excluded from packets)

## Legal Detection

Automatically detects mentions of:

- **Laws**: Brady v. Maryland, Due Process, CAPTA, Perjury, Evidence Tampering
- **Children**: Configurable list of names to track across documents
- **Misconduct**: Patterns indicating potential legal violations

## Deployment Options

### Option A: Public Static Site (Recommended)

For public deployment without authentication:

1. The app uses localStorage for persistence (no GitHub auth required)
2. Can be deployed to any static hosting service
3. All PDF processing happens in the browser

### Option B: Spark Runtime (Private)

For internal use with GitHub authentication:

1. Requires users to sign in to GitHub
2. Uses Spark's persistent storage
3. Integrated with GitHub repository workflow

## File Structure

```
src/
├── components/ui/          # Shadcn UI components
├── hooks/
│   └── useKV.ts           # Local storage hook (fallback for Spark KV)
├── lib/
│   ├── pdfProcessor.ts    # PDF text extraction and processing
│   ├── sparkFallback.ts   # Fallback for non-Spark environments
│   └── utils.ts           # Utility functions
├── App.tsx                # Main application component
└── index.css              # Theme and styling

public/
├── app/data/
│   └── justice-documents.json  # Processed documents data
├── pdf.worker.min.js      # PDF.js worker
└── sample-police-report.html   # Test document
```

## Configuration

### Local Development
Edit documents and settings directly in the UI.

### Production Pipeline
Configure `config.ci.yaml`:

```yaml
packet_header:
  project_name: "Your Project Name"
  submitter_name: "Your Name"
  submitter_phone: "Your Phone"
  submitter_email: "your.email@domain.com"

recipients:
  - FBI — Field Office
  - U.S. DOJ — Civil Rights Division
  - State Attorney General
  # ... add your recipients

children:
  - "Child1"
  - "Child2"
  # ... add names to track
```

## Technical Details

- **Frontend**: React 19 with TypeScript
- **UI**: Shadcn/ui components with Tailwind CSS
- **PDF Processing**: PDF.js for browser-based text extraction
- **Storage**: localStorage (local) or Spark KV (cloud)
- **Build**: Vite with optimized production builds

## Security & Privacy

- **Local Processing**: PDF content is processed entirely in your browser
- **No External APIs**: All text extraction happens client-side
- **Configurable Storage**: Choose between local storage or secure cloud storage
- **No Data Collection**: The application doesn't send data to external services

## Support

This application is designed for legal professionals managing child welfare cases. All document processing respects privacy and security requirements for sensitive legal materials.

---

## License

MIT License - see LICENSE file for details.