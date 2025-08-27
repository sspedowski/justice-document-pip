/**
 * Simple test page to demo the ContradictionsTable component
 */
import React from 'react';
import { ContradictionsTable } from './ContradictionsTable';

export function ContradictionsDemo() {
  return (
    <div style={{ padding: '20px' }}>
      <h1>Contradictions Analysis Demo</h1>
      
      <h2>All Contradictions (with IDs)</h2>
      <ContradictionsTable scored={false} showId={true} />
      
      <h2>Scored Contradictions (top 5)</h2>
      <ContradictionsTable scored={true} limit={5} showId={false} />
    </div>
  );
}