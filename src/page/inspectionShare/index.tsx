import React, { useEffect } from 'react'; // Import useEffect
import { useParams } from 'react-router-dom';
import { useQuery, gql } from 'urql'; // Import useQuery and gql

import InspectionView from '../inspectionList/inspectionView';
import { saveShareToken } from '../../user.ts';
import Loader from '../../shared/loader'; // Corrected path
import MessageError from '../../shared/messageError'; // Corrected path and potential component name
import MessageNotFound from '../../shared/messageNotFound'; // Corrected path and potential component name

// Simple query to validate the token by fetching the inspection ID
const ValidateInspectionShareQuery = gql`
  query ValidateInspectionShare($inspectionId: ID!) {
    inspection(inspectionId: $inspectionId) {
      id # Fetch minimal data just for validation
    }
  }
`;

export default function InspectionShare() {
	const { apiaryId, hiveId, inspectionId, shareToken } = useParams();
	console.log('InspectionShare: Mounted. Params:', { apiaryId, hiveId, inspectionId, shareToken });

	// Save the token from the URL to localStorage when the component mounts or token changes
	useEffect(() => {
		if (shareToken) {
			console.log("InspectionShare: useEffect - Saving shareToken from URL:", shareToken);
			try {
				saveShareToken(shareToken);
				console.log("InspectionShare: useEffect - shareToken saved successfully.");
				// Optional: Clear the token from the URL after saving?
				// window.history.replaceState({}, document.title, window.location.pathname.replace(`/share/${shareToken}`, ''));
			} catch (e) {
				console.error("InspectionShare: useEffect - Error saving shareToken:", e);
			}
		} else {
			console.log("InspectionShare: useEffect - No shareToken in params to save.");
		}
	}, [shareToken]);

	console.log(`InspectionShare: Preparing validation query. inspectionId: ${inspectionId}, pause: ${!inspectionId}`);
	// Execute the validation query
	const [result] = useQuery({
		query: ValidateInspectionShareQuery,
		variables: { inspectionId },
		// Important: Only run this query if we have an inspectionId
		pause: !inspectionId,
		// Use cache-and-network or network-only to ensure validation hits the backend
		// especially if the user might have accessed this inspection before via login
		requestPolicy: 'cache-and-network',
	});

	const { data, fetching, error } = result;
	console.log('InspectionShare: Validation query state:', { fetching, error: error ? error : null, data: data ? data : null });

	if (fetching) {
		console.log('InspectionShare: Rendering Loader.');
		// Use Loader component, assuming it doesn't need specific text prop like this
		return <Loader />;
	}

	if (error) {
		console.error("InspectionShare: Rendering error message. Validation error:", error);
		// Attempt to provide a more user-friendly message based on common errors
		let errorMessage = "This share link appears to be invalid or has expired.";
		if (error.graphQLErrors?.some(e => e.message.includes("unauthorized"))) {
			// Specific message if backend explicitly returned unauthorized
			errorMessage = "Access denied. This share link may be invalid or you don't have permission.";
		} else if (error.networkError) {
			errorMessage = "Network error. Please check your connection and try again.";
		}
		// Use MessageError component, passing the actual error object
		// The component handles displaying details internally
		return <MessageError error={new Error(errorMessage)} />; // Wrap custom message in an Error object if needed, or pass the original 'error'
	}

	// If data exists and there's no error, the token is considered valid for this inspection
	if (data?.inspection?.id && inspectionId) {
		console.log("InspectionShare: Validation successful. Rendering InspectionView for inspectionId:", inspectionId);
		// Render the actual InspectionView
		return (
			<InspectionView
				apiaryId={apiaryId}
				hiveId={hiveId}
				inspectionId={inspectionId}
				// isSharedView={true} // Optional prop if InspectionView needs different behavior
			/>
		);
	}

	// Fallback case if inspectionId is missing or data is unexpected
	if (!inspectionId) {
		console.error("InspectionShare: Rendering error message. Inspection ID is missing from URL params.");
		// Use MessageError for general errors like missing ID
		return <MessageError error={new Error("Inspection ID is missing from the URL.")} />;
	}

	// If data is null/undefined after fetching without error (shouldn't usually happen with cache-and-network unless inspection genuinely doesn't exist)
	console.warn("InspectionShare: Rendering MessageNotFound. Validation query returned no data or inspection ID mismatch.");
	return <MessageNotFound msg="The requested inspection could not be found." />; // Use msg prop

}
