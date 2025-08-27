# Contradiction Timeline Visualization

This feature provides a visual timeline chart showing when and where contradictions cluster over time.

## Components

### 1. Timeline Visualization Script
**File:** `scripts/visualize_timeline.py`

- Reads `public/data/contradictions.json`
- Extracts dates from contradiction records (from `date_a`, `date_b`, and statement dates)
- Outputs `public/data/contradictions_timeline.json` with format:
  ```json
  [
    {
      "date": "2024-01-15",
      "ids": ["date-001", "date-002"],
      "count": 2,
      "rule_names": ["Event Date Disagreement"],
      "contradictions": [...]
    }
  ]
  ```

### 2. Frontend Components

#### ContradictionTimeline.tsx
- Interactive timeline chart using recharts (LineChart or BarChart)
- X-axis: dates, Y-axis: number of contradictions
- Toggle between bar and line chart views
- Rich tooltips showing:
  - Date and contradiction count
  - Rule types involved
  - Contradiction IDs
- Summary statistics (total, peak, date range)

#### ContradictionsTable.tsx
- Tabular view of all detected contradictions
- Columns: ID, Type, Description, Dates, People Involved
- Color-coded badges for different contradiction types
- Shows conflicting dates and involved personnel

### 3. Integration
Both components are integrated into the main dashboard in `src/App.tsx`, positioned below the document upload section for easy access.

## Usage

1. Run the visualization script:
   ```bash
   python3 scripts/visualize_timeline.py
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. View the timeline on the Document Dashboard tab

## Features Delivered

✅ **Script Creation**: `scripts/visualize_timeline.py` processes contradictions.json  
✅ **Timeline Data**: Generates `public/data/contradictions_timeline.json`  
✅ **React Component**: Interactive timeline chart with recharts  
✅ **Chart Types**: Both line and bar chart visualization  
✅ **Rich Tooltips**: Shows IDs, rule names, and counts  
✅ **Table View**: Detailed contradictions table below timeline  
✅ **Dashboard Integration**: Wired up in main app interface  
✅ **Visual Polish**: Professional styling consistent with app theme  

The implementation successfully shows contradiction clustering over time, making it easy to identify patterns and peak periods of conflicting information.