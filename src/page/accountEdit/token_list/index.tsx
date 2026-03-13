import React, { useEffect, useState } from 'react';

import ErrorMsg from '@/shared/messageError'
import Button from '@/shared/button';
import { gql, useQuery, useMutation } from '@/api'
import Loader from '@/shared/loader'
import T from '@/shared/translate';
import KeyIcon from '@/icons/key.tsx';

import style from './style.module.less'
import CopyButton from '@/shared/copyButton';

const TOKEN_QUERY = gql`
{
	apiTokens {
		__typename
		id
		token
	}

	devices {
		id
		name
		type
		apiToken
	}

	shareTokens {
		__typename
		id
		name
		token
		scopes
		targetUrl
	}
}
`

const GENERATE_TOKEN_MUTATION = gql`
mutation generateApiToken {
	generateApiToken {
		id
		token
	}
}`

function formatScopeValue(value: unknown): string {
	if (value === null || value === undefined) {
		return 'null'
	}

	if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
		return String(value)
	}

	try {
		return JSON.stringify(value)
	} catch {
		return '[unserializable]'
	}
}

function summarizeScopes(scopes: unknown): { summary: string, technical: string } {
	const technical = formatScopeValue(scopes)

	if (scopes === null || scopes === undefined) {
		return { summary: 'None', technical }
	}

	if (Array.isArray(scopes)) {
		const plainItems = scopes.filter((item) => typeof item === 'string') as string[]
		if (plainItems.length === scopes.length) {
			return { summary: plainItems.join(', '), technical }
		}
		return { summary: scopes.map((item) => formatScopeValue(item)).join(', '), technical }
	}

	if (typeof scopes === 'object') {
		const scopeObject = scopes as Record<string, unknown>
		const allowedQueries = scopeObject.allowedQueries

		if (Array.isArray(allowedQueries)) {
			const querySummaries = allowedQueries
				.map((query) => {
					if (!query || typeof query !== 'object') {
						return null
					}

					const q = query as Record<string, unknown>
					const queryName = typeof q.queryName === 'string' ? q.queryName : 'query'
					const requiredArgs = q.requiredArgs

					if (!requiredArgs || typeof requiredArgs !== 'object' || Array.isArray(requiredArgs)) {
						return queryName
					}

					const args = Object.entries(requiredArgs as Record<string, unknown>)
						.map(([key, value]) => `${key}: ${formatScopeValue(value)}`)
						.join(', ')

					return args ? `${queryName} (${args})` : queryName
				})
				.filter(Boolean)

			if (querySummaries.length > 0) {
				return { summary: querySummaries.join('; '), technical }
			}
		}

		const keys = Object.keys(scopeObject)
		if (keys.length > 0) {
			return { summary: keys.join(', '), technical }
		}
	}

	return { summary: technical, technical }
}


export default function TokenList() {
	let [generateToken, { error: generationError }] = useMutation(GENERATE_TOKEN_MUTATION)

	const [revokingApiToken, setRevokingApiToken] = useState([])
	let [revokeApiToken, { error: revokeApiTokenError }] = useMutation(gql`mutation revokeApiToken($token: String!){ 
		revokeApiToken(token: $token) {
			code
		}
	 }`)

	const [revokingShareToken, setRevokingToken] = useState([])
	let [revokeShareToken, { error: revokeShareTokenError }] = useMutation(gql`mutation revokeShareToken($token: String!){
		revokeShareToken(token: $token) {
			code
		}
	 }`)


	let { loading, error, data, reexecuteQuery } = useQuery(TOKEN_QUERY)

	async function onRevokeShareToken(token: string) {
		setRevokingToken([...revokingShareToken, token])
		await revokeShareToken({ token })
		setRevokingToken(revokingShareToken.filter((t) => t !== token))
		reexecuteQuery();
	}

	const [generatingToken, setGenerating] = useState(false)

	async function onGenerateToken() {
		setGenerating(true);
		const result = await generateToken()
		hiddenTokens.push(result.data.generateApiToken.id)
		setGenerating(false);
		reexecuteQuery();
	}

	async function onRevokeApiToken(token: string) {
		await revokeApiToken({ token })
		reexecuteQuery();
	}

	if (loading) {
		return <Loader />
	}

	let tokens = data?.apiTokens
	const devices = data?.devices || []
	const shareTokens = data?.shareTokens
	const deviceByToken = new Map(
		devices
			.filter((device) => !!device.apiToken)
			.map((device) => [device.apiToken, device])
	)

	const initialHiddenTokens: number[] = tokens && tokens.map((token) => token?.id);
	const [hiddenTokens, setHiddenTokens] = useState<number[]>(initialHiddenTokens);

	const toggleToken = (id: number) => {
		if (hiddenTokens.includes(id)) {
			setHiddenTokens(hiddenTokens.filter((tokenID) => tokenID !== id));
		} else {
			setHiddenTokens([...hiddenTokens, id]);
		}
	};


	return (
		<>
			<section className={style.section}>
				<h3><T>API tokens</T></h3>

				<div className={style.tokenSectionHeader}>
					<p className={style.tokenSectionDescription}>
						<T>API tokens are used to authenticate your requests to our API. You can create multiple tokens to use in different applications.</T>
						<br />
						<a href="https://gratheon.com/docs/API">API documentation</a>
					</p>

					<div>
						<Button color='green' loading={generatingToken} onClick={onGenerateToken}>
							<KeyIcon size={16} />
							<T>Generate</T>
						</Button>
					</div>
				</div>

				<ErrorMsg error={error || generationError || revokeShareTokenError || revokeApiTokenError} />

				{tokens && tokens.length > 0 &&
					<div className={style.list}>
						{tokens.map((token) => {
							const linkedDevice: any = deviceByToken.get(token.token)

							return (
							<div key={token.id} className={`${style.row} ${linkedDevice ? style.deviceTokenRow : ''}`}>
								<div className={style.tokenContainer}>
									<div className={style.tokenWrap}>
										<div className={style.token}>
											{hiddenTokens.includes(token.id) ? '*'.repeat(token.token.length) : token.token}
										</div>
										{linkedDevice && (
											<a className={style.deviceBadge} href="/devices">
												<T>Device</T>: {linkedDevice.name}
											</a>
										)}
									</div>

									<CopyButton size='small' data={token.token} />
								</div>
								<div className={style.buttons}>
									<Button size='small' onClick={() => toggleToken(token.id)}><T>Toggle</T></Button>

									<Button
										size='small'
										color='red'
										loading={revokingApiToken.includes(token.token)}
										onClick={() => onRevokeApiToken(token.token)}><T>Revoke</T></Button>
								</div>
							</div>
						)})}
					</div>
				}
			</section>

			{shareTokens && shareTokens.length > 0 && <section className={style.section}>
				<h3><T>Shared links</T></h3>
				<p><T>You can share access to hive inspections with other people. This list shows list of such shared tokens</T></p>

				<div className={`${style.list} ${style.stripedRows}`}>
					{shareTokens.map((token) => {
						const scopeInfo = summarizeScopes(token.scopes)

						return (
							<div key={token.id} className={style.row}>
								<div className={style.linkNameWrap}>
									<span>{token.name}</span>
									<details className={style.scopeDetails}>
										<summary className={style.scopeTrigger} title="View scope details">
											i
										</summary>
										<div className={style.scopePopover}>
											<div className={style.scopePopoverTitle}><T>Access scope</T></div>
											<div className={style.scopePopoverBody}>{scopeInfo.technical}</div>
										</div>
									</details>
								</div>
								<div className={style.buttons}>
									<CopyButton size='small' data={token.targetUrl} />
									<Button
										size='small'
										color='red'
										loading={revokingShareToken.includes(token.token)}
										onClick={() => onRevokeShareToken(token.token)}><T>Revoke</T></Button>
								</div>
							</div>
						)
					})}
				</div>
			</section>
			}
		</>
	);
}
