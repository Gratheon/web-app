import React from 'react'
import { Component } from 'preact'

import { gql, useMutation } from '../../api'

import VisualForm from '../../shared/visualForm'
import Loader from '../../shared/loader'
import ErrorMsg from '../../shared/messageError'
import Button from '../../shared/button'
import { saveToken } from '../../user'
import { getAppUri } from '../../uri'

export default class AccountAuth extends Component {
	onInput = (e) => {
		const { name, value } = e.target
		this.setState({
			account: {
				...this.state.account,
				[name]: value,
			},
		})
	}

	render() {
		let [accountAuth, { loading, error, data }] = useMutation(gql`
			mutation login($email: String!, $password: String!) {
				login(email: $email, password: $password) {
					__typename
					... on Error {
						code
					}
					... on UserSession {
						key
					}
				}
			}
		`)

		function onSubmit(e) {
			e.preventDefault()

			accountAuth({
				email: this.state.account.email,
				password: this.state.account.password,
			})
		}

		if (!this.state.account) {
			this.setState({
				account: {
					email: '',
					password: '',
				},
			})
		}

		const account = this.state.account

		if (!account || loading) {
			return <Loader />
		}

		if (data?.login?.key) {
			saveToken(data.login.key)
			window.location = getAppUri() + '/'
			return <Loader />
		} else if (data?.login?.code) {
			errorMsg = <ErrorMsg error="Invalid email or password" />
		}

		let errorMsg

		if (error) {
			errorMsg = <ErrorMsg error={error} />
		}

		return (
			<div>
				{errorMsg}
				<VisualForm onSubmit={onSubmit.bind(this)} style={{ padding: 15 }}>
					<div>
						<label htmlFor="email">Email</label>
						<input
							name="email"
							type="email"
							id="email"
							style={{ width: '100%' }}
							autoFocus
							value={account.email}
							onInput={this.onInput}
						/>
					</div>
					<div>
						<label htmlFor="password">Password</label>
						<input
							name="password"
							id="password"
							type="password"
							style={{ width: '100%' }}
							autoFocus
							value={account.password}
							onInput={this.onInput}
						/>
					</div>
					<div style={{ display: 'flex' }}>
						<div style={{ flexGrow: 1 }}></div>
						<Button type="submit" className="green">
							Login
						</Button>
					</div>
				</VisualForm>
			</div>
		)
	}
}
