import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { NodeSDK } from '@opentelemetry/sdk-node';

// OpenTelemetry SDK — exports traces over OTLP. The collector address comes
// from OTEL_EXPORTER_OTLP_ENDPOINT; the SDK reads it automatically.
//
// Auto-instrumentation covers http, express, ioredis, and pg. Disable via
// OTEL_DISABLE=1 (e.g. in tests).
let sdk;

export async function startTracing(service) {
  if (process.env.OTEL_DISABLE === '1') return;
  sdk = new NodeSDK({
    serviceName: service,
    instrumentations: [
      getNodeAutoInstrumentations({
        '@opentelemetry/instrumentation-fs': { enabled: false },
      }),
    ],
  });
  await sdk.start();
  process.on('SIGTERM', () => sdk?.shutdown().catch(() => undefined));
}
