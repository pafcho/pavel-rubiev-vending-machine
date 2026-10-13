import { DOCUMENT } from '@angular/common';
import { inject, provideZoneChangeDetection } from '@angular/core';
import type { ApplicationConfig } from '@angular/core';
import { SIMULATE_API_FAILURE } from './core/simulate-api-failure.token.ts';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    {
      // Open the app with `?simulateFailure=true` to exercise the error + retry UI.
      provide: SIMULATE_API_FAILURE,
      useFactory: () =>
        new URLSearchParams(inject(DOCUMENT).location.search).get('simulateFailure') === 'true',
    },
  ],
};
