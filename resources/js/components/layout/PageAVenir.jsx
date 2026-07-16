import AppShell from './AppShell';

export default function PageAVenir({ title }) {
  return (
    <AppShell title={title}>
      <div className="bg-white rounded-xl border border-ink900/10 p-10 text-center">
        <p className="text-ink900/50">Ce module arrive bientôt.</p>
      </div>
    </AppShell>
  );
}