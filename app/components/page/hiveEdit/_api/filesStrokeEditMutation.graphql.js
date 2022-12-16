import { gql } from '../../../api'

export default gql`
	mutation filesStrokeEditMutation($files: [FilesUpdateInput]) {
		filesStrokeEditMutation(files: $files)
	}
`
