import type { IConfig } from "config";
import type * as AI from "applicationinsights";
import { createRequire } from "module";

const require = createRequire(import.meta.url);

export class AppInsights {
  async enable(): Promise<void> {
    const { default: config } = (await import("config")) as {
      default: IConfig;
    };
    const appInsights = require("applicationinsights") as typeof AI;

    const key = "app-insights-connection-string";
    if (config.has(key)) {
      const connStr = config.get<string>(key);
      if (connStr) {
        appInsights.setup(connStr).start();
      }
    }
  }
}
