import { registerLocaleData } from '@angular/common';
import { BootstrapContext, bootstrapApplication } from '@angular/platform-browser';
import localeEnGb from '@angular/common/locales/en-GB';
import localeFr from '@angular/common/locales/fr';
import { App } from './app/app';
import { config } from './app/app.config.server';

registerLocaleData(localeEnGb);
registerLocaleData(localeFr);

const bootstrap = (context: BootstrapContext) => bootstrapApplication(App, config, context);

export default bootstrap;
