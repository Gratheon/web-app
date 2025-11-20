import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, gql } from 'urql';

import InspectionView from '../inspectionList/inspectionView';
import { saveShareToken } from '@/user';
import Loader from '@/shared/loader';
import MessageError from '@/shared/messageError';
import MessageNotFound from '@/shared/messageNotFound';
import InspectionBar from '@/page/inspectionList/inspectionBar';
import HiveIcon from '@/shared/hive';
import QueenColor from '@/page/hiveEdit/hiveTopInfo/queenColor';
import BeeCounter from '@/shared/beeCounter';
import DateTimeFormat from '@/shared/dateTimeFormat';
import T from '@/shared/translate';
import styles from '@/page/hiveEdit/hiveTopInfo/styles.module.less';

const ValidateInspectionShareQuery = gql`
  query ValidateInspectionShare($inspectionId: ID!, $hiveId: ID!) {
    inspection(inspectionId: $inspectionId) {
      id
      added
      data
    }
    hive(id: $hiveId) {
      id
      name
      beeCount
      boxes {
        id # Keep ID
        # name # Remove invalid field
        frames { # Replace framesCount with frames (requesting minimal subfield)
        	id
        }
      }
      family {
        id
        race
        added
      }
    }
  }
`;

export default function InspectionShare() {
	const { apiaryId, hiveId, inspectionId, shareToken } = useParams();
	console.log('InspectionShare: Mounted. Params:', { apiaryId, hiveId, inspectionId, shareToken });

	useEffect(() => {
		if (shareToken) {
			console.log("InspectionShare: useEffect - Saving shareToken from URL:", shareToken);
			try {
				saveShareToken(shareToken);
				console.log("InspectionShare: useEffect - shareToken saved successfully.");
			} catch (e) {
				console.error("InspectionShare: useEffect - Error saving shareToken:", e);
			}
		} else {
			console.log("InspectionShare: useEffect - No shareToken in params to save.");
		}
	}, [shareToken]);

	console.log(`InspectionShare: Preparing validation query. inspectionId: ${inspectionId}, pause: ${!inspectionId}`);
	const [result] = useQuery({
		query: ValidateInspectionShareQuery,
		variables: { inspectionId, hiveId },
		pause: !inspectionId || !hiveId,
		requestPolicy: 'cache-and-network',
	});

	const { data, fetching, error } = result;
	console.log('InspectionShare: Validation query state:', { fetching, error: error ? error : null, data: data ? data : null });

	if (fetching) {
		console.log('InspectionShare: Rendering Loader.');
		return <Loader />;
	}

	if (error) {
		console.error("InspectionShare: Rendering error message. Validation error:", error);
		let errorMessage = "This share link appears to be invalid or has expired.";
		if (error.graphQLErrors?.some(e => e.message.includes("unauthorized"))) {
			errorMessage = "Access denied. This share link may be invalid or you don't have permission.";
		} else if (error.networkError) {
			errorMessage = "Network error. Please check your connection and try again.";
		}
		return <MessageError error={new Error(errorMessage)} />;
	}

	if (data?.inspection?.id && data?.hive?.id && inspectionId) {
		console.log("InspectionShare: Validation successful. Rendering InspectionBar and InspectionView for inspectionId:", inspectionId);
		const inspectionData = data.inspection;
		const hiveData = data.hive;
		const familyData = hiveData?.family;
		const boxesData = hiveData?.boxes;

		return (
			<div style={{ maxWidth: '1000px', margin: '20px auto', padding: '0 15px' }}>
				{hiveData && (
					<div className={styles.horizontal_wrap} style={{ marginBottom: '15px' }}>
						<div className={styles.icon_wrap}>
							<HiveIcon boxes={boxesData} />
							<BeeCounter count={hiveData.beeCount} />
						</div>
						<div className={styles.name_race_wrap}>
							<div className={styles.wrap4} style={{ alignItems: 'center' }}> {/* Align items vertically */}
								<h1 style={{ flexGrow: 1, marginRight: '10px' }}>{hiveData.name}</h1> {/* Add margin */}
								{/* Inspection Time added here */}
								{inspectionData?.added && (
									<div style={{ marginLeft: 'auto', fontSize: '0.9em', color: '#555', whiteSpace: 'nowrap' }}> {/* Push right */}
										<DateTimeFormat datetime={inspectionData.added} />
									</div>
								)}
							</div>
							<div id={styles.raceYear}>
								{familyData?.race}
								{familyData?.race && familyData?.added && (
									<QueenColor year={familyData.added} />
								)}
								{familyData?.added}
							</div>
						</div>
					</div>
				)}

				<InspectionBar
					selected={false}
					apiaryId={apiaryId}
					hiveId={hiveId}
					id={inspectionData.id}
					added={inspectionData.added}
					data={inspectionData.data}
					hideDate={true}
					fullWidth={true}
					showPercentages={true}
					showLegend={true}
				/>
				<InspectionView
					apiaryId={apiaryId}
					hiveId={hiveId}
					inspectionId={inspectionId}
				/>
				{/* Footer Banner with CTA */}
				<div style={{ textAlign: 'center', padding: '20px', marginTop: '30px', fontSize: '12px', color: '#888', borderTop: '1px solid #eee' }}>
					Provided by <a href="https://gratheon.com" target="_blank" rel="noopener noreferrer" style={{ color: '#666', textDecoration: 'underline' }}>Gratheon</a>
					<a href="/account/register" style={{ marginLeft: '20px', padding: '5px 10px', background: '#3498db', color: 'white', textDecoration: 'none', borderRadius: '3px', fontSize: '11px' }}>
						Sign Up Free
					</a>
				</div>
			</div>
		);
	}

	if (!inspectionId || !hiveId) {
		console.error("InspectionShare: Rendering error message. Inspection ID or Hive ID is missing from URL params.");
		return <MessageError error={new Error("Required ID is missing from the URL.")} />;
	}

	console.warn("InspectionShare: Rendering MessageNotFound. Validation query returned no data or ID mismatch.");
	return <MessageNotFound msg="The requested inspection or hive could not be found." />;

}
