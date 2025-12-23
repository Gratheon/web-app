import { h } from 'preact'
import { useEffect, useState, useRef, useMemo, useCallback } from 'preact/hooks'
import { useLiveQuery } from 'dexie-react-hooks'

import { getUser } from '@/models/user'
import {
	getTranslation,
	getTranslationValue,
	getPluralForms,
	upsertTranslationValue
} from '@/models/translations'
import {
	fetchTranslationWithRemote,
	fetchPluralWithRemote,
	getUserLanguage,
	fetchRemoteTranslation,
	type TranslationData
} from '@/models/translationService'
import { getPluralForm } from './pluralRules'
import isDev from '@/isDev'
import { useMutation } from '@/api'

const supportedLangs = ['en', 'ru', 'et','tr','pl','de','fr'];

function TRemote({ lang, children, ctx, onFetched }: {
	lang: string,
	children: string,
	ctx?: string,
	onFetched?: () => void
}) {
	const [translation, setTranslation] = useState<TranslationData | null>(null)
	const [fetched, setFetched] = useState(false)

	useEffect(() => {
		if (fetched) return;

		let cancelled = false;

		const fetchTranslation = async () => {
			try {
				const trans = await fetchRemoteTranslation(children, lang, ctx);
				if (!cancelled) {
					setTranslation(trans);
					setFetched(true);
					onFetched?.();
				}
			} catch (error) {
				if (!cancelled) {
					console.error('Translation fetch error:', error);
					setFetched(true);
					onFetched?.();
				}
			}
		};

		fetchTranslation();

		return () => {
			cancelled = true;
		};
	}, [children, ctx, fetched, lang]);

	if (!fetched || !translation) return <>{children}</>

	const value = translation.values?.[lang];
	return <>{value || children}</>
}

interface TProps {
  children: string;
  ctx?: string;
}

export default function T({ children, ctx }: TProps) {
	let user = useLiveQuery(() => getUser(), [], null)
	const lang = getUserLanguage(user, supportedLangs);
	const [shouldShowRemote, setShouldShowRemote] = useState(false);
	const [hasAttemptedFetch, setHasAttemptedFetch] = useState(false);
	const [isEditing, setIsEditing] = useState(false);
	const [editValue, setEditValue] = useState('');
	const [isSaving, setIsSaving] = useState(false);
	const inputRef = useRef<HTMLInputElement>(null);
	const devMode = isDev();

	const [updateTranslationMutation] = useMutation(`
		mutation updateTranslationValue($key: String!, $lang: String!, $value: String!) {
			updateTranslationValue(key: $key, lang: $lang, value: $value) {
				id
				key
				values
			}
		}
	`);


	let translation = useLiveQuery(async () => {
		const trans = await getTranslation(children);
		if (!trans) {
			return null;
		}

		return await getTranslationValue(trans.id, lang);
	}, [children, lang], null);

	useEffect(() => {
		if (!hasAttemptedFetch && translation === null) {
			setShouldShowRemote(true);
		}
	}, [translation, hasAttemptedFetch]);

	useEffect(() => {
		if (isEditing && inputRef.current) {
			inputRef.current.focus();
			inputRef.current.select();
		}
	}, [isEditing]);

	const handleClick = (e: any) => {
		if (!devMode) return;
		if (!e.ctrlKey && !e.metaKey) return;
		e.preventDefault();
		e.stopPropagation();
		setEditValue(translation || children);
		setIsEditing(true);
	};

	const handleKeyDown = (e: any) => {
		e.stopPropagation();

		if (e.key === 'Enter') {
			e.preventDefault();
			handleSubmit();
		} else if (e.key === 'Escape') {
			e.preventDefault();
			setIsEditing(false);
		}
	};

	const handleSubmit = async () => {
		if (!editValue.trim() || isSaving) {
			setIsEditing(false);
			return;
		}

		setIsSaving(true);

		try {
			const trans = await getTranslation(children);
			const translationId = trans?.id;

			await updateTranslationMutation({
				key: children,
				lang: lang,
				value: editValue
			});

			if (translationId) {
				await upsertTranslationValue({
					translationId,
					lang,
					value: editValue
				});
			}

			setIsEditing(false);
		} catch (error) {
			console.error('Failed to update translation:', error);
		} finally {
			setIsSaving(false);
		}
	};

	const handleBlur = () => {
		setIsEditing(false);
	};

	const wrapperStyle = useMemo(() =>
		devMode ? {
			cursor: 'pointer',
			textDecoration: 'underline dotted',
			textDecorationColor: 'rgba(76, 175, 80, 0.3)'
		} : {},
		[devMode]
	);

	const handleFetched = useCallback(() => {
		setShouldShowRemote(false);
		setHasAttemptedFetch(true);
	}, []);

	if (isEditing) {
		return (
			<span
				onClick={(e) => e.stopPropagation()}
				onKeyDown={(e) => e.stopPropagation()}
				onKeyUp={(e) => e.stopPropagation()}
				onKeyPress={(e) => e.stopPropagation()}
			>
				<input
					ref={inputRef}
					type="text"
					value={editValue}
					onInput={(e) => setEditValue((e.target as HTMLInputElement).value)}
					onKeyDown={handleKeyDown}
					onKeyPress={(e) => e.stopPropagation()}
					onKeyUp={(e) => e.stopPropagation()}
					onClick={(e) => e.stopPropagation()}
					onBlur={handleBlur}
					style={{
						font: 'inherit',
						border: '1px solid #4CAF50',
						padding: '2px 4px',
						borderRadius: '2px',
						outline: 'none',
						minWidth: '100px'
					}}
				/>
			</span>
		);
	}

	if (translation) {
		return <span onClick={handleClick} style={wrapperStyle}>{translation}</span>;
	}

	if (shouldShowRemote && !hasAttemptedFetch) {
		return <TRemote
			lang={lang}
			ctx={ctx}
			onFetched={handleFetched}
		>{children}</TRemote>
	}

	return <span onClick={handleClick} style={wrapperStyle}>{children}</span>;
}


export function useTranslation(key: string, ctx?: string) {
	const [translatedText, setTranslatedText] = useState(key);
	const [hasAttemptedFetch, setHasAttemptedFetch] = useState(false);

	let user = useLiveQuery(() => getUser(), [], null);
	const lang = getUserLanguage(user, supportedLangs);

	let cachedTranslation = useLiveQuery(async () => {
		const translation = await getTranslation(key);
		if (!translation) return null;

		const value = await getTranslationValue(translation.id, lang);
		return { translationId: translation.id, value };
	}, [key, lang], null);

	useEffect(() => {
		setHasAttemptedFetch(false);
	}, [key, lang]);

	useEffect(() => {
		if (cachedTranslation?.value) {
			setTranslatedText(cachedTranslation.value);
			return;
		}

		if (cachedTranslation === null && !hasAttemptedFetch) {
			setHasAttemptedFetch(true);

			let cancelled = false;

			fetchTranslationWithRemote(key, lang, ctx)
				.then(text => {
					if (!cancelled) {
						setTranslatedText(text);
					}
				})
				.catch(error => {
					if (!cancelled) {
						console.error('Translation fetch error:', error);
					}
				});

			return () => {
				cancelled = true;
			};
		}
	}, [cachedTranslation, key, lang, ctx, hasAttemptedFetch]);

	return translatedText;
}

export function usePlural(count: number, key: string) {
	const [translatedText, setTranslatedText] = useState(key);
	const [hasAttemptedFetch, setHasAttemptedFetch] = useState(false);

	let user = useLiveQuery(() => getUser(), [], null);
	const lang = getUserLanguage(user, supportedLangs);
	const pluralForm = getPluralForm(count, lang);

	let cachedPlural = useLiveQuery(async () => {
		const translation = await getTranslation(key);
		if (!translation) return null;

		const pluralData = await getPluralForms(translation.id, lang);
		return { translationId: translation.id, pluralData };
	}, [key, lang], null);

	useEffect(() => {
		setHasAttemptedFetch(false);
	}, [key, lang]);

	useEffect(() => {
		if (cachedPlural?.pluralData?.[pluralForm]) {
			setTranslatedText(cachedPlural.pluralData[pluralForm]);
			return;
		}

		if ((cachedPlural === null || cachedPlural?.pluralData === null) && !hasAttemptedFetch) {
			setHasAttemptedFetch(true);

			let cancelled = false;

			fetchPluralWithRemote(key, lang, pluralForm)
				.then(text => {
					if (!cancelled) {
						setTranslatedText(text);
					}
				})
				.catch(error => {
					if (!cancelled) {
						console.error('Plural fetch error:', error);
					}
				});

			return () => {
				cancelled = true;
			};
		}
	}, [cachedPlural, key, lang, pluralForm, hasAttemptedFetch]);

	return translatedText;
}
