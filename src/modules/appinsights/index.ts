import type * as AI from 'applicationinsights';
import type { IConfig } from 'config';

export class AppInsights {
  private async loadAI(): Promise<typeof AI> {
    const mod = await import('applicationinsights');
    return mod as unknown as typeof AI;
  }

  async enable(): Promise<void> {
    const { default: config } = (await import('config')) as {
      default: IConfig;
    };

    const key = 'app-insights-connection-string';
    if (config.has(key)) {
      const connStr = config.get<string>(key);
      if (connStr) {
        const ai = await this.loadAI();
        ai.setup(connStr).start();
      }
    }
  }
}
