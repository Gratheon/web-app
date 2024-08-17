import * as amplitude from '@amplitude/analytics-browser'

import isDev from './isDev';

// API key, should be safe to be public
amplitude.init('22c65699d4c0d9ee32ba08a9c3087dcd', {
	instanceName: isDev() ? "dev" : "prod",
	defaultTracking: true,
	flushQueueSize: 30, // flush queued events when there are 30 or more
});

export default {
	setUserId: (id) => {
		function padNumber(number, width) {
			return number.toString().padStart(width, '0');
		}
		amplitude.setUserId(padNumber(id, 5))
	},

	trackLogin: (extraInfo = {}) => {
		if (isDev()) return
		amplitude.track('user.logged_in', extraInfo)
	},
	trackRegistration: (extraInfo = {}) => {
		if (isDev()) return
		amplitude.track('user.registered', extraInfo)
	},
	trackApiaryCreated: (extraInfo = {}) => {
		if (isDev()) return
		amplitude.track('apiary.created', extraInfo)
	},
	trackBoxCreated: (extraInfo = {}) => {
		if (isDev()) return
		amplitude.track('box.created', extraInfo)
	},
	trackFrameAdded: (extraInfo = {}) => {
		if (isDev()) return
		amplitude.track('frame.created', extraInfo)
	},
	trackFramePhotoUploaded: (extraInfo = {}) => {
		if (isDev()) return
		amplitude.track('frame.photoUploaded', extraInfo)
	},
	trackBillingClicked: (extraInfo = {}) => {
		if (isDev()) return
		amplitude.track('billing.clicked', extraInfo)
	}
}