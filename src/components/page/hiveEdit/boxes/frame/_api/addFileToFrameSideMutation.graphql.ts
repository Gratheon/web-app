import { gql } from '../../../../../api'

export default gql`
	mutation ($fileId: ID!, $frameSideId: ID!, $hiveId: ID!) {
		addFileToFrameSide(
			fileId: $fileId
			frameSideId: $frameSideId
			hiveId: $hiveId
		)
	}
`
