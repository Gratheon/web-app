import React, { useState } from 'react'

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

export default function AccountRegister() {
	let [account, setAccount] = useState<Account>({})

	function onInput(e: any) {
		const { name, value } = e.target
		setAccount({
			...account,
			[name]: value,
		})
	}

	let [accountAuth, { error, data }] = useMutation(gql`
		mutation register($email: String!, $password: String!) {
			register(email: $email, password: $password) {
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

	function onSubmit(e: any) {
		e.preventDefault()

		accountAuth({
			email: account?.email,
			password: account?.password,
		})
	}

	if (!account) {
		setAccount({
			email: '',
			password: '',
		})
	}

	if (!account) {
		return <Loader />
	}

	let errorMsg

	if (data?.register?.key) {
		saveToken(data.register.key)
		//@ts-ignore
		window.location = getAppUri() + '/'
		return <Loader />
	} else if (data?.register?.code) {
		errorMsg = <ErrorMsg error="Invalid email or password" />
	}

	if (error) {
		errorMsg = <ErrorMsg error={error} />
	}

	return (
		<div style={{ padding: 15, width: '300px' }}>
			{errorMsg}
			<VisualForm onSubmit={onSubmit}>
				<input style="display: none" type="text" name="email" />
				<input style="display: none" type="password" name="password" />

				<div>
					<label htmlFor="email"><T>Email</T></label>
					<input
						type="email"
						name="email"
						autoFocus
						value={account.email}
						onInput={onInput}
						autocomplete="off"
					/>
				</div>
				<div>
					<label htmlFor="password"><T>Password</T></label>
					<input
						name="password"
						type="password"
						autoFocus
						value={account.password}
						onInput={onInput}
						autocomplete="new-password"
					/>
				</div>
			</VisualForm>

			<div style={{ display: 'flex' }}>
				<div style={{ flexGrow: 1 }}></div>
				<Button type="submit" className="green" onClick={onSubmit}>
					<T>Register</T>
				</Button>
			</div>
		</div>
	)
}
