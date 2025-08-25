# 📋 WHERE ARE THE DOCUMENTS? - COMPLETE GUIDE

## **CURRENT STATUS**

Your Justice Document Manager has **multiple document sources** but they need to be loaded:

### **Available Document Sources:**

1. **✅ Input Text Files** (Ready to Load)
   - Location: `/input/` directory 
   - Files: 5 text documents with CPS reports, police reports, medical exams
   - Status: **Ready to import** 

2. **❌ GitHub Pipeline** (Empty)
   - Location: `/app/data/justice-documents.json`
   - Expected: PDF files processed by GitHub Actions
   - Status: **Empty `[]`** - needs PDF files in input/ directory

3. **✅ Sample Demo Data** (Ready to Load)
   - Built-in sample documents for testing
   - Includes tampering detection examples
   - Status: **Ready to load**

4. **❌ Local Browser Storage** (Likely Empty)
   - Documents uploaded through the web interface
   - Status: **Likely empty** (browser localStorage)

---

## **🔧 IMMEDIATE SOLUTIONS**

### **Option 1: Load Your Input Documents** ⭐ **RECOMMENDED**
**Click the green "Load Input Documents" button** in the app header.

**What it does:**
- Reads the 5 text files from `/input/` directory
- Converts them to document objects with analysis
- Detects children names (Noel, Josh, etc.)
- Identifies applicable laws
- Categorizes as Primary/Supporting evidence
- Creates version history entries

**Files that will be loaded:**
- `CPS_Report_01.08.2024_Initial.txt`
- `CPS_Report_01.08.2024_Amended.txt` 
- `PoliceReport_12.15.2023_Original.txt`
- `PoliceReport_12.15.2023_Revised.txt`
- `Medical_Exam_03.10.2024.txt`

### **Option 2: Load Demo Data for Testing**
**Click "Load Date-Based Samples"** or **"Load Sample Tampering Data"**

**What it includes:**
- Complete document sets with known tampering patterns
- Perfect for testing comparison algorithms
- Includes version history and analysis data
- Ready for advanced tampering detection

### **Option 3: Upload New PDFs**
Go to **Upload & Process** tab and drag/drop PDF files for local processing.

---

## **🔍 WHY DOCUMENTS AREN'T SHOWING**

### **GitHub Pipeline Issue:**
- **Expected**: PDF files in `/input/` directory
- **Found**: Text files only
- **Result**: Pipeline doesn't process `.txt` files

### **Solution**: 
Either:
1. **Use the text import button** (easiest)
2. **Convert text to PDF** and re-commit
3. **Upload PDFs directly** through the web interface

---

## **📊 AFTER LOADING DOCUMENTS**

Once you load documents, you'll see:

### **Dashboard View:**
- Document cards with titles, categories, badges
- Version tracking indicators
- Content search capabilities
- Filter and sort options

### **Available Features:**
- **🔍 Content Search**: Search within document text
- **📊 Reports & Analytics**: Generate comprehensive reports  
- **🔬 Tampering Detection**: Advanced pattern analysis
- **📋 Version History**: Track all document changes
- **⚖️ Oversight Packets**: Generate agency-ready reports

### **Sample Analysis Results:**
After loading, you can:
- Run tampering detection on the CPS report versions
- Compare original vs amended versions
- Generate executive summaries for oversight agencies
- Export comprehensive evidence reports

---

## **🚀 QUICK START WORKFLOW**

1. **Click "Load Input Documents"** (green button)
2. **Wait for success message** ("✅ Loaded X documents...")
3. **Go to Dashboard tab** to see your documents
4. **Click any document** to view details and content
5. **Use "Detect Tampering"** to analyze for alterations
6. **Export reports** for oversight agencies

---

## **🔧 TECHNICAL DETAILS**

### **Document Processing:**
- Automatic text analysis and categorization
- Children name detection (Noel, Josh, Nicholas, etc.)
- Law violation identification (Brady, Due Process, CAPTA, etc.)
- Placement rule assignment (Master File, Exhibit Bundle, Oversight)

### **Tampering Detection:**
- Date-based document comparison
- Name mention frequency analysis  
- Evidence numbering consistency checks
- Content change pattern detection

### **Export Capabilities:**
- Executive summaries for decision makers
- Technical analysis reports
- Evidence summary CSV files
- Raw JSON data for databases

---

## **❗ TROUBLESHOOTING**

### **"No documents found"**
- Click "Load Input Documents" button
- Check browser console for errors
- Ensure input files are accessible at `/public/input/`

### **"Failed to load"**
- Try refreshing the page
- Clear browser cache
- Check network connectivity

### **"Pipeline documents empty"** 
- Normal for new installations
- Use local loading methods instead
- Add PDFs to input/ directory for future pipeline processing

---

Your documents exist and are ready to load - just click the **"Load Input Documents"** button! 🎯