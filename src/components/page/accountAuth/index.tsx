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

import style from './styles.less'

type Account = {
	email?: string
	password?: string
}

export default function AccountAuth() {
	let [account, setAccount] = useState<Account>({
		email: '',
		password: ''
	})

	let [loading, setLoading] = useState(false)

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

	async function onSubmit(e: React.ChangeEvent<HTMLFormElement>) {
		e.preventDefault()
		setLoading(true)

		await logout()
		await accountAuth({
			email: account.email,
			password: account.password,
		})
		setLoading(false)
	}

	if (!account) {
		return <Loader />
	}

	let errorMsg

	if (data?.login?.key) {
		// clear DB on login and on logout to have consistent structure in case of alters
		saveToken(data.login.key)

		if (data.login.user.id) metrics.setUserId(data.login.user.id);
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
		<div className={style.loginPage}>
			<div className={style.loginModal}>
				<div className={style.loginModalWithLogo}>
					<img src="/assets/logo_v5.svg" id={style.logo} draggable={false} />

					<div className={style.loginModalInternal}>
						{errorMsg}
						<form method="POST" onSubmit={onSubmit}>
							<div>
								<input
									style="width:100%;"
									name="email"
									type="email"
									id="email"
									placeholder="Email"
									value={account.email}
									onChange={onInput}
								/>
							</div>
							<div>
								<input
									style="width:100%;"
									name="password"
									id="password"
									type="password"
									placeholder="Password"
									value={account.password}
									onChange={onInput}
								/>
							</div>

							<VisualFormSubmit>
								<Button 
									loading={loading}
									type="submit" 
									color="green" 
									onClick={onSubmit}>
									<T>Log In</T>
								</Button>
							</VisualFormSubmit>
						</form>
					</div>
					<div className={style.balancer}></div>
				</div>
				<div className={style.linkToRegister}><Link to="/account/register"><T>Create new account</T></Link></div>
			</div>
		</div>
	)
}
