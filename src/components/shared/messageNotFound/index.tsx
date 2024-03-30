import ForestIcon from "@/icons/forest";
import T from "../translate";

export default function MessageNotFound({
	msg='Not found',
	children = null
}){
	return <div style="width:400px; margin: 80px auto;text-align:center;">
		<ForestIcon size={64} />
		<h2><T>{msg}</T></h2>
		{children}
	</div>
}