import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import { apiClient, useMutation } from '@/api'
import { AI_ADVISOR_USAGE_QUERY, GENERATE_ADVICE_MUTATION } from './queries'

import type { ChatMessage } from './types'
import { buildId } from './utils'
import {
	getApiaryOverviewContext,
	getFrameRouteContext,
	getHiveContext,
} from './routeContext'
import { getViewContext } from './viewContext'
import AIAdvisorDrawerView from './DrawerView'
import { useAdvisorRun } from './useAdvisorRun'
import { useDrawerLabels } from './labels'

export default function AIAdvisorDrawer() {
	const labels = useDrawerLabels()

	const location = useLocation()
	const navigate = useNavigate()
	const runRef = useRef(0)
	const [messages, setMessages] = useState<ChatMessage[]>([])
	const [draftMessage, setDraftMessage] = useState('')
	const [isSendingUserMessage, setIsSendingUserMessage] = useState(false)
	const [adviceContext, setAdviceContext] = useState<any | null>(null)
	const [advisorTargetHiveID, setAdvisorTargetHiveID] = useState<
		number | undefined
	>(undefined)
	const [advisorLangCode, setAdvisorLangCode] = useState<string | undefined>(
		undefined
	)
	const [billingLocked, setBillingLocked] = useState(false)
	const [usageLoading, setUsageLoading] = useState(false)
	const [aiUsage, setAiUsage] = useState<any | null>(null)
	const [generateAdvice] = useMutation(GENERATE_ADVICE_MUTATION)

	const searchParams = useMemo(
		() => new URLSearchParams(location.search),
		[location.search]
	)
	const isOpen = searchParams.get('aiAdvisor') === '1'
	const hiveContext = useMemo(
		() => getHiveContext(location.pathname),
		[location.pathname]
	)
	const apiaryOverviewContext = useMemo(
		() => getApiaryOverviewContext(location.pathname),
		[location.pathname]
	)
	const frameRouteContext = useMemo(
		() => getFrameRouteContext(location.pathname),
		[location.pathname]
	)
	const viewContext = useMemo(
		() => getViewContext(location.pathname, labels),
		[location.pathname, labels]
	)
	const shouldRender = isOpen

	function closeDrawer() {
		const nextParams = new URLSearchParams(location.search)
		nextParams.delete('aiAdvisor')
		const nextSearch = nextParams.toString()
		navigate(`${location.pathname}${nextSearch ? `?${nextSearch}` : ''}`, {
			replace: true,
		})
	}

	function addMessage(msg: ChatMessage) {
		setMessages((prev) => [...prev, msg])
	}

	function updateMessage(id: string, patch: Partial<ChatMessage>) {
		setMessages((prev) =>
			prev.map((msg) => (msg.id === id ? { ...msg, ...patch } : msg))
		)
	}

	function removeMessage(id: string) {
		setMessages((prev) => prev.filter((msg) => msg.id !== id))
	}

	const fetchAiUsage = useCallback(async () => {
		try {
			setUsageLoading(true)
			const usageResult = await apiClient
				.query(AI_ADVISOR_USAGE_QUERY, {})
				.toPromise()
			if (usageResult?.error) {
				setAiUsage(null)
				return
			}
			setAiUsage(usageResult?.data?.aiAdvisorUsage || null)
		} catch {
			setAiUsage(null)
		} finally {
			setUsageLoading(false)
		}
	}, [])

	useAdvisorRun({
		hiveContext,
		apiaryOverviewContext,
		shouldRender,
		viewContext,
		generateAdvice,
		labels,
		location,
		frameRouteContext,
		fetchAiUsage,
		runRef,
		setBillingLocked,
		setAiUsage,
		setAdviceContext,
		setAdvisorTargetHiveID,
		setAdvisorLangCode,
		setMessages,
		addMessage,
		removeMessage,
	})

	const onSendUserMessage = async () => {
		const chatMessage = draftMessage.trim()
		if (
			!chatMessage ||
			billingLocked ||
			!adviceContext ||
			isSendingUserMessage
		) {
			return
		}

		const userMessageId = buildId('user')
		const pendingReplyId = buildId('reply-loading')
		const nextMessages: ChatMessage[] = [
			...messages,
			{ id: userMessageId, role: 'user' as const, text: chatMessage },
			{
				id: pendingReplyId,
				role: 'assistant' as const,
				text: labels.advisorThinkingMessage,
				loading: true,
			},
		]
		setMessages(nextMessages)
		setDraftMessage('')
		setIsSendingUserMessage(true)

		try {
			const chatHistory = nextMessages
				.filter(
					(message) => message.role === 'user' || message.role === 'assistant'
				)
				.slice(-12)
				.map((message) => ({
					role: message.role,
					text: message.text || message.html || '',
				}))

			const response = await generateAdvice({
				hiveID: advisorTargetHiveID,
				langCode: advisorLangCode,
				adviceContext: {
					...adviceContext,
					chatMessage,
					chatHistory,
				},
			})

			const adviceHtml = response?.data?.generateHiveAdvice
			const responseErrorMessage = response?.error?.message
			if (adviceHtml) {
				removeMessage(pendingReplyId)
				addMessage({
					id: buildId('reply'),
					role: 'assistant',
					html: adviceHtml,
				})
			} else {
				removeMessage(pendingReplyId)
				addMessage({
					id: buildId('reply'),
					role: 'error',
					text: responseErrorMessage || labels.summaryUnavailableMessage,
				})
			}
			await fetchAiUsage()
		} catch (error) {
			removeMessage(pendingReplyId)
			addMessage({
				id: buildId('error'),
				role: 'error',
				text: labels.failedAdvisoryMessage,
			})
		} finally {
			setIsSendingUserMessage(false)
		}
	}

	const aiUsagePercent = Math.max(
		0,
		Math.min(100, Number(aiUsage?.percentUsed || 0))
	)
	const aiUsageRemaining = Math.max(0, 100 - aiUsagePercent)
	const batteryColor =
		aiUsageRemaining > 60
			? '#2f8b0b'
			: aiUsageRemaining > 30
			? '#d49d0f'
			: '#b22222'
	const aiUsageSubtitle = usageLoading
		? `${labels.aiUsageRemainingLabel}: ...`
		: aiUsage
		? `${labels.aiUsageRemainingLabel}: ${aiUsageRemaining}%`
		: `${labels.aiUsageRemainingLabel}: ${labels.aiUsageUnavailableLabel}`

	useEffect(() => {
		if (!shouldRender) {
			return
		}

		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key !== 'Escape') return
			event.preventDefault()
			closeDrawer()
		}

		document.addEventListener('keydown', onKeyDown, true)
		return () => document.removeEventListener('keydown', onKeyDown, true)
	}, [shouldRender, location.pathname, location.search])

	if (!shouldRender) {
		return null
	}

	return (
		<AIAdvisorDrawerView
			viewName={viewContext.name}
			billingLocked={billingLocked}
			aiUsage={aiUsage}
			aiUsageSubtitle={aiUsageSubtitle}
			aiUsageRemainingLabel={labels.aiUsageRemainingLabel}
			aiUsageRemaining={aiUsageRemaining}
			batteryColor={batteryColor}
			aiAdvisorAvatarAlt={labels.aiAdvisorAvatarAlt}
			closeAiAdvisorLabel={labels.closeAiAdvisorLabel}
			keyboardShortcutsLabel={labels.keyboardShortcutsLabel}
			messages={messages}
			draftMessage={draftMessage}
			adviceContext={adviceContext}
			isSendingUserMessage={isSendingUserMessage}
			askAdvisorPlaceholder={labels.askAdvisorPlaceholder}
			sendButtonLabel={labels.sendButtonLabel}
			onClose={closeDrawer}
			onDraftMessageChange={setDraftMessage}
			onSendUserMessage={onSendUserMessage}
		/>
	)
}
