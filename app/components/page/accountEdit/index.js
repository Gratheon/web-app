import React from 'react'
import { Component } from 'preact'

import { gql, useMutation, useQuery } from '../../api'

import VisualForm from '../../shared/visualForm'
import Loader from '../../shared/loader'
import ErrorMsg from '../../shared/messageError'
import VisualFormSubmit from '../../shared/visualForm/VisualFormSubmit'
import Button from '../../shared/button'
import Billing from './billing'
import Invoices from './invoices'

export default class AccountEdit extends Component {
	onInput = (e) => {
		const { name, value } = e.target
		this.setState({
			user: {
				...this.state.user,
				[name]: value,
			},
		})
	}

	render() {
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

		function onSubmit(e) {
			e.preventDefault()

			updateAccount({
				user: {
					first_name: this.state.user.first_name,
					last_name: this.state.user.last_name,
				},
			})
		}

		if (accountData && !this.state.user) {
			this.setState({
				user: accountData.user,
			})
		}

		const user = this.state.user

		if (!user || loading || loadingGet) {
			return <Loader />
		}

		let errorMsg

		if (error) {
			errorMsg = <ErrorMsg error={error} />
		}

		return (
			<div style="padding:20px;">
				<h2>Account</h2>
				<VisualForm onSubmit={onSubmit.bind(this)}>
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
							onInput={this.onInput}
						/>
						<input
							name="last_name"
							id="last_name"
							placeholder="Last name"
							style={{ width: '100%' }}
							autoFocus
							value={user.last_name}
							onInput={this.onInput}
						/>
					</div>
					<VisualFormSubmit>
						<Button type="submit" class="green">
							Save
						</Button>
					</VisualFormSubmit>
				</VisualForm>

				<Billing user={user} />
				<Invoices />
			</div>
		)
	}
}
