import * as amplitude from '@amplitude/analytics-browser';
amplitude.init('22c65699d4c0d9ee32ba08a9c3087dcd', {
	defaultTracking: true,
  }); // API key, should be safe to be public

export default {
	setUserId: amplitude.setUserId,
	track: amplitude.track,

	trackLogin: (extraInfo={})=>{ amplitude.track('user.logged_in', extraInfo)},
	trackRegistration: (extraInfo={})=>{ amplitude.track('user.registered', extraInfo)},
	trackApiaryCreated: (extraInfo={})=>{ amplitude.track('apiary.created', extraInfo)},
	trackBoxCreated: (extraInfo={})=>{ amplitude.track('box.created', extraInfo)},
	trackFrameAdded: (extraInfo={})=>{ amplitude.track('frame.created', extraInfo)},
	trackFramePhotoUploaded: (extraInfo={})=>{ amplitude.track('frame.photoUploaded', extraInfo)}
}