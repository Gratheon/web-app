import ForestIcon from "@/icons/forest";
import T from "../translate";

export default function MessageNotFound({
	msg,
	children = null
}){
	return <div style="width:400px; margin: 80px auto;text-align:center;">
		<ForestIcon size={64} />
		<h2>{msg}</h2>
		{children}
	</div>
}