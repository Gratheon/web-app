import { useState } from 'react';
import Button from '@/components/shared/button';
import T from '@/components/shared/translate';
import isDev from '@/components/isDev';

async function analyzeCrops({ lat, lng }) {
	// Define the URL of your backend API
	const apiUrl = isDev() ? 'http://0.0.0.0:9500' : 'https://satellite.gratheon.com';

	// Make a POST request using the fetch API
	return await fetch(apiUrl, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			// You can add other headers if needed
		},
		body: JSON.stringify({ lat, lng }),
	})
};

export default function PollinationTab({
	lat, lng
}) {
	const [analyzing, setAnalyzing] = useState(false)
	const [loaded, setLoaded] = useState(false)
	const [apr, setApr] = useState('')
	const [may, setMay] = useState('')
	const [jun, setJun] = useState('')
	const [class_names_en, setClsNames] = useState([])
	const [icons, setIcons] = useState([])


	return <div style="padding:20px;text-align:center;min-height: 300px;">
		{/* {!loaded && false && <p>
			We can classify satellite imagery to classify fields and forest areas by type.
			By knowing environment, you can predict nectar flow, honey composition and optimize for pollen diversity for bee health.
			Position your hives for max efficiency of pollination.
		</p>} */}

		{/* {loaded && false && <div style="color:red; padding:5px; border:1px solid red;border-radius:3px;margin: 5px 0;">
			Warning! Industrial plant detected<br />
			Warning! Pollen diversity is too low for healthy bee colony
		</div>} */}

		{/* {loaded && <div>

			<div style="max-height:250px;overflow: auto;">
				<table className={style.table}>
					<tr>
						<th></th>
						<th>Plant</th>
						<th>Percentage</th>
						<th>Nectar production (kg/ha)</th>
						<th colSpan={7}>Blooming time</th>
					</tr>
					<tr>
						<th></th>
						<th></th>
						<th></th>
						<th></th>

						<th>Apr</th>
						<th>Mar</th>
						<th>Jun</th>
						<th>Jul</th>
						<th>Aug</th>
						<th>Sep</th>
						<th>Oct</th>
					</tr>

					{class_names_en.map((k, i) => {
						return (<tr>
							<td>
								{icons[i]}
							</td>
							<td>{k}</td>
							<td>{Math.floor(Math.random() * 10)}%</td>
							<td>{Math.floor(Math.random() * 100)}</td>


							<th></th>
							<th>🟩</th>
							<th>🟩</th>
							<th></th>
							<th></th>
							<th></th>
							<th></th>
						</tr>)
					})}
				</table>
			</div>


			<div style="font-size: 20px; background: green; color:white; font-weight: bold; padding: 10px; text-align:center;">
					Expected nectar: 80kg
				</div>
		</div>
		} */}

		{apr &&
			<div style="display: flex;">
				<table>
					<tr>
						<th>April</th>
						{/* <th>Pollination map</th> */}
						<th>May</th>
						<th>June</th>
					</tr>
					<tr>
						<td><img src={apr} alt="Base64 Image" /></td>
						{/* <td>
							<div style="background:url('https://gratheon.com/example.png') center;width:512px;height:512px;"></div>
						</td> */}
						<td><img src={may} alt="Base64 Image" /></td>
						<td><img src={jun} alt="Base64 Image" /></td>
					</tr>
				</table>

			</div>}

		<Button
			onClick={async () => {
				setAnalyzing(true);
				setLoaded(false);
				const response = await analyzeCrops({ lat, lng });

				if (!response.ok) {
					throw new Error('Network response was not ok');
				}
				let parsedJSON = await response.json();

				setApr('data:image/png;base64,' + parsedJSON?.apr)
				setMay('data:image/png;base64,' + parsedJSON?.may)
				setJun('data:image/png;base64,' + parsedJSON?.jun)

				setClsNames(parsedJSON?.class_names_en)
				setIcons(parsedJSON?.icons)

				setAnalyzing(false)
				setLoaded(true);
			}}
			loading={analyzing}
			color="green"><T>Load historical field map</T></Button>
	</div>
}