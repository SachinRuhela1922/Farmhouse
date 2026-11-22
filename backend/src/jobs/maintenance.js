import { runMaintenance } from '../services/bookingService.js'

/**
 * Daily housekeeping: completes finished stays and expires pending requests whose
 * check-in date has passed (releasing their nights). Runs shortly after start, then every 6h
 * (idempotent, so frequency is harmless). Disable with RUN_JOBS=false when running multiple instances.
 */
export function startJobs() {
  const run = () => runMaintenance().then((r) => (r.completed || r.expired) && console.log('[jobs] maintenance', r)).catch((e) => console.error('[jobs]', e.message))
  setTimeout(run, 10_000).unref()
  setInterval(run, 6 * 3600 * 1000).unref()
}
