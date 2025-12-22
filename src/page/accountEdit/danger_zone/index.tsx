import Button from "../../../shared/button";
import { logout } from "../../../user.ts";
import { useConfirm } from "../../../hooks/useConfirm";
import styles from "./style.module.less"
import T from "../../../shared/translate";
import { gql, useMutation } from "../../../api";
import ErrorMsg from "../../../shared/messageError";

export default function DangerZone() {
	const { confirm, ConfirmDialog } = useConfirm()

	let [deleteSelf, { error }] = useMutation(gql`
		mutation deleteUserSelf {
			deleteUserSelf{
				code
			}
		}
	`)


	async function deleteAccount() {
		const confirmed = await confirm(
			"Are you sure you want to delete your account? This action is irreversible.",
			{ confirmText: 'Delete Account', isDangerous: true }
		)

		if (confirmed) {
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
	<Button color='red' onClick={async () => await deleteAccount()}><T>Delete Account</T></Button>
	{ConfirmDialog}
	</div>
}