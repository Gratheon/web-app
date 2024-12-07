import CryptoJS from 'crypto-js'

import { graphqlWsClient } from '@/api'
import isDev from '@/isDev'
import T from '@/shared/translate'

import ConnectionStatus from './connectionStatus'
import styles from './styles.module.less'
import * as userModel from '@/models/user'
import { TAWKTO_TOKEN } from '@/config'

function generateHmac(message: string, secret: string) {
	return CryptoJS.HmacSHA256(message, secret).toString(CryptoJS.enc.Hex)
}

async function triggerSupportChat() {
	// load user info
	const userInfo = await userModel.getUser()
	const hash = await generateHmac(`${userInfo.email}`, TAWKTO_TOKEN)

	//@ts-ignore
	window.Tawk_API.onLoad = async function (event) {
		//@ts-ignore
		window.Tawk_API.login(
			{
				hash,
				email: userInfo.email,
				name: `${userInfo.first_name} ${userInfo.last_name}`,
				userId: `${userInfo.id}`,
			},
			console.error
		)

		//@ts-ignore
		window.Tawk_API.setAttributes(
			{
				hash,
				// userId: `${userInfo.id}`,
				email: userInfo.email,
				name: `${userInfo.first_name} ${userInfo.last_name}`,
			},
			console.error
		)

		if (userInfo?.billingPlan) {
			//@ts-ignore
			window.Tawk_API.addTags([userInfo.billingPlan], console.error)
		}
	}

	//@ts-ignore
	window.Tawk_API.start({
		message: 'Hi, how can we help you today?',
	})

	//@ts-ignore
	window.Tawk_API.maximize()
}

export default function Footer() {
	let apiUrl = 'https://graphql.gratheon.com/graphql'

	//@ts-ignore
	const isPWA =
		window.matchMedia('(display-mode: standalone)').matches ||
		// @ts-ignore
		window.navigator?.standalone
	const isMobile = window.innerWidth < 500

	if (isDev()) {
		apiUrl = 'http://localhost:6100/graphql'
	}

	return (
		<ul id={styles.footer}>
			{!(isPWA || isMobile) && (
				<li style={{ paddingTop: 4 }}>
					<ConnectionStatus graphqlWsClient={graphqlWsClient} />
				</li>
			)}
			{(isDev()) && (
				<li>
					<a href={apiUrl}>API</a>
				</li>
			)}
			<li>
				<a href="https://gratheon.com/terms">
					<T ctx="link in page footer">Terms of Use</T>
				</a>
			</li>
			<li>
				<a href="https://gratheon.com/privacy">
					<T ctx="link in page footer">Privacy policy</T>
				</a>
			</li>
			<li>
				<a
					style="text-decoration: underline; cursor:pointer;"
					onClick={triggerSupportChat}
				>
					Support
				</a>
			</li>
		</ul>
	)
}
