import { bootstrapApplication } from '@angular/platform-browser';
import { App } from './app/app';
import { config } from './app/app.config.server';
import { ApplicationRef } from '@angular/core';

const bootstrap: () => Promise<ApplicationRef> = () =>
  bootstrapApplication(App, config);

export default bootstrap;
