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
		<div style="display:flex;height:100%;">
			<div style="background: url('https://gratheon.s3-accelerate.amazonaws.com/www/register2.webp'); background-position: center; background-repeat: no-repeat; background-size: cover; flex-grow:5;"></div>

			<div>
				<div style="margin-left: -40px;position:absolute; top: 35%;background:white;border-radius:40px;
				height:80px;width:80px;text-align:center;border:1px solid gray;">
					<img src="/assets/logo_v7.svg"
						style="width:40px; display: block; margin: 20px;"
						draggable={false} />
				</div>
			</div>
			<div style="min-width:300px;flex-grow:1; padding: 200px 50px;">
				<div style={{ padding: 15, maxWidth: '400px', margin: '0 auto' }}>

					<h1 style="text-align:center;margin-bottom:20px;"><T>Sign Up</T></h1>
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
					</form>


					<Button type="submit" color="green" onClick={onSubmit} style="text-transform:uppercase; width:100%; text-align:center;">
						<T>Sign Up</T>
					</Button>

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
