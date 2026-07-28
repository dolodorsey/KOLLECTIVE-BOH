/**
 * Operating signal for an entity.
 *
 * The previous version read `alerts_open`, `failed_runs_24h` and
 * `last_activity_at` — none of which exist on the live entity record, so every
 * entity resolved to "healthy" regardless of its real state.
 *
 * This derives from what the record actually carries: its lifecycle and
 * whether anyone has said what it is currently working on.
 */
export type EntitySignal = 'live' | 'launching' | 'building' | 'seasonal' | 'portfolio' | 'needs_focus';

export function computeHealth(entity: any): EntitySignal {
  const status = String(entity?.status ?? '').toLowerCase();

  if (status === 'portfolio') return 'portfolio';
  if (status === 'seasonal') return 'seasonal';
  if (status === 'building') return 'building';
  if (status === 'launching' || status === 'available_now') return 'launching';

  // Live entities with no stated focus are the ones that need attention.
  if (status === 'active' || status === 'operating') {
    const focus = entity?.current_focus;
    return focus && String(focus).trim().length > 0 ? 'live' : 'needs_focus';
  }
  return 'portfolio';
}

export const SIGNAL_LABEL: Record<EntitySignal, string> = {
  live: 'Live',
  launching: 'Launching',
  building: 'Building',
  seasonal: 'Seasonal',
  portfolio: 'Portfolio',
  needs_focus: 'No focus set',
};

/** Lifecycle values the entity record actually uses. */
export const LIFECYCLES = [
  'all', 'active', 'operating', 'launching', 'available_now', 'building', 'seasonal', 'portfolio',
] as const;

export function lifecycleLabel(v: string) {
  if (v === 'all') return 'All';
  return v.split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}
