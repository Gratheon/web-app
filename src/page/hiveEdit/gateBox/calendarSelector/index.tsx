
export default function CalendarSelector() {
	return 	<>
		<div>February</div>
		<div style="display: flex;">
			
			<div> &larr; </div>

			{["14", "15", "16", "17", "18"].map((v) => {
				return <div style="border:1px solid gray; border-radius:3px;padding:5px;">{v}</div>;
			})}

			<div> &rarr; </div>
		</div>
	</>
}