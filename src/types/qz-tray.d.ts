declare module "qz-tray" {
  interface QzPrintConfig {
    [key: string]: unknown;
  }

  interface QzWebSocket {
    connect(options?: Record<string, unknown>): Promise<void>;
    disconnect(): Promise<void>;
    isActive(): boolean;
  }

  interface QzPrinters {
    find(query?: string): Promise<string | string[]>;
    getDefault(): Promise<string>;
  }

  interface QzConfigs {
    create(printer: string, options?: Record<string, unknown>): QzPrintConfig;
  }

  interface QzSecurity {
    setCertificatePromise(promiseHandler: (resolve: (cert: string) => void, reject: (err: unknown) => void) => void): void;
    setSignaturePromise(promiseFactory: (toSign: string) => (resolve: (sig: string) => void, reject: (err: unknown) => void) => void): void;
    setSignatureAlgorithm(algorithm: string): void;
  }

  const qz: {
    websocket: QzWebSocket;
    printers: QzPrinters;
    configs: QzConfigs;
    security: QzSecurity;
    print(config: QzPrintConfig, data: (string | Record<string, unknown>)[]): Promise<void>;
  };

  export default qz;
}
