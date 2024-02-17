import * as Sentry from "@sentry/react";
import { Dedupe } from "@sentry/integrations";

import isDev from './isDev'

export default function initErrorReporting() {
	if (isDev()) {
		return;
	}

	Sentry.init({
		environment: "production",
		dsn: "https://801a5f0788de882d5021e79cf557d719@o4504323550216192.ingest.sentry.io/4506093924122624",
		integrations: [
			new Sentry.BrowserTracing({
				// Set 'tracePropagationTargets' to control for which URLs distributed tracing should be enabled
				tracePropagationTargets: ["localhost", /^https:\/\/yourserver\.io\/api/],
			}),
			new Sentry.Replay(),
			new Dedupe()
		],
		// Performance Monitoring
		tracesSampleRate: 1.0, // Capture 100% of the transactions

		transport: Sentry.makeBrowserOfflineTransport(Sentry.makeFetchTransport),
		transportOptions:{
			maxQueueSize: 100,
		},
		// Session Replay
		replaysSessionSampleRate: 0.1, // This sets the sample rate at 10%. You may want to change it to 100% while in development and then sample at a lower rate in production.
		replaysOnErrorSampleRate: 1.0, // If you're not already sampling the entire session, change the sample rate to 100% when sampling sessions where errors occur.
	});
}