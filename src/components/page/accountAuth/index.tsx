import React, { useState } from 'react'
import { gql, useMutation } from '@/components/api'
import metrics from '@/components/metrics'
import { useNavigate } from 'react-router'

import Loader from '@/components/shared/loader'
import ErrorMsg from '@/components/shared/messageError'
import Button from '@/components/shared/button'
import { saveToken } from '@/components/user'
import T from '@/components/shared/translate'
import VisualFormSubmit from '@/components/shared/visualForm/VisualFormSubmit'
import { logout } from '@/components/user'
import { Link } from 'react-router-dom'

import style from './styles.less'
import { getAppUri } from '@/components/uri'

type Account = {
	email?: string
	password?: string
}

export default function AccountAuth() {
	let [account, setAccount] = useState<Account>({
		email: '',
		password: ''
	})

	const navigate = useNavigate()
	let [loading, setLoading] = useState(false)

	function onInput(e: any) {
		const { name, value } = e.target
		account[name] = value;
	}
	let [accountAuth, { error, data, loading: loadingMutation }] = useMutation(gql`
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


	let errorMsg
	let pathAfterLogin = ''

	async function onSubmit(e: React.ChangeEvent<HTMLFormElement>) {
		e.preventDefault()
		setLoading(true)

		pathAfterLogin = localStorage.getItem('redirect-after-login')
		// await logout()

		await accountAuth({
			email: account.email,
			password: account.password,
		})

		setLoading(false)
	}

	if (!account) {
		return <Loader />
	}

	if (data?.login?.key) {
		// clear DB on login and on logout to have consistent structure in case of alters
		saveToken(data.login.key)

		if (data.login.user.id) metrics.setUserId(data.login.user.id);
		metrics.trackLogin()

		React.useEffect(
			() => {
				//@ts-ignore
				// window.location = getAppUri() + pathAfterLogin
				pathAfterLogin = localStorage.getItem('redirect-after-login')
				if(pathAfterLogin){
					navigate(pathAfterLogin, { replace: true })
					localStorage.removeItem('redirect-after-login')
				} else {
					navigate('/apiaries', { replace: true })
				}
			},
			[navigate]
		)

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
					<img src="/assets/logo_v7.svg" id={style.logo} draggable={false} />

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
									loading={loading || loadingMutation}
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
				<div className={style.linkToRegister}>
					<Link to="/account/register"><T>Create new account</T></Link>
				</div>
			</div>
		</div>
	)
}
