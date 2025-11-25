import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection, inject } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideHttpClient } from '@angular/common/http';

import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { getAuth, provideAuth } from '@angular/fire/auth';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes), 
    provideHttpClient(),
    provideFirebaseApp(() => initializeApp({
      apiKey: "AIzaSyD4HO7sZ9IHD5xral5ksFD7rG8q7WuqkfA",
      authDomain: "wikicards-1e17c.firebaseapp.com",
      projectId: "wikicards-1e17c",
      storageBucket: "wikicards-1e17c.firebasestorage.app",
      messagingSenderId: "435510501230",
      appId: "1:435510501230:web:d599a6364f63868209ab7f",
      measurementId: "G-PPS9Z2DSHE"
    })),
    provideFirestore(() => getFirestore()),
    provideAuth(() => getAuth())
  ]
};
