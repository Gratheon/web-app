import React, { useState } from 'react'

import { gql, useMutation, useQuery } from '../../api'

import VisualForm from '../../shared/visualForm'
import Loader from '../../shared/loader'
import ErrorMsg from '../../shared/messageError'
import VisualFormSubmit from '../../shared/visualForm/VisualFormSubmit'
import Button from '../../shared/button'
import Billing from './billing'
import Invoices from './invoices'

type User = {
	id?: string
	email?: string
	first_name?: string
	last_name?: string
	date_expiration?: string
	date_added?: string
	hasSubscription?: boolean
	isSubscriptionExpired?: boolean
}

export default function AccountEdit() {
	let [user, setUser] = useState<User>({})

	function onInput(e: any) {
		const { name, value } = e.target

		setUser({
			...user,
			[name]: value,
		})
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

	let [updateAccount, { loading, error }] = useMutation(gql`
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

	function onSubmit(e: React.ChangeEvent) {
		e.preventDefault()

		updateAccount({
			user: {
				first_name: user?.first_name,
				last_name: user?.last_name,
			},
		})
	}

	if (accountData && !user) {
		setUser(accountData.user)
	}

	if (!user || loading || loadingGet) {
		return <Loader />
	}

	let errorMsg

	if (error) {
		errorMsg = <ErrorMsg error={error} />
	}

	return (
		<div style={{ padding: 20 }}>
			<h2>Account</h2>
			<VisualForm onSubmit={onSubmit}>
				{errorMsg}
				<div>
					<label htmlFor="name">Email</label>
					{user.email}
				</div>
				<div>
					<label htmlFor="name">Name</label>
					<input
						name="first_name"
						id="first_name"
						placeholder="First name"
						style={{ width: '100%', marginRight: 10 }}
						autoFocus
						value={user.first_name}
						onInput={onInput}
					/>
					<input
						name="last_name"
						id="last_name"
						placeholder="Last name"
						style={{ width: '100%' }}
						autoFocus
						value={user.last_name}
						onInput={onInput}
					/>
				</div>
				<VisualFormSubmit>
					<Button type="submit" className={`green`}>
						Save
					</Button>
				</VisualFormSubmit>
			</VisualForm>

			<Billing user={user} />
			<Invoices />
		</div>
	)
}
