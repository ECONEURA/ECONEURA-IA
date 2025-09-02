export default function Page() {
  return (
    <main style={{fontFamily:'system-ui, sans-serif', padding: 24}}>
  <h1 style={{fontSize: 28, fontWeight: 700}}>ECONEURA Cockpit</h1>
      <p style={{marginTop: 8, color: '#555'}}>Snapshot baseline para Playwright (≤2% diff).</p>
      <section style={{marginTop: 24, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16}}>
        {[1,2,3,4,5,6].map(i => (
          <div key={i} style={{border:'1px solid #e5e7eb', borderRadius: 8, padding: 16}}>
            <h2 style={{fontSize: 16, fontWeight: 600}}>Widget {i}</h2>
            <p style={{fontSize: 13, color:'#666'}}>Contenido estable para snapshot.</p>
          </div>
        ))}
      </section>
  {/* Cockpit avanzado en /app/(cockpit) */}
    </main>
  );
}
