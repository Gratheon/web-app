//todo migrate from component
import React from 'react' // Assuming this should be preact based on Component import
import { Component, ComponentChildren } from 'preact'

// Define Props and State interfaces
interface DragAndDropProps {
  handleDrop: (files: FileList) => void; // Expects a function taking FileList
  children: ComponentChildren;
}

interface DragAndDropState {
  drag: boolean;
}

export default class DragAndDrop extends Component<DragAndDropProps, DragAndDropState> {
	state: DragAndDropState = { // Initialize state with type
		drag: false,
	}
	dropRef = React.createRef<HTMLDivElement>() // Add type to ref
	dragCounter = 0; // Initialize counter

	handleDrag = (e: DragEvent) => { // Add event type
		e.preventDefault()
		e.stopPropagation()
	}
	handleDragIn = (e: DragEvent) => { // Add event type
		e.preventDefault()
		e.stopPropagation()
		this.dragCounter++
		// Add null check for dataTransfer
		if (e.dataTransfer?.items && e.dataTransfer.items.length > 0) {
			this.setState({ drag: true })
		}
	}
	handleDragOut = (e: DragEvent) => { // Add event type
		e.preventDefault()
		e.stopPropagation()
		this.dragCounter--
		if (this.dragCounter === 0) {
			this.setState({ drag: false })
		}
	}
	handleDrop = (e: DragEvent) => { // Add event type
		e.preventDefault()
		e.stopPropagation()
		this.setState({ drag: false })
		// Add null check for dataTransfer
		if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
			this.props.handleDrop(e.dataTransfer.files) // Pass the FileList
			e.dataTransfer.clearData()
			this.dragCounter = 0
		}
	}

	componentDidMount() {
		let div = this.dropRef.current
		// Add null check for current
		if (div) {
			div.addEventListener('dragenter', this.handleDragIn)
			div.addEventListener('dragleave', this.handleDragOut)
			div.addEventListener('dragover', this.handleDrag)
			div.addEventListener('drop', this.handleDrop)
		}
	}

	componentWillUnmount() {
		let div = this.dropRef.current
		// Add null check for current
		if (div) {
			div.removeEventListener('dragenter', this.handleDragIn)
			div.removeEventListener('dragleave', this.handleDragOut)
			div.removeEventListener('dragover', this.handleDrag)
			div.removeEventListener('drop', this.handleDrop)
		}
	}

	render() {
		return (
			<div style={{ position: 'relative' }} ref={this.dropRef}>
				{this.state.drag && (
					<div
						style={{
							border: 'dashed grey 4px',
							backgroundColor: 'rgba(255,255,255,.8)',
							position: 'absolute',
							top: 0,
							bottom: 0,
							left: 0,
							right: 0,
							zIndex: 9999,
						}}
					>
						<div
							style={{
								position: 'absolute',
								top: '50%',
								right: 0,
								left: 0,
								textAlign: 'center',
								color: 'grey',
								fontSize: 36,
							}}
						>
							<div>drop file here..</div>
						</div>
					</div>
				)}
				{this.props.children}
			</div>
		)
	}
}
