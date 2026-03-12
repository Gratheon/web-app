// @ts-nocheck
import {NavLink} from 'react-router-dom'

import Header from '@/shared/header'
import {logout} from '@/user'
import {getAppUri} from '@/uri'
import T from '@/shared/translate'
import Avatar from '@/shared/avatar'
import styles from './styles.module.less'
import BellIcon from "@/icons/bell";
import HiveIcon from '@/icons/hive'
import Alerts from "@/shared/menu/alerts";
import {useState} from "react";
import {gql} from "urql";
import {useQuery} from "@/api";
import Loader from "@/shared/loader";

const MOBILE_NAV_ICON_SIZE = 24

async function onLogoutClick() {
    await logout()

    window.location.href = getAppUri() + '/account/authenticate/'
}

function openSupportChat() {
    if (window?.Tawk_API?.maximize) {
        window.Tawk_API.maximize()
        return
    }

    window.location.href = 'https://gratheon.com'
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


const ALERT_LIST_QUERY = gql`
{
    alerts {
        id
        text
        date_added
    }
}
`

const navClassName = ({isActive}) => (isActive ? styles.active : '')
const mobileNavClassName = ({isActive}) =>
    isActive ? `${styles.mobileNavLink} ${styles.active}` : styles.mobileNavLink
const utilityButtonClassName = (isSelected) =>
    isSelected ? `${styles.utilityButton} ${styles.utilityButtonSelected}` : styles.utilityButton

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




    let [isVisible, setVisible] = useState(false)
    let [isMoreVisible, setMoreVisible] = useState(false)


    let { loading, error, data, reexecuteQuery } = useQuery(ALERT_LIST_QUERY)

    if (loading) {
        return <Loader stroke="black" size={0}/>
    }

    let alerts = data.alerts
    const hasAlerts = alerts && alerts.length > 0


    return (
        <>
            <nav id={styles.menu} className={styles.desktopMenu}>
                <Header/>

                <ul className={styles.menuSection}>
                    <li>
                        <NavLink
                            className={navClassName}
                            to="/apiaries">
                            <T>Hives</T>
                        </NavLink>
                    </li>
                    <li>
                        <NavLink
                            className={navClassName}
                            to="/time">
                            <T>Insights</T>
                        </NavLink>
                    </li>
                    <li>
                        <NavLink
                            className={navClassName}
                            to="/alert-config">
                            <T>Alerts</T>
                        </NavLink>
                    </li>

                </ul>
                <div style="flex-grow:1"></div>

                <ul className={styles.menuSection}>
                    <li>
                        <BellIcon size={20}
                                  color={hasAlerts ? "#ffd900" : "#ddd"}
                                  stroke={hasAlerts ? "black" : "#bbb"}
                                  onClick={() => setVisible(!isVisible)}/>
                    </li>

                    <li>
                        <NavLink
                            className={navClassName}
                            to="/account">
                            <div style="display:flex;">
                                <Avatar style="margin-right:5px;"/>
                                <T>Account</T>
                            </div>
                        </NavLink>
                    </li>
                    
                    <li>
                        <a href="#" onClick={onLogoutClick}>
                            <T>Log out</T>
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
                                setVisible(false)
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
                                setVisible(false)
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
                                setVisible(false)
                                setMoreVisible(false)
                            }}
                        >
                            <span className={styles.navIcon}><BearFaceIcon size={MOBILE_NAV_ICON_SIZE} /></span>
                            <span className={styles.navLabel}><T>Alerts</T></span>
                        </NavLink>
                    </li>
                    <li>
                        <button
                            className={utilityButtonClassName(isVisible)}
                            onClick={() => {
                                setVisible(!isVisible)
                                setMoreVisible(false)
                            }}
                            type="button"
                            aria-label="Notifications"
                        >
                            <span className={styles.navIcon}>
                                <BellIcon
                                size={MOBILE_NAV_ICON_SIZE}
                                color={isVisible ? "#ffb000" : (hasAlerts ? "#ffd900" : "transparent")}
                                stroke={isVisible ? "#2b2200" : (hasAlerts ? "#222" : "#777")}
                                strokeWidth={2.3}
                            />
                            </span>
                            <span className={styles.navLabel}><T>Notifications</T></span>
                        </button>
                    </li>
                    <li>
                        <button
                            className={utilityButtonClassName(isMoreVisible)}
                            onClick={() => {
                                setMoreVisible(!isMoreVisible)
                                setVisible(false)
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

            {isVisible && <Alerts alerts={alerts} error={error} onClose={() => setVisible(false)} />}
            {isMoreVisible && (
                <div className={styles.mobileMoreMenu}>
                    <NavLink
                        to="/account"
                        onClick={() => {
                            setMoreVisible(false)
                            setVisible(false)
                        }}
                    >
                        <T>Account</T>
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
