import React, { useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'

import { gql, useMutation } from '@/api'
import logoURL from '@/assets/logo_v7.svg'
import Button from '@/shared/button'
import ErrorMsg from '@/shared/messageError'
import T from '@/shared/translate'
import VisualForm from '@/shared/visualForm'

import style from '../accountAuth/styles.module.less'

type PasswordForm = {
	password: string
	password2: string
}

export default function AccountResetPassword() {
	const [form, setForm] = useState<PasswordForm>({ password: '', password2: '' })
	const [errorOnClient, setErrorOnClient] = useState('')
	const [isSuccess, setIsSuccess] = useState(false)
	const location = useLocation()
	const token = useMemo(() => new URLSearchParams(location.search).get('token') || '', [location.search])
	const authPath = '/account/authenticate'

	const [resetPassword, { error, data, loading }] = useMutation(gql`
		mutation resetPassword($token: String!, $password: String!) {
			resetPassword(token: $token, password: $password) {
				__typename
				... on PasswordResetRequestResult {
					ok
				}
				... on Error {
					code
				}
			}
		}
	`)

	function onInput(e: any) {
		const { name, value } = e.target
		setForm({ ...form, [name]: value })
	}

	async function onSubmit(e: React.ChangeEvent<HTMLFormElement>) {
		e.preventDefault()
		setErrorOnClient('')

		if (!token) {
			setErrorOnClient('This password reset link is invalid or incomplete.')
			return
		}

		if (form.password.length < 6) {
			setErrorOnClient('Password is too simple')
			return
		}

		if (form.password !== form.password2) {
			setErrorOnClient('Passwords do not match')
			return
		}

		const result = await resetPassword({ token, password: form.password })
		if (result?.data?.resetPassword?.__typename === 'PasswordResetRequestResult') {
			setIsSuccess(true)
		}
	}

	let errorMessage = errorOnClient
	if (data?.resetPassword?.code === 'INVALID_TOKEN') {
		errorMessage = 'This password reset link is invalid, expired, or already used.'
	} else if (data?.resetPassword?.code === 'SIMPLE_PASSWORD') {
		errorMessage = 'Password is too simple'
	}

	return (
		<div className={style.loginPage}>
			<div className={style.loginModal}>
				<div className={style.loginModalWithLogo}>
					<img src={logoURL} id={style.logo} draggable={false} />

					<div className={style.loginModalInternal}>
						{isSuccess && <div className={style.successMessage}><T>Your password has been updated. You can now log in.</T></div>}
						{errorMessage && <ErrorMsg key={errorMessage} error={<T>{errorMessage}</T>} borderRadius={0} />}
						{error && <ErrorMsg error={error} />}

						{!isSuccess && <VisualForm
							onSubmit={onSubmit}
							submit={<Button loading={loading} type="submit" color="green" onClick={onSubmit}>
								<T>Update password</T>
							</Button>}
						>
							<h1 className={style.formTitle}><T>Choose a new password</T></h1>
							<p className={style.formHint}>
								<T>Password reset links expire after 1 hour and can be used only once.</T>
							</p>
							<input
								style="width:100%;"
								name="password"
								type="password"
								placeholder="New password"
								value={form.password}
								onChange={onInput}
								autoComplete="new-password"
								required
								autoFocus
							/>
							<input
								style="width:100%;"
								name="password2"
								type="password"
								placeholder="Confirm new password"
								value={form.password2}
								onChange={onInput}
								autoComplete="new-password"
								required
							/>
						</VisualForm>}
					</div>
					<div className={style.balancer}></div>
				</div>
				<div className={style.linkToRegister}>
					<Link to={authPath}><T>Back to login</T></Link>
				</div>
			</div>
		</div>
	)
}
