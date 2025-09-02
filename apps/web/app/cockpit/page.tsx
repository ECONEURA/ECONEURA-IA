import dynamic from 'next/dynamic';
const AgentKillToggle = dynamic(() => import('./components/AgentKillToggle'), { ssr: false });

export default function CockpitPage() {
  return (
    <main className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">ECONEURA — Cockpit</h1>
      <section className="space-y-2">
        <h2 className="text-lg font-semibold">CFO · Dunning</h2>
        <AgentKillToggle agentKey="cfo_dunning" />
      </section>
    </main>
  );
}
