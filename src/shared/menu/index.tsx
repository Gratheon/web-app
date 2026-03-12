// @ts-nocheck
import { NavLink, useLocation } from 'react-router-dom'

import Header from '@/shared/header'
import {logout} from '@/user'
import {getAppUri} from '@/uri'
import T from '@/shared/translate'
import Avatar from '@/shared/avatar'
import styles from './styles.module.less'
import HiveIcon from '@/icons/hive'
import { useState } from 'react'
import CryptoJS from 'crypto-js'
import * as userModel from '@/models/user'
import { TAWKTO_TOKEN } from '@/config'
import CreditCard from '@/icons/creditCard'
import KeyIcon from '@/icons/key'

const MOBILE_NAV_ICON_SIZE = 24
const AI_ADVISOR_CONTEXT_KEY = 'ai-advisor-last-hive-context'

async function onLogoutClick() {
    await logout()

    window.location.href = getAppUri() + '/account/authenticate/'
}

function generateHmac(message: string, secret: string) {
    return CryptoJS.HmacSHA256(message, secret).toString(CryptoJS.enc.Hex)
}

async function openSupportChat() {
    const tawkApi = window?.Tawk_API

    if (tawkApi?.maximize) {
        tawkApi.maximize()
        return
    }

    if (!tawkApi) {
        window.location.href = 'https://gratheon.com'
        return
    }

    const userInfo = await userModel.getUser()
    if (!userInfo?.email) {
        window.location.href = 'https://gratheon.com'
        return
    }

    const hash = await generateHmac(`${userInfo.email}`, TAWKTO_TOKEN)

    //@ts-ignore
    tawkApi.onLoad = async function () {
        //@ts-ignore
        tawkApi.login(
            {
                hash,
                email: userInfo.email,
                name: `${userInfo.first_name} ${userInfo.last_name}`,
                userId: `${userInfo.id}`,
            },
            console.error
        )

        //@ts-ignore
        tawkApi.setAttributes(
            {
                hash,
                email: userInfo.email,
                name: `${userInfo.first_name} ${userInfo.last_name}`,
            },
            console.error
        )

        if (userInfo?.billingPlan) {
            //@ts-ignore
            tawkApi.addTags([userInfo.billingPlan], console.error)
        }
    }

    //@ts-ignore
    tawkApi.language = 'en'

    if (typeof tawkApi.start === 'function') {
        //@ts-ignore
        tawkApi.start({
            message: 'Hi, how can we help you today?',
        })
    }

    if (typeof tawkApi.maximize === 'function') {
        //@ts-ignore
        tawkApi.maximize()
    } else {
        window.location.href = 'https://gratheon.com'
    }
}

function HamburgerIcon({ size = MOBILE_NAV_ICON_SIZE }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="4" y="6" width="16" height="2.2" rx="1.1" fill="currentColor" />
            <rect x="4" y="10.9" width="16" height="2.2" rx="1.1" fill="currentColor" />
            <rect x="4" y="15.8" width="16" height="2.2" rx="1.1" fill="currentColor" />
        </svg>
    )
}

function LightBulbIcon({ size = MOBILE_NAV_ICON_SIZE }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9.5 17H14.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
            <path d="M10 20H14" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
            <path
                d="M12 4C9.79 4 8 5.79 8 8C8 9.73 9.1 11.2 10.64 11.76C11.03 11.9 11.3 12.27 11.3 12.69V14H12.7V12.69C12.7 12.27 12.97 11.9 13.36 11.76C14.9 11.2 16 9.73 16 8C16 5.79 14.21 4 12 4Z"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
            />
        </svg>
    )
}

function BearFaceIcon({ size = MOBILE_NAV_ICON_SIZE }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="6.5" cy="7.5" r="2.5" stroke="currentColor" stroke-width="2" />
            <circle cx="17.5" cy="7.5" r="2.5" stroke="currentColor" stroke-width="2" />
            <circle cx="12" cy="13" r="6.5" stroke="currentColor" stroke-width="2" />
            <path d="M8.1 11.5L10.1 10.8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
            <path d="M15.9 11.5L13.9 10.8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
            <circle cx="9.5" cy="12.8" r="0.95" fill="currentColor" />
            <circle cx="14.5" cy="12.8" r="0.95" fill="currentColor" />
            <path d="M12 13.9 L10.7 15.5 H13.3 Z" fill="currentColor" />
            <path d="M9.9 16.1C10.6 15.5 11.4 15.2 12 15.2C12.6 15.2 13.4 15.5 14.1 16.1" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" />
            <path d="M11.2 16.1L11.55 17.1L11.9 16.1" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" />
            <path d="M12.1 16.1L12.45 17.1L12.8 16.1" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
    )
}

function AIAdvisorIcon({ size = MOBILE_NAV_ICON_SIZE }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="6" y="5.5" width="12" height="11" rx="3" stroke="currentColor" stroke-width="2" />
            <path d="M9.5 19H14.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
            <circle cx="10" cy="11" r="1.1" fill="currentColor" />
            <circle cx="14" cy="11" r="1.1" fill="currentColor" />
            <path d="M10.2 14.1C10.9 14.6 11.4 14.8 12 14.8C12.6 14.8 13.1 14.6 13.8 14.1" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" />
            <path d="M9 5.5V4.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
            <path d="M15 5.5V4.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
        </svg>
    )
}

function SupportIcon({ size = MOBILE_NAV_ICON_SIZE }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M6 9.5C6 6.46 8.46 4 11.5 4H12.5C15.54 4 18 6.46 18 9.5V11.5C18 12.33 17.33 13 16.5 13H15V10.5C15 9.67 14.33 9 13.5 9H10.5C9.67 9 9 9.67 9 10.5V13H7.5C6.67 13 6 12.33 6 11.5V9.5Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round" />
            <path d="M12 13V15.5C12 17.43 10.43 19 8.5 19H8" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
            <rect x="5.5" y="8.5" width="2.5" height="6" rx="1.2" stroke="currentColor" stroke-width="1.8" />
            <rect x="16" y="8.5" width="2.5" height="6" rx="1.2" stroke="currentColor" stroke-width="1.8" />
        </svg>
    )
}

function LogoutIcon({ size = MOBILE_NAV_ICON_SIZE }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M10 4H6.5C5.67 4 5 4.67 5 5.5V18.5C5 19.33 5.67 20 6.5 20H10" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
            <path d="M13 16L17 12L13 8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
            <path d="M9 12H17" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
        </svg>
    )
}


const navClassName = ({isActive}) => (isActive ? styles.active : '')
const mobileNavClassName = ({isActive}) =>
    isActive ? `${styles.mobileNavLink} ${styles.active}` : styles.mobileNavLink
const utilityButtonClassName = (isSelected) =>
    isSelected ? `${styles.utilityButton} ${styles.utilityButtonSelected}` : styles.utilityButton

function getCurrentHiveContext(pathname: string) {
    const matches = pathname.match(/^\/apiaries\/(\d+)\/hives\/(\d+)(?:\/|$)/)
    if (!matches) {
        return null
    }

    return {
        apiaryId: +matches[1],
        hiveId: +matches[2],
    }
}

function getStoredHiveContext() {
    try {
        const value = localStorage.getItem(AI_ADVISOR_CONTEXT_KEY)
        if (!value) return null

        const parsed = JSON.parse(value)
        if (!parsed?.apiaryId || !parsed?.hiveId) return null

        return {
            apiaryId: +parsed.apiaryId,
            hiveId: +parsed.hiveId,
        }
    } catch {
        return null
    }
}

const Menu = ({isLoggedIn = false}) => {
    if (!isLoggedIn) {
        return (
            <nav id={styles.menu}>
                <Header/>
                <ul>
                    <li>
                        <NavLink activeClassName={styles.active} to="/account/authenticate">
                            Authentication
                        </NavLink>
                    </li>
                    <li>
                        <NavLink activeClassName={styles.active} to="/account/register">
                            Registration
                        </NavLink>
                    </li>
                    {/*<li>*/}
                    {/*	<Link activeClassName={styles.active} href="/account/restore">*/}
                    {/*		Restoration*/}
                    {/*	</Link>*/}
                    {/*</li>*/}
                </ul>
            </nav>
        )
    }




    let [isMoreVisible, setMoreVisible] = useState(false)
    const location = useLocation()

    const isAlertsSection = location.pathname === '/alert-config' || location.pathname.startsWith('/alert-config/')
    const currentHiveContext = getCurrentHiveContext(location.pathname)
    const isHiveAdvisorOpen = new URLSearchParams(location.search).get('aiAdvisor') === '1'
    const isAIAdvisorSection =
        location.pathname === '/ai-advisor' ||
        location.pathname.startsWith('/ai-advisor/') ||
        (!!currentHiveContext && isHiveAdvisorOpen)
    const storedHiveContext = getStoredHiveContext()
    const hiveContextForAdvisor = currentHiveContext || storedHiveContext
    const aiAdvisorPath = (() => {
        if (currentHiveContext) {
            const nextParams = new URLSearchParams(location.search)
            nextParams.set('aiAdvisor', '1')
            const search = nextParams.toString()
            return `${location.pathname}${search ? `?${search}` : ''}`
        }

        if (hiveContextForAdvisor) {
            return `/ai-advisor?apiaryId=${hiveContextForAdvisor.apiaryId}&hiveId=${hiveContextForAdvisor.hiveId}`
        }

        return '/ai-advisor'
    })()

    if (currentHiveContext) {
        localStorage.setItem(AI_ADVISOR_CONTEXT_KEY, JSON.stringify(currentHiveContext))
    }


    return (
        <>
            <nav id={styles.menu} className={styles.desktopMenu}>
                <Header/>

                <ul className={styles.menuSection}>
                    <li>
                        <NavLink
                            className={navClassName}
                            to="/apiaries">
                            <span className={styles.menuItemContent}>
                                <span className={styles.menuItemIcon}><HiveIcon size={18} /></span>
                                <span className={styles.menuItemLabel}><T>Hives</T></span>
                            </span>
                        </NavLink>
                    </li>
                    <li>
                        <NavLink
                            className={navClassName}
                            to="/time">
                            <span className={styles.menuItemContent}>
                                <span className={styles.menuItemIcon}><LightBulbIcon size={18} /></span>
                                <span className={styles.menuItemLabel}><T>Insights</T></span>
                            </span>
                        </NavLink>
                    </li>
                    <li>
                        <NavLink
                            className={() => (isAlertsSection ? styles.active : '')}
                            to="/alert-config">
                            <span className={styles.menuItemContent}>
                                <span className={styles.menuItemIcon}><BearFaceIcon size={18} /></span>
                                <span className={styles.menuItemLabel}><T>Alerts</T></span>
                            </span>
                        </NavLink>
                        {isAlertsSection && (
                            <ul className={styles.subMenu}>
                                <li>
                                    <NavLink
                                        className={({isActive}) =>
                                            isActive ? `${styles.subMenuLink} ${styles.active}` : styles.subMenuLink
                                        }
                                        to="/alert-config/channels"
                                    >
                                        <T>Channels</T>
                                    </NavLink>
                                </li>
                                <li>
                                    <NavLink
                                        className={({isActive}) =>
                                            isActive ? `${styles.subMenuLink} ${styles.active}` : styles.subMenuLink
                                        }
                                        to="/alert-config/rules"
                                    >
                                        <T>Rules</T>
                                    </NavLink>
                                </li>
                            </ul>
                        )}
                    </li>

                </ul>
                <div style="flex-grow:1"></div>

                <ul className={styles.menuSection}>
                    <li>
                        <NavLink
                            end
                            className={navClassName}
                            to="/account">
                            <div style="display:flex;">
                                <Avatar style="margin-right:5px;"/>
                                <T>Account</T>
                            </div>
                        </NavLink>
                    </li>
                    <li>
                        <NavLink
                            className={() => (isAIAdvisorSection ? styles.active : '')}
                            to={aiAdvisorPath}
                        >
                            <span className={styles.menuItemContent}>
                                <span className={styles.menuItemIcon}><AIAdvisorIcon size={18} /></span>
                                <span className={styles.menuItemLabel}><T>AI Advisor</T></span>
                            </span>
                        </NavLink>
                    </li>
                    <li>
                        <NavLink
                            className={navClassName}
                            to="/account/billing">
                            <span className={styles.menuItemContent}>
                                <span className={styles.menuItemIcon}><CreditCard size={18} /></span>
                                <span className={styles.menuItemLabel}><T>Billing</T></span>
                            </span>
                        </NavLink>
                    </li>
                    <li>
                        <NavLink
                            className={navClassName}
                            to="/account/tokens">
                            <span className={styles.menuItemContent}>
                                <span className={styles.menuItemIcon}><KeyIcon size={18} /></span>
                                <span className={styles.menuItemLabel}><T>API tokens</T></span>
                            </span>
                        </NavLink>
                    </li>

                    <li>
                        <a
                            href="#"
                            onClick={(event) => {
                                event.preventDefault()
                                openSupportChat()
                            }}
                        >
                            <span className={styles.menuItemContent}>
                                <span className={styles.menuItemIcon}><SupportIcon size={18} /></span>
                                <span className={styles.menuItemLabel}><T>Support</T></span>
                            </span>
                        </a>
                    </li>
                    
                    <li>
                        <a href="#" onClick={onLogoutClick}>
                            <span className={styles.menuItemContent}>
                                <span className={styles.menuItemIcon}><LogoutIcon size={18} /></span>
                                <span className={styles.menuItemLabel}><T>Log out</T></span>
                            </span>
                        </a>
                    </li>
                </ul>
            </nav>

            <div className={styles.mobileHeader}>
                <Header />
            </div>

            <nav className={styles.mobileBottomMenu}>
                <ul className={styles.mobileBottomList}>
                    <li>
                        <NavLink
                            className={mobileNavClassName}
                            to="/apiaries"
                            onClick={() => {
                                setMoreVisible(false)
                            }}
                        >
                            <span className={styles.navIcon}><HiveIcon size={MOBILE_NAV_ICON_SIZE} /></span>
                            <span className={styles.navLabel}><T>Hives</T></span>
                        </NavLink>
                    </li>
                    <li>
                        <NavLink
                            className={mobileNavClassName}
                            to="/time"
                            onClick={() => {
                                setMoreVisible(false)
                            }}
                        >
                            <span className={styles.navIcon}><LightBulbIcon size={MOBILE_NAV_ICON_SIZE} /></span>
                            <span className={styles.navLabel}><T>Insights</T></span>
                        </NavLink>
                    </li>
                    <li>
                        <NavLink
                            className={mobileNavClassName}
                            to="/alert-config"
                            onClick={() => {
                                setMoreVisible(false)
                            }}
                        >
                            <span className={styles.navIcon}><BearFaceIcon size={MOBILE_NAV_ICON_SIZE} /></span>
                            <span className={styles.navLabel}><T>Alerts</T></span>
                        </NavLink>
                    </li>
                    <li>
                        <button
                            className={utilityButtonClassName(isMoreVisible)}
                            onClick={() => {
                                setMoreVisible(!isMoreVisible)
                            }}
                            type="button"
                            aria-label="More"
                        >
                            <span className={styles.navIcon}><HamburgerIcon size={MOBILE_NAV_ICON_SIZE} /></span>
                            <span className={styles.navLabel}><T>More</T></span>
                        </button>
                    </li>
                </ul>
            </nav>

            {isMoreVisible && (
                <div className={styles.mobileMoreMenu}>
                    <NavLink
                        to={aiAdvisorPath}
                        onClick={() => {
                            setMoreVisible(false)
                        }}
                    >
                        <T>AI Advisor</T>
                    </NavLink>
                    <NavLink
                        to="/account"
                        onClick={() => {
                            setMoreVisible(false)
                        }}
                    >
                        <T>Account</T>
                    </NavLink>
                    <NavLink
                        to="/account/billing"
                        onClick={() => {
                            setMoreVisible(false)
                        }}
                    >
                        <T>Billing</T>
                    </NavLink>
                    <NavLink
                        to="/account/tokens"
                        onClick={() => {
                            setMoreVisible(false)
                        }}
                    >
                        <T>API tokens</T>
                    </NavLink>
                    <a href="https://gratheon.com/terms" onClick={() => setMoreVisible(false)}>
                        <T ctx="link in page footer">Terms of Use</T>
                    </a>
                    <a href="https://gratheon.com/privacy" onClick={() => setMoreVisible(false)}>
                        <T ctx="link in page footer">Privacy policy</T>
                    </a>
                    <button
                        type="button"
                        onClick={() => {
                            openSupportChat()
                            setMoreVisible(false)
                        }}
                    >
                        <T>Support</T>
                    </button>
                    <button
                        type="button"
                        onClick={async () => {
                            setMoreVisible(false)
                            await onLogoutClick()
                        }}
                    >
                        <T>Log out</T>
                    </button>
                </div>
            )}
        </>
    )
}

export default Menu
