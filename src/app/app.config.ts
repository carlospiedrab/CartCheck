import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import {
  MAT_FORM_FIELD_DEFAULT_OPTIONS,
  MatFormFieldDefaultOptions,
} from '@angular/material/form-field';
import { MatIconRegistry } from '@angular/material/icon';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';

const formFieldDefaults: MatFormFieldDefaultOptions = {
  appearance: 'outline',
  floatLabel: 'always',
  subscriptSizing: 'dynamic',
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    { provide: MAT_FORM_FIELD_DEFAULT_OPTIONS, useValue: formFieldDefaults },
    // Material Symbols en lugar de la fuente clásica de Material Icons.
    provideAppInitializer(() => {
      inject(MatIconRegistry).setDefaultFontSetClass('material-symbols-outlined');
    }),
  ],
};
