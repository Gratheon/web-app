import posthog from 'posthog-js'
import isDev from './isDev';

export default {
	setUser: (user) => {
		posthog.identify(user.id,
			{ email: user.email },
		)
	},

	trackLogin: (extraInfo = {}) => {
		if (isDev()) return
		posthog.capture('user.logged_in', extraInfo)
	},
	trackRegistration: (extraInfo = {}) => {
		if (isDev()) return
		posthog.capture('user.registered', extraInfo)
	},
	trackApiaryCreated: (extraInfo = {}) => {
		if (isDev()) return
		posthog.capture('apiary.created', extraInfo)
	},

	trackBoxCreated: (extraInfo = {}) => {
		if (isDev()) return
		posthog.capture('box.created', extraInfo)
	},
	trackBoxRemoved: (extraInfo = {}) => {
		if (isDev()) return
		posthog.capture('box.removed', extraInfo)
	},

	trackFrameAdded: (extraInfo = {}) => {
		if (isDev()) return
		posthog.capture('frame.created', extraInfo)
	},
	trackFramePhotoUploaded: (extraInfo = {}) => {
		if (isDev()) return
		posthog.capture('frame.photoUploaded', extraInfo)
	},
	trackBillingClicked: (extraInfo = {}) => {
		if (isDev()) return
		posthog.capture('billing.clicked', extraInfo)
	}
}