import React, { useState, useEffect, useRef } from 'react'
import { gql, useMutation } from '@/components/api'
import metrics from '@/components/metrics'

import VisualForm from '@/components/shared/visualForm'
import Loader from '@/components/shared/loader'
import ErrorMsg from '@/components/shared/messageError'
import Button from '@/components/shared/button'
import { saveToken } from '@/components/user'
import { getAppUri } from '@/components/uri'
import T from '@/components/shared/translate'
import VisualFormSubmit from '@/components/shared/visualForm/VisualFormSubmit'
import { logout } from '@/components/user'
import { Link } from 'react-router-dom'

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
					user{
						__typename
						id
					}
				}
			}
		}
	`)

	function onSubmit(e: React.ChangeEvent<HTMLFormElement>) {
		e.preventDefault()

		logout().then(() => {
			accountAuth({
				email: account.email,
				password: account.password,
			})
		})
	}

	if (!account) {
		return <Loader />
	}

	let errorMsg

	if (data?.login?.key) {
		// clear DB on login and on logout to have consistent structure in case of alters
		saveToken(data.login.key)

		if(data.login.user.id) metrics.setUserId(data.login.user.id);
		metrics.trackLogin()

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
					<label htmlFor="email" style="width:100px;"><T>Email</T></label>
					<input
						style="width:100%;"
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
						style="width:100%;"
						name="password"
						id="password"
						type="password"
						value={account.password}
						onChange={onInput}
					/>
				</div>

				<VisualFormSubmit>
					<Button type="submit" className="green" onClick={onSubmit}>
						<T>Login</T>
					</Button>
				</VisualFormSubmit>
			</VisualForm>

			<div style="margin-top:15px;border-top:1px solid #ccc; text-align:center;padding-top:15px;color:gray;">Not a user?	<Link to="/account/register">Register</Link></div>
		</div>
	)
}
