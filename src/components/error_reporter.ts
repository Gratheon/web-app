import * as Sentry from "@sentry/react";
import { Dedupe } from "@sentry/integrations";

import isDev from './isDev.ts'

export default function initErrorReporting() {
	if (isDev()) {
		return;
	}

	Sentry.init({
		environment: "production",
		dsn: "https://801a5f0788de882d5021e79cf557d719@o4504323550216192.ingest.sentry.io/4506093924122624",
		integrations: [
			Sentry.browserTracingIntegration(),
			Sentry.replayIntegration(),
		],
		// Performance Monitoring
		tracesSampleRate: 1.0, // Capture 100% of the transactions

		// Session Replay
		replaysSessionSampleRate: 0.1, // This sets the sample rate at 10%. You may want to change it to 100% while in development and then sample at a lower rate in production.
		replaysOnErrorSampleRate: 1.0, // If you're not already sampling the entire session, change the sample rate to 100% when sampling sessions where errors occur.
	});
}