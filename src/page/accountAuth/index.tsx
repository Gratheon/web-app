import React, {useState} from 'react'
import {Link} from 'react-router-dom'
import {useNavigate} from 'react-router'

import isDev from '@/isDev'
import {gql, useMutation} from '@/api'

import metrics from '@/metrics'

import logoURL from '@/assets/logo_v7.svg'
import Loader from '@/shared/loader'
import ErrorMsg from '@/shared/messageError'
import Button from '@/shared/button'
import T from '@/shared/translate'

import {saveToken} from '@/user'

import style from './styles.module.less'
import VisualForm from '@/shared/visualForm'

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
        const {name, value} = e.target
        account[name] = value;
    }

    let [accountAuth, {error, data, loading: loadingMutation}] = useMutation(gql`
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

    let googleAuthURL = 'https://user-cycle.gratheon.com/auth/google'

    if (isDev()) {
        googleAuthURL = 'http://localhost:4000/auth/google'
    }

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
        return <Loader/>
    }

    if (data?.login?.key) {
        // clear DB on login and on logout to have consistent structure in case of alters
        saveToken(data.login.key)

        if (data.login.user.id) metrics.setUser(data.login.user);

        metrics.trackLogin();

        React.useEffect(
            () => {
                //@ts-ignore
                // window.location = getAppUri() + pathAfterLogin
                pathAfterLogin = localStorage.getItem('redirect-after-login')
                if (pathAfterLogin) {
                    navigate(pathAfterLogin, {replace: true})
                    localStorage.removeItem('redirect-after-login')
                } else {
                    navigate('/apiaries', {replace: true})
                }
            },
            [navigate]
        )

        return <Loader/>
    } else if (data?.login?.code === 'INVALID_USERNAME_PASSWORD') {
        errorMsg = <ErrorMsg error={<T>Invalid email or password</T>} borderRadius={0}/>
    }

    if (error) {
        errorMsg = <ErrorMsg error={error}/>
    }

    return (
        <div className={style.loginPage}>
            <div className={style.loginModal}>
                <div className={style.loginModalWithLogo}>
                    <img src={logoURL} id={style.logo} draggable={false}/>

                    <div className={style.loginModalInternal}>
                        {errorMsg}
                        <VisualForm 
                            onSubmit={onSubmit} 
                            submit={<Button
                                loading={loading || loadingMutation}
                                type="submit"
                                color="green"
                                onClick={onSubmit}>
                                <T>Log In</T>
                            </Button>}>
                            <input
                                style="width:100%;"
                                name="email"
                                type="email"
                                id="email"
                                placeholder="Email"
                                value={account.email}
                                onChange={onInput}
                            />
                            <input
                                style="width:100%;"
                                name="password"
                                id="password"
                                type="password"
                                placeholder="Password"
                                value={account.password}
                                onChange={onInput}
                            />


                            <div style="display: flex;margin:10px 0 8px;">
                                <div style="margin-top:7px;height:0px; border-top:1px solid #aaa;flex-grow:1;"></div>
                                <div style="padding:0 10px;"><T
                                    ctx='this is a label for choosing one authentication method or another, its a single word, use lowercase'>or</T>
                                </div>
                                <div style="margin-top:7px;height:0px; border-top:1px solid #aaa;flex-grow:1;"></div>
                            </div>

                            <Button href={googleAuthURL}>
                                <svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="16" height="16"
                                     viewBox="0 0 48 48">
                                    <path fill="#FFC107"
                                          d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path>
                                    <path fill="#FF3D00"
                                          d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"></path>
                                    <path fill="#4CAF50"
                                          d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"></path>
                                    <path fill="#1976D2"
                                          d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"></path>
                                </svg>
                                <T>Login with Google</T>
                            </Button>

                        </VisualForm>

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
