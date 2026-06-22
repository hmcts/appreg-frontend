import { bootstrapApplication } from '@angular/platform-browser';

import { App } from './app/app';
import { appConfig } from './app/app.config';
import { installGlobalModuleLoadErrorListeners } from './app/core/util/global-error-listeners';

installGlobalModuleLoadErrorListeners();
bootstrapApplication(App, appConfig).catch((err) => console.error(err));
