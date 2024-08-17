import React, { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'

import { gql, useMutation, useQuery } from '@/api'
import VisualForm from '@/shared/visualForm'
import Loader from '@/shared/loader'
import ErrorMsg from '@/shared/messageError'
import Button from '@/shared/button'
import type { User } from '@/models/user'
import { getUser, updateUser } from '@/models/user'
import T from '@/shared/translate'
import VisualFormSubmit from '@/shared/visualForm/VisualFormSubmit'

import TokenList from './token_list'
import Billing from './billing'
import Invoices from './invoices'
import style from './style.module.less'
import DangerZone from './danger_zone'

export default function AccountEdit() {
	let [user, setUser] = useState<User>({})
	let [saving, setSaving] = useState<boolean>(false)

	function onInput(e: any) {
		const { name, value } = e.target;

		setUser((prevState) => ({
			...prevState,
			[name]: value,
		}));
	}

	let { loading } = useQuery(gql`
		query user {
			user {
				id
				email
				first_name
				last_name
				lang
				date_expiration
				date_added
				hasSubscription
				isSubscriptionExpired
				billingPlan
			}
		}
	`)


	if(loading){
		return <Loader />
	}

	let userStored = useLiveQuery(() =>  getUser(), [], null)

	let [updateAccount, { error }] = useMutation(gql`
		mutation updateUser($user: UserUpdateInput!) {
			updateUser(user: $user) {
				... on User {
					email
				}

				... on Error {
					code
				}
			}
		}
	`)

	async function onSubmit(e: React.ChangeEvent) {
		e.preventDefault()

		setSaving(true);
		await updateAccount({
			user: {
				first_name: user?.first_name,
				last_name: user?.last_name,
				lang: user?.lang,
			},
		})

		await updateUser({
			...userStored,
			...user
		})
		setSaving(false);
	}

	if(userStored && !user.id){
		setUser(userStored)
	}

	if (!user || !userStored || loading) {
		return <Loader />
	}

	return (
		<div id={style.account_edit}>

			<ErrorMsg error={error} />
			<div style="padding: 10px; border: 1px solid black; margin-bottom: 5px; border-radius: 5px;">
				<div style="display:flex;">
					<VisualForm style="display: table;width:auto;flex-grow:1" onSubmit={onSubmit}>
						<div>
							<label style="width:120px;" htmlFor="first_name"><T ctx="this is a label for the person full name">Name</T></label>
							<input
								name="first_name"
								id="first_name"
								style="width:150px; margin-right: 5px;"
								placeholder="First name"
								autoFocus
								value={user.first_name}
								onInput={onInput}
							/>
							<input
								name="last_name"
								id="last_name"
								style="width:150px"
								placeholder="Last name"
								autoFocus
								value={user.last_name}
								onInput={onInput}
							/>
						</div>
						<div>
							<label htmlFor="name"><T>Email</T></label>
							<input
								name="email"
								id="email"
								disabled={true}
								value={user.email}
							/>
						</div>
						<div>
							<label htmlFor="last_name"><T>Language</T></label>
							<select name="lang" onInput={onInput}>
								<option value="de" selected={user.lang == "de"}>Deutsch</option>
								<option value="en" selected={user.lang == "en"}>English</option>
								<option value="et" selected={user.lang == "et"}>Eesti</option>
								<option value="fr" selected={user.lang == "fr"}>Français</option>
								<option value="pl" selected={user.lang == "pl"}>Polski</option>
								<option value="ru" selected={user.lang == "ru"}>Русский</option>
								<option value="tr" selected={user.lang == "tr"}>Türkçe</option>
							</select>
						</div>

						<VisualFormSubmit>
							<Button type="submit" color='green' loading={saving}>
								<T>Save</T>
							</Button>
						</VisualFormSubmit>
					</VisualForm>
				</div>
			</div>

			<Billing user={userStored} />
			<Invoices />
			<TokenList />
			<DangerZone />
		</div>
	)
}
