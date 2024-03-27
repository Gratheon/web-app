import React, { useState } from 'react';
import copy from 'clipboard-copy';

import ErrorMsg from '@/components/shared/messageError'
import Button from '@/components/shared/button';
import { gql, useQuery, useMutation } from '@/components/api/index'
import Loader from '@/components/shared/loader'
import T from '@/components/shared/translate';
import style from './style.less'

interface Token {
	id: number;
	value: string;
}

const TokenList: React.FC = () => {
	const { loading, error, data } = useQuery(gql`
		{
			api_tokens {
				id
				token
			}
		}
	`)

	let [generateToken, { error: generationError }] = useMutation(gql`
	mutation generateApiToken {
		generateApiToken {
			id
			token
		}
	}
`)

	const [generatingToken, setGenerating] = useState(false)
	async function onGenerateToken() {
		setGenerating(true);
		const result = await generateToken()
		hiddenTokens.push(result.data.generateApiToken.id)
		tokens.push(result.data.generateApiToken)
		setGenerating(false);
	}

	if (loading) {
		return <Loader />
	}

	const tokens = data.api_tokens

	const initialHiddenTokens: number[] = tokens.map((token) => token.id);
	const [hiddenTokens, setHiddenTokens] = useState<number[]>(initialHiddenTokens);

	const toggleToken = (id: number) => {
		if (hiddenTokens.includes(id)) {
			setHiddenTokens(hiddenTokens.filter((tokenID) => tokenID !== id));
		} else {
			setHiddenTokens([...hiddenTokens, id]);
		}
	};

	const copyToken = (token: string) => {
		copy(token);
		// You can provide some feedback to the user that the token was copied, e.g., a toast or a message.
	};

	return (
		<div style="padding:10px;border: 1px solid gray;border-radius:5px;margin-bottom: 5px;">
			<h3><T>API tokens</T></h3>
			<p>
				<T>API tokens are used to authenticate your requests to our API. You can create multiple tokens to use in different applications.</T>
				See <a href="https://github.com/Gratheon/graphql-router?tab=readme-ov-file#authentication">documentation</a> on how to access API
			</p>
			<ErrorMsg error={error || generationError} />

			{tokens.map((token) => (
				<div key={token.id} className={style.apiToken}>
					<div style="min-width:200px">
						<div className={style.token}>
							{hiddenTokens.includes(token.id) ? '*'.repeat(token.token.length) : token.token}
						</div>
					</div>
					<div className={style.buttons}>
						<Button size='small' onClick={() => toggleToken(token.id)}><T>Toggle</T></Button>
						<Button size='small' onClick={() => copyToken(token.token)}><T>Copy</T></Button>
					</div>
				</div>
			))}
			<Button color='green' loading={generatingToken} onClick={onGenerateToken}><T>Generate</T></Button>			
			
		</div>
	);
};

export default TokenList;
