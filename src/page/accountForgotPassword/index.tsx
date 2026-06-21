import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'

import { gql, useMutation } from '@/api'
import logoURL from '@/assets/logo_v7.svg'
import Button from '@/shared/button'
import ErrorMsg from '@/shared/messageError'
import T from '@/shared/translate'
import VisualForm from '@/shared/visualForm'

import style from '../accountAuth/styles.module.less'

type Account = {
	email: string
}

const GENERIC_SUCCESS_MESSAGE = 'If this email is registered, we will send a password reset link.'

export default function AccountForgotPassword() {
	const [account, setAccount] = useState<Account>({ email: '' })
	const [successMessage, setSuccessMessage] = useState('')
	const location = useLocation()
	const authPath = `/account/authenticate${location.search}`

	const [requestPasswordReset, { error, loading }] = useMutation(gql`
		mutation requestPasswordReset($email: String!) {
			requestPasswordReset(email: $email) {
				ok
			}
		}
	`)

	function onInput(e: any) {
		const { name, value } = e.target
		setAccount({ ...account, [name]: value })
	}

	async function onSubmit(e: React.ChangeEvent<HTMLFormElement>) {
		e.preventDefault()
		setSuccessMessage('')

		await requestPasswordReset({ email: account.email })
		setSuccessMessage(GENERIC_SUCCESS_MESSAGE)
	}

	return (
		<div className={style.loginPage}>
			<div className={style.loginModal}>
				<div className={style.loginModalWithLogo}>
					<img src={logoURL} id={style.logo} draggable={false} />

					<div className={style.loginModalInternal}>
						{successMessage && <div className={style.successMessage}><T>{successMessage}</T></div>}
						{error && <ErrorMsg error={error} />}

						<VisualForm
							onSubmit={onSubmit}
							submit={<Button loading={loading} type="submit" color="green" onClick={onSubmit}>
								<T>Send reset link</T>
							</Button>}
						>
							<h1 className={style.formTitle}><T>Reset password</T></h1>
							<p className={style.formHint}>
								<T>Enter your account email and we will send a link to reset your password.</T>
							</p>
							<input
								style="width:100%;"
								name="email"
								type="email"
								id="email"
								placeholder="Email"
								value={account.email}
								onChange={onInput}
								required
								autoFocus
							/>
						</VisualForm>
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
