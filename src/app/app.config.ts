import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideAuth, getAuth } from '@angular/fire/auth';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';
import { environment } from '../environments/environment';

import { routes } from './app.routes';
import { registerLocaleData } from '@angular/common';
import localeTr from '@angular/common/locales/tr';
import localeEnGb from '@angular/common/locales/en-GB';
import localeDe from '@angular/common/locales/de';
import localeFr from '@angular/common/locales/fr';
import localeEs from '@angular/common/locales/es';
import localeIt from '@angular/common/locales/it';
import localeNl from '@angular/common/locales/nl';
import localeAr from '@angular/common/locales/ar';

// Locale data for date/number pipes in every supported UI language.
[localeTr, localeEnGb, localeDe, localeFr, localeEs, localeIt, localeNl, localeAr].forEach(l => registerLocaleData(l));
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideClientHydration(withEventReplay()),
    provideFirebaseApp(() => initializeApp(environment.firebase)),
    provideAuth(() => getAuth()),
    provideFirestore(() => getFirestore())
  ]
};
