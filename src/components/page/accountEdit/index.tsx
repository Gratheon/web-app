import React, { useState } from 'react'

import { gql, useMutation, useQuery } from '@/components/api'
import VisualForm from '@/components/shared/visualForm'
import Loader from '@/components/shared/loader'
import ErrorMsg from '@/components/shared/messageError'
import VisualFormSubmit from '@/components/shared/visualForm/VisualFormSubmit'
import Button from '@/components/shared/button'
import type { User } from '@/components/models/user'
import { updateUser } from '@/components/models/user'
import T from '@/components/shared/translate'

import TokenList from './token_list'
import Billing from './billing'
import Invoices from './invoices'
import md5 from 'md5';
import style from './style.less'

function calculateMD5(email) {
	return md5(email.trim().toLowerCase());
}

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

	let { loading: loadingGet, data: accountData } = useQuery(gql`
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
			}
		}
	`)

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

		await updateUser(user)
		setSaving(false);
	}

	if (accountData && !user.id) {
		setUser(accountData.user)
	}

	if (!user.id || loadingGet) {
		return <Loader />
	}


	const md5Hash = user.email ? calculateMD5(user.email) : '';
	const gravatarURL = `https://www.gravatar.com/avatar/${md5Hash}?s=200`;

	return (
		<div id={style.account_edit}>
			<h2><T>Account</T></h2>
			<ErrorMsg error={error} />
			<div style="display:flex;">
				<img src={gravatarURL} style="border-radius:50px;width:100px;height:100px;" />

				<VisualForm style="display: table;" onSubmit={onSubmit}>
					<div>
						<label style="width:120px;" htmlFor="first_name"><T ctx="this is a label for the person full name">Name</T></label>
						<input
							name="first_name"
							id="first_name"
							style="width:40%; margin-right: 5px;"
							placeholder="First name"
							autoFocus
							value={user.first_name}
							onInput={onInput}
						/>
						<input
							name="last_name"
							id="last_name"
							style="width:40%"
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
							<option value="en" selected={user.lang == "en"}>English</option>
							<option value="ru" selected={user.lang == "ru"}>Русский</option>
							<option value="et" selected={user.lang == "et"}>Eesti</option>
							<option value="tr" selected={user.lang == "tr"}>Türkçe</option>
							<option value="pl" selected={user.lang == "pl"}>Polski</option>
						</select>
					</div>
					<VisualFormSubmit>
						<Button type="submit" className={`green`} loading={saving}>
							<T>Save</T>
						</Button>
					</VisualFormSubmit>
				</VisualForm>
			</div>

			<Billing user={user} />
			<Invoices />
			<TokenList />
		</div>
	)
}
