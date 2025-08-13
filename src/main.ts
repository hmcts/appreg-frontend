<<<<<<< HEAD
import { bootstrapApplication } from "@angular/platform-browser";
import { appConfig } from "./app/app.config";
import { App } from "./app/app";
=======
import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
>>>>>>> 38048e2 (Rebasing Code)

bootstrapApplication(App, appConfig).catch((err) => console.error(err));
