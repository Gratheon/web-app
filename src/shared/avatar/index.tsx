import { useState } from 'react';
import md5 from 'md5';

import { gql, useQuery } from '../../api';
import type { User } from '../../models/user.ts'

import styles from './style.module.less';

function calculateMD5(email) {
	return md5(email.trim().toLowerCase());
}

export default function Avatar({ style = "" }) {
	let [user, setUser] = useState<User>({})

	let { loading: loadingGet, data: accountData, error } = useQuery(gql`
		query user {
			user {
				id
				email
			}
		}
	`)

	if (accountData && (!user || !user.id)) {
		setUser(accountData.user)
	}

	if (error) {
		console.log(error)
	}

	if (loadingGet || error) {
		return null;
	}


	const md5Hash = user.email ? calculateMD5(user.email) : '';
	const gravatarURL = `https://www.gravatar.com/avatar/${md5Hash}?s=200`;


	return (
		<img src={gravatarURL} className={styles.avatar} alt="avatar" style={style} />
	)
}