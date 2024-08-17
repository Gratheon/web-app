import Button from "../../../shared/button";
import { logout } from "../../../user.ts";
import styles from "./style.module.less"
import T from "../../../shared/translate";
import { gql, useMutation } from "../../../api";
import ErrorMsg from "../../../shared/messageError";

export default function DangerZone() {

	let [deleteSelf, { error }] = useMutation(gql`
		mutation deleteUserSelf {
			deleteUserSelf{
				code
			}
		}
	`)


	async function deleteAccount() {
		if (confirm("Are you sure you want to delete your account?")) {
			const deleteResultError = await deleteSelf()

			if(!error && !deleteResultError?.code){
				await logout()
				window.location.reload()
			}
		}
	}

	return <div id={styles.danger_zone}>
		<ErrorMsg error={error} />
		<div>
			<h3><T>Danger Zone</T></h3>
			<p><T>Here you can delete your account. This action is irreversible, your sensitive data will be removed.</T></p>
		</div>
		<Button color='red' onClick={deleteAccount}><T>Delete Account</T></Button>
	</div>
}