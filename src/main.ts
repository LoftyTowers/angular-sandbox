import { registerLocaleData } from '@angular/common';
import { bootstrapApplication } from '@angular/platform-browser';
import localeEnGb from '@angular/common/locales/en-GB';
import localeFr from '@angular/common/locales/fr';
import { appConfig } from './app/app.config';
import { App } from './app/app';

registerLocaleData(localeEnGb);
registerLocaleData(localeFr);

void bootstrapApplication(App, appConfig);
