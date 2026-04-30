export default function Home() {
  return (
    <main style={{ padding: '40px', fontFamily: 'system-ui' }}>
      <h1>🚀 AACG Platform</h1>
      <p>Mechanics Liens, Photo AI, and Legal Workflows with 20 AI Agents</p>

      <section style={{ marginTop: '30px' }}>
        <h2>System Status</h2>
        <ul>
          <li>✅ Next.js 14 Application Server Running</li>
          <li>✅ API Routes Available</li>
          <li>✅ Database Connection Testing</li>
          <li>✅ Phase 1 Infrastructure Tests Ready</li>
        </ul>
      </section>

      <section style={{ marginTop: '30px' }}>
        <h2>Available Endpoints</h2>
        <ul>
          <li><code>GET /api/health</code> - Health check endpoint</li>
          <li><code>GET /api/db/health</code> - Database connection status</li>
          <li><code>GET /api/stripe/health</code> - Stripe integration status</li>
          <li><code>GET /api/supabase/health</code> - Supabase connection status</li>
        </ul>
      </section>

      <section style={{ marginTop: '30px', padding: '20px', backgroundColor: '#f0f9ff', borderRadius: '8px' }}>
        <h2>🧪 Running Tests</h2>
        <p>Execute Phase 1 Infrastructure Validation:</p>
        <code>npm run test:phase1</code>
      </section>
    </main>
  );
}
