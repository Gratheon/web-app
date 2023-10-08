import React, { useState, useEffect, useRef } from 'react'

import { gql, useMutation } from '@/components/api'
import VisualForm from '@/components/shared/visualForm'
import Loader from '@/components/shared/loader'
import ErrorMsg from '@/components/shared/messageError'
import Button from '@/components/shared/button'
import { saveToken } from '@/components/user'
import { getAppUri } from '@/components/uri'
import T from '@/components/shared/translate'

type Account = {
	email?: string
	password?: string
}

export default function AccountAuth() {
	let [account, setAccount] = useState<Account>({
		email: '',
		password: ''
	})

	function onInput(e: any) {
		const { name, value } = e.target
		account[name] = value;
	}
	let [accountAuth, { error, data }] = useMutation(gql`
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
		return <Loader />
	}

	let errorMsg

	if (data?.login?.key) {
		saveToken(data.login.key)

		//@ts-ignore
		window.location = getAppUri() + '/'
		return <Loader />
	} else if (data?.login?.code === 'INVALID_USERNAME_PASSWORD') {
		errorMsg = <ErrorMsg error="Invalid email or password" />
	}

	if (error) {
		errorMsg = <ErrorMsg error={error} />
	}

	return (
		<div style={{ padding: 15, width: '300px' }}>
			{errorMsg}
			<VisualForm onSubmit={onSubmit}>
				<div>
					<label htmlFor="email"><T>Email</T></label>
					<input
						name="email"
						type="email"
						id="email"
						value={account.email}
						onChange={onInput}
					/>
				</div>
				<div>
					<label htmlFor="password"><T>Password</T></label>
					<input
						name="password"
						id="password"
						type="password"
						value={account.password}
						onChange={onInput}
					/>
				</div>
			</VisualForm>

			<div style={{ display: 'flex' }}>
				<div style={{ flexGrow: 1 }}></div>
				<Button type="submit" className="green" onClick={onSubmit}>
					<T>Login</T>
				</Button>
			</div>
		</div>
	)
}
