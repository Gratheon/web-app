import React, { useEffect, useState } from 'react';

import ErrorMsg from '@/shared/messageError'
import Button from '@/shared/button';
import { gql, useQuery, useMutation } from '@/api'
import Loader from '@/shared/loader'
import T from '@/shared/translate';
import KeyIcon from '@/icons/key.tsx';

import style from './style.module.less'
import CopyButton from '@/shared/copyButton';
import Card from '@/shared/pagePaddedCentered/card';

const TOKEN_QUERY = gql`
{
	apiTokens {
		__typename
		id
		token
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
	const shareTokens = data?.shareTokens

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
			<Card>
				<h3><T>API tokens</T></h3>

				<div style="display:flex;">
					<p style="flex-grow:1;">
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
					<table>
						<tbody>
							{tokens.map((token) => (
								<tr key={token.id} className={style.apiToken}>
									<td>
										<div className={style.tokenContainer}>
											<div className={style.token}>
												{hiddenTokens.includes(token.id) ? '*'.repeat(token.token.length) : token.token}
											</div>

											<CopyButton size='small' data={token.token} />
										</div>
									</td>
									<td className={style.buttons}>
										<Button size='small' onClick={() => toggleToken(token.id)}><T>Toggle</T></Button>
										
										<Button
											size='small'
											color='red'
											loading={revokingApiToken.includes(token.token)}
											onClick={() => onRevokeApiToken(token.token)}><T>Revoke</T></Button>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				}
			</Card>

			{shareTokens && shareTokens.length > 0 && <Card>
				<h3><T>Shared links</T></h3>
				<p><T>You can share access to hive inspections with other people. This list shows list of such shared tokens</T></p>

				<table className={style.sharedLinksTable}>
					<thead>
						<tr>
							<th><T ns="token">Name</T></th>
							<th><T>Scopes</T></th>
							<th><T>Actions</T></th>
						</tr>
					</thead>
					<tbody>
						{shareTokens.map((token) => (
							<tr key={token.id} className={style.apiToken}>
								<td data-label="Name">
									{token.name}
								</td>
								<td data-label="Scopes" className={style.scopesCell}>
									{Array.isArray(token.scopes) ? token.scopes.join(', ') : String(token.scopes)}
								</td>
								<td data-label="Actions" className={style.buttons}>
									<CopyButton size='small' data={token.targetUrl} />
									<Button
										size='small'
										color='red'
										loading={revokingShareToken.includes(token.token)}
										onClick={() => onRevokeShareToken(token.token)}><T>Revoke</T></Button>
								</td>
							</tr>
						))}

					</tbody>

				</table>
			</Card>
			}
		</>
	);
}
