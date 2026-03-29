export function computeHealth(entity: any) {
  const alerts = entity.alerts_open || 0;
  const fails = entity.failed_runs_24h || 0;

  // Critical
  if (alerts >= 3 || fails >= 3) return 'down';

  // Warning / Watch
  if (alerts > 0 || fails > 0) return 'watch';

  // Stale activity
  const last = new Date(entity.last_activity_at).getTime();
  const ageHours = (Date.now() - last) / 36e5;
  if (ageHours > 48) return 'paused';

  return 'healthy';
}
