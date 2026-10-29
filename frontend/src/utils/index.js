/**
 * Shared utility functions.
 */

/** Format an ISO date string to a readable date */
export function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

/** Format ISO to date + time */
export function formatDateTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

/** Convert seconds to mm:ss string */
export function formatDuration(seconds) {
  if (seconds == null) return '—';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s < 10 ? '0' : ''}${s}s`;
}

/** Build a percentage string */
export function pct(value) {
  if (value == null) return '—';
  return `${Number(value).toFixed(1)}%`;
}

/** Clamp a number between min and max */
export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

/** Generate initials from a name */
export function initials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
}

/** Map status string to badge class */
export function statusBadgeClass(status) {
  const map = {
    published: 'badge-success',
    draft:     'badge-neutral',
    archived:  'badge-warning',
    submitted: 'badge-success',
    in_progress: 'badge-primary',
    expired:   'badge-error',
  };
  return `badge ${map[status] || 'badge-neutral'}`;
}
