export function computeAlertSeverity(alert: any) {
  if (!alert) return 'neutral';

  if (alert.severity === 'critical') return 'danger';
  if (alert.severity === 'warning') return 'warning';

  if (alert.alerts_open >= 3) return 'danger';
  if (alert.alerts_open >= 1) return 'warning';

  return 'neutral';
}
