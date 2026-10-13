import { InjectionToken } from '@angular/core';

/**
 * When `true`, every products-API endpoint fails so the error + retry UI can be
 * exercised. Defaults to `false`; `app.config.ts` enables it with the
 * `?simulateFailure=true` query param, and tests override it with a provider.
 */
export const SIMULATE_API_FAILURE = new InjectionToken<boolean>('SIMULATE_API_FAILURE', {
  providedIn: 'root',
  factory: () => false,
});
