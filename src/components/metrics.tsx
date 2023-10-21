import isDev from './isDev';
let amplitude
if (!isDev()) {
	amplitude = import('@amplitude/analytics-browser');

	amplitude.init('22c65699d4c0d9ee32ba08a9c3087dcd', {
		defaultTracking: true,
	}); // API key, should be safe to be public
}

export default {
	setUserId: (id) => { amplitude.setUserId(id) },

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
	}
}