import { gql } from '@/components/api'

export default gql`
	mutation filesStrokeEditMutation($files: [FilesUpdateInput]) {
		filesStrokeEditMutation(files: $files)
	}
`
