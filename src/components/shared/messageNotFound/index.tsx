import ForestIcon from "@/icons/forest";

export default function MessageNotFound({
	msg='Not found',
	children = null
}){
	return <div style="width:200px; margin: 80px auto;text-align:center;">
		<ForestIcon size={64} />
		<h2>{msg}</h2>
		{children}
	</div>
}