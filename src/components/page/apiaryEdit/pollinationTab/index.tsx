import style from './style.less'

export default function PollinationTab() {
	return <div style="padding:20px;">
		<h3>Pollination area</h3>
		<div style="color:orange; padding:5px; border:1px solid orange;">
			Warning! Industrial plant detected
		</div>
		<div style="color:orange; padding:5px; border:1px solid orange;">
			Warning! Pollen diversity is too low for healthy bee colony
		</div>
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
			<tr>
				<td><div style="background:yellow;width:15px;height:15px;"></div></td>
				<td>barley</td>
				<td>10%</td>
				<td>20</td>


				<th></th>
				<th>🟩</th>
				<th>🟩</th>
				<th></th>
				<th></th>
				<th></th>
				<th></th>
			</tr>
			<tr>
				<td><div style="background:yellow;width:15px;height:15px;"></div></td>
				<td>corn</td>
				<td>10%</td>
				<td>60</td>


				<th></th>
				<th>🟩</th>
				<th>🟩</th>
				<th></th>
				<th></th>
				<th></th>
				<th></th>
			</tr>
			<tr>
				<td><div style="background:yellow;width:15px;height:15px;"></div></td>
				<td>buckwheat</td>
				<td>20%</td>
				<td>80</td>


				<th></th>
				<th>🟩</th>
				<th>🟩</th>
				<th></th>
				<th></th>
				<th></th>
				<th></th>
			</tr>
			<tr>
				<td><div style="background:green;width:15px;height:15px;"></div></td>
				<td>clover</td>
				<td>15%</td>

				<th>100</th>
				<th>🟩</th>
				<th>🟩</th>
				<th>🟩</th>
				<th>🟩</th>
				<th></th>
				<th></th>
			</tr>
			<tr>
				<td><div style="background:purple;width:15px;height:15px;"></div></td>
				<td>heather (Calluna vulgaris)</td>
				<td>15%</td>
				<td>60—100</td>

				<th></th>
				<th>🟩</th>
				<th>🟩</th>
				<th></th>
				<th></th>
				<th></th>
				<th></th>
			</tr>
			<tr>
				<td><div style="background:lime;width:15px;height:15px;"></div></td>
				<td>wild grassland</td>
				<td>5%</td>
				<td>20</td>

				<th></th>
				<th>🟩</th>
				<th>🟩</th>
				<th>🟩</th>
				<th>🟩</th>
				<th>🟩</th>
				<th></th>
			</tr>
			<tr>
				<td><div style="background:black;width:15px;height:15px;"></div></td>
				<td>forest</td>
				<td>5%</td>
				<td>40</td>

				<th></th>
				<th>🟩</th>
				<th>🟩</th>
				<th></th>
				<th></th>
				<th></th>
				<th></th>
			</tr>
			<tr>
				<td><div style="background:blue;width:15px;height:15px;"></div></td>
				<td>river</td>
				<td>5%</td>
				<td>40</td>
			</tr>
			<tr>
				<td><div style="background:light-gray;width:15px;height:15px;"></div></td>
				<td>road</td>
				<td>8%</td>
				<td>0</td>
			</tr>
			<tr>
				<td><div style="background:gray;width:15px;height:15px;"></div></td>
				<td>building</td>
				<td>2%</td>
				<td>0</td>
			</tr>
			<tr>
				<td></td>
				<td style="border-top:2px solid black;">Expected nectar</td>
				<td style="border-top:2px solid black;"></td>
				<td style="border-top:2px solid black;">80 kg / month</td>
			</tr>
		</table>

	</div>
}