export class UpdateChecker {
  constructor({ notifier, source, intervalMin }) {
    this.notifier = notifier;
    this.source = source;
    this.intervalMs = Math.max(60_000, intervalMin * 60_000);
    this.active = false;
    this.timer = null;
    this.lastKey = '';
  }

  async checkOnce() {
    try {
      const result = await this.source.check();
      if (!result || !result.hasUpdate || !result.key || result.key === this.lastKey) {
        return {
          checked: true,
          hasUpdate: false,
        };
      }

      this.lastKey = result.key;
      this.notifier.notify({
        level: 'warning',
        title: result.title,
        message: result.message,
        ttlMs: result.ttlMs || 8000,
      });
      return {
        checked: true,
        hasUpdate: true,
        key: result.key,
      };
    } catch (_error) {
      return {
        checked: false,
        hasUpdate: false,
      };
    }
  }

  start() {
    this.active = true;
    this.checkOnce();
    this.timer = setInterval(() => {
      if (this.active) {
        this.checkOnce();
      }
    }, this.intervalMs);

    return {
      stop: () => this.stop(),
      runNow: () => this.checkOnce(),
      getInstallCommand: () => this.getInstallCommand(),
    };
  }

  stop() {
    this.active = false;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  getInstallCommand() {
    if (!this.source || typeof this.source.getInstallCommand !== 'function') {
      return '';
    }
    return this.source.getInstallCommand();
  }
}
