export function computeSystemHealth({ alerts, runs }: { alerts: number; runs: { failed: number } }) {
  if (alerts >= 5) return 'danger';
  if (runs.failed > 3) return 'warning';
  return 'ok';
}
