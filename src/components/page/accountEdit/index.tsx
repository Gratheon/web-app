import React, { useState } from 'react'

import { gql, useMutation, useQuery } from '@/components/api'
import VisualForm from '@/components/shared/visualForm'
import Loader from '@/components/shared/loader'
import ErrorMsg from '@/components/shared/messageError'
import VisualFormSubmit from '@/components/shared/visualForm/VisualFormSubmit'
import Button from '@/components/shared/button'
import type { User } from '@/components/models/user'
import { updateUser } from '@/components/models/user'

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

	let errorMsg

	if (error) {
		errorMsg = <ErrorMsg error={error} />
	}

	const md5Hash = user.email ? calculateMD5(user.email) : '';
	const gravatarURL = `https://www.gravatar.com/avatar/${md5Hash}?s=200`;

	return (
		<div id={style.account_edit}>
			<h2>Account</h2>

			<div style="display:flex;">
				<img src={gravatarURL} style="border-radius:50px;width:100px;height:100px;" />

				<VisualForm style="display: table;" onSubmit={onSubmit}>
					{errorMsg}
					<div>
						<label htmlFor="name">Email</label>
						<input
							name="email"
							id="email"
							disabled={true}
							value={user.email}
						/>
					</div>
					<div>
						<label htmlFor="first_name">First name</label>
						<input
							name="first_name"
							id="first_name"
							placeholder="First name"
							autoFocus
							value={user.first_name}
							onInput={onInput}
						/>
					</div>
					<div>
						<label htmlFor="last_name">Last name</label>
						<input
							name="last_name"
							id="last_name"
							placeholder="Last name"
							autoFocus
							value={user.last_name}
							onInput={onInput}
						/>
					</div>
					<VisualFormSubmit>
						<Button type="submit" className={`green`} loading={saving}>
							Save
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
