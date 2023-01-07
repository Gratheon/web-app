import React, { useState } from 'react'

import { gql, useMutation } from '@/components/api'
import VisualForm from '@/components/shared/visualForm'
import Loader from '@/components/shared/loader'
import ErrorMsg from '@/components/shared/messageError'
import Button from '@/components/shared/button'
import { saveToken } from '@/components/user'
import { getAppUri } from '@/components/uri'

type Account = {
	email?: string
	password?: string
}

export default function AccountAuth() {
	let [account, setAccount] = useState<Account>({})

	function onInput(e: any) {
		const { name, value } = e.target
		setAccount({
			...account,
			[name]: value,
		})
	}
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

	function onSubmit(e: React.ChangeEvent<HTMLFormElement>) {
		e.preventDefault()

		accountAuth({
			email: account.email,
			password: account.password,
		})
	}

	if (!account) {
		setAccount({
			email: '',
			password: '',
		})
	}

	if (!account || loading) {
		return <Loader />
	}

	let errorMsg

	if (data?.login?.key) {
		saveToken(data.login.key)

		//@ts-ignore
		window.location = getAppUri() + '/'
		return <Loader />
	} else if (data?.login?.code) {
		errorMsg = <ErrorMsg error="Invalid email or password" />
	}

	if (error) {
		errorMsg = <ErrorMsg error={error} />
	}

	return (
		<div>
			{errorMsg}
			<VisualForm onSubmit={onSubmit} style={{ padding: 15 }}>
				<div>
					<label htmlFor="email">Email</label>
					<input
						name="email"
						type="email"
						id="email"
						style={{ width: '100%' }}
						autoFocus
						value={account.email}
						onInput={onInput}
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
						onInput={onInput}
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
