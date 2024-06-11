import React, { useState } from 'react'

import { gql, useMutation } from '@/components/api'

import Loader from '@/components/shared/loader'
import ErrorMsg from '@/components/shared/messageError'
import Button from '@/components/shared/button'
import { saveToken } from '@/components/user'
import { getAppUri } from '@/components/uri'
import T, { useTranslation } from '@/components/shared/translate'
import metrics from '@/components/metrics'
import styles from './styles.less'

import { useNavigate } from 'react-router-dom'
import isDev from '@/components/isDev'

type Account = {
	first_name: string
	last_name: string
	email: string
	password: string
	password2: string
}

export default function AccountRegister() {
	let [account, setAccount] = useState<Account>({
		first_name: '',
		last_name: '',
		email: '',
		password: '',
		password2: ''
	})
	let [highlight, setHighlight] = useState({
		email: false,
		password: false,
		password2: false,
	})
	let [errorOnClient, setErrorOnClient] = useState<string>('')
	let navigate = useNavigate()

	let tFirstName = useTranslation('First name')
	let tLastName = useTranslation('Last name')
	let tEmail = useTranslation('Email') + '*'
	let tPassword = useTranslation('Password') + '*'
	let tPassword2 = useTranslation('Password repeat') + '*'

	let googleAuthURL = 'https://user-cycle.gratheon.com/auth/google'

	if (isDev()) {
		googleAuthURL = 'http://localhost:4000/auth/google'
	}

	function onInput(e: any) {
		const { name, value } = e.target
		setAccount({
			...account,
			[name]: value,
		})
	}

	let [accountCreate, { error, data }] = useMutation(gql`
		mutation register($first_name: String, $last_name: String, $email: String!, $password: String!) {
			register(first_name: $first_name, last_name: $last_name, email: $email, password: $password) {
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
		highlight = {
			email: false,
			password: false,
			password2: false
		}

		if (account.email.length < 5 || account.email.indexOf('@') === -1) {
			setErrorOnClient('Email is required')
			setHighlight({
				...highlight,
				email: true
			})

			return
		}

		if (account.password.length < 5) {
			setErrorOnClient('Password is required')

			setHighlight({
				...highlight,
				password: true
			})

			return
		}

		if (account.password2 !== account.password) {
			setErrorOnClient('Passwords do not match')

			setHighlight({
				...highlight,
				password2: true
			})
			return
		}

		setErrorOnClient('')
		accountCreate({
			first_name: account?.first_name,
			last_name: account?.last_name,
			email: account?.email,
			password: account?.password,
		})
	}

	if (!account) {
		setAccount({
			first_name: '',
			last_name: '',
			email: '',
			password: '',
			password2: '',
		})

		return <Loader />
	}

	if (data?.register?.key) {
		saveToken(data.register.key)

		metrics.trackRegistration()
		//@ts-ignore
		window.location = getAppUri() + '/'
		return <Loader />
	} else if (data?.register?.code) {
		errorOnClient = 'Invalid email or password'
	}

	return (
		<div id={styles.container}>
			<div id={styles.bg}></div>

			<div id={styles.logo}>
				<div id={styles.logo_inner}>
					<img src="/assets/logo_v7.svg"
						draggable={false} />
				</div>
			</div>
			<div id={styles.reg_page}>
				<div id={styles.reg_page_inner}>

					<h1 style="text-align:center;margin-bottom:20px;"><T key="signup_heading" ctx="this is a heading of the new account registration">Sign Up</T></h1>
					{errorOnClient && <ErrorMsg key={errorOnClient} error={<T>{errorOnClient}</T>} />}
					{error && <ErrorMsg error={error} />}

					<form onSubmit={onSubmit}>
						<input style="display: none" type="text" name="email" />
						<input style="display: none" type="password" name="password" />

						<div style="display:flex;margin-bottom:10px;margin-top:5px;">
							<input
								style="width:50%;margin-right:5px;padding-left:10px;"
								type="text"
								name="first_name"
								placeholder={tFirstName}
								autoFocus
								value={account.first_name}
								onInput={onInput}
							/>
							<input
								style="width:50%;padding-left:10px;"
								type="text"
								name="last_name"
								placeholder={tLastName}
								autoFocus
								value={account.last_name}
								onInput={onInput}
							/>
						</div>
						<div style="margin-bottom:10px;">
							<input
								style="width:100%;padding-left:10px;"
								className={highlight.email ? styles.highlight : ''}
								type="email"
								name="email"
								placeholder={tEmail}
								value={account.email}
								onInput={onInput}
								autocomplete="off"
							/>
						</div>
						<div style="margin-bottom:10px;">
							<input
								style="width:100%;padding-left:10px;"
								name="password"
								type="password"
								className={highlight.password ? styles.highlight : ''}
								placeholder={tPassword}
								autoFocus
								value={account.password}
								onInput={onInput}
							/>
						</div>
						<div style="margin-bottom:20px;">
							<input
								style="width:100%;padding-left:10px;"
								name="password2"
								type="password"
								className={highlight.password2 ? styles.highlight : ''}
								placeholder={tPassword2}
								autoFocus
								value={account.password2}
								onInput={onInput}
								autocomplete="new-password"
							/>
						</div>



						<Button type="submit" color="green" onClick={onSubmit}
							style="width:100%; text-align:center;background-color: #ffd900; color: black; text-shadow:none;">
							<T key="signup_button" ctx="this a button to register for a new account">Sign Up</T>
						</Button>


						<div style="display: flex;margin:10px 0 8px;">
							<div style="margin-top:7px;height:0px; border-top:1px solid #aaa;flex-grow:1;"></div>
							<div style="padding:0 10px;"><T ctx='this is a label for choosing one authentication method or another, its a single word, use lowercase'>or</T></div>
							<div style="margin-top:7px;height:0px; border-top:1px solid #aaa;flex-grow:1;"></div>
						</div>

						<Button href={googleAuthURL} style="width:100%;text-align:center;">
							<svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="16" height="16" viewBox="0 0 48 48">
								<path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path><path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"></path><path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"></path><path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"></path>
							</svg>
							<T>Continue with Google</T>
						</Button>
					</form>
					<p>
						<T>Already with us?</T> <a onClick={(e) => {
							navigate('/account/authenticate/', { replace: false })
							e.preventDefault()
							return false;
						}} href="/account/authenticate/"><T>Sign in</T></a>
					</p>
				</div>
			</div>
		</div>
	)
}
