import { useEffect, useState, useMemo } from 'react';
import { loadData, Contradiction } from '@/lib/data';

interface Props {
  scored?: boolean;
  limit?: number;
  showId?: boolean;
}

function severityColor(sev: string) {
  switch (sev) {
    case 'high': return '#d32f2f';
    case 'medium': return '#ed6c02';
    default: return '#1976d2';
  }
}

export function ContradictionsTable({ scored = true, limit, showId = false }: Props) {
  const [rows, setRows] = useState<Contradiction[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    loadData('/data')
      .then(d => {
        let source: Contradiction[] = [];
        if (scored && d.contradictionsScored?.length) source = d.contradictionsScored;
        else source = d.contradictions;
        if (limit) source = source.slice(0, limit);
        setRows(source);
      })
      .catch(e => setError(String(e)))
      .finally(() => setLoading(false));
  }, [scored, limit]);

  const headers = useMemo(() => {
    const base = ['Score','Rule','Severity','Key','Rationale'];
    return showId ? ['ID', ...base] : base;
  }, [showId]);

  if (loading) return <div>Loading contradictions...</div>;
  if (error) return <div style={{color:'red'}}>Error: {error}</div>;
  if (!rows.length) return <div>No contradictions found.</div>;

  return (
    <div style={{overflowX:'auto'}}>
      <table style={{borderCollapse:'collapse', width:'100%'}}>
        <thead>
          <tr>
            {headers.map(h => (
              <th key={h} style={{textAlign:'left', borderBottom:'1px solid #ccc', padding:'4px 8px'}}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((c, i) => {
            const cells: JSX.Element[] = [];
            if (showId) {
              cells.push(
                <td key="id" style={{padding:'4px 8px', fontFamily:'monospace', fontSize:'0.7rem'}}>
                  {c.contradiction_id?.slice(0,8) || '-'}
                </td>
              );
            }
            cells.push(
              <td key="score" style={{padding:'4px 8px', fontWeight:600}}>
                {c.score !== undefined ? c.score.toFixed(2) : '-'}
              </td>
            );
            cells.push(
              <td key="rule" style={{padding:'4px 8px'}}>
                <div style={{fontWeight:600}}>{c.title || c.rule}</div>
                {c.description && <div style={{fontSize:'0.7rem', opacity:0.7}}>{c.description}</div>}
              </td>
            );
            cells.push(
              <td key="sev" style={{padding:'4px 8px', color: severityColor(c.severity)}}>
                {c.severity}
              </td>
            );
            cells.push(
              <td key="key" style={{padding:'4px 8px'}}>{c.key}</td>
            );
            cells.push(
              <td key="rat" style={{padding:'4px 8px'}}>
                <div>{c.rationale}</div>
                {c.suggested_action && (
                  <div style={{fontSize:'0.65rem', marginTop:4, color:'#555'}}>
                    Action: {c.suggested_action}
                  </div>
                )}
              </td>
            );
            return (
              <tr key={c.contradiction_id || i} style={{background: i % 2 ? '#fafafa' : 'white'}}>
                {cells}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}