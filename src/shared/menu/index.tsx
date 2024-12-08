// @ts-nocheck
import {NavLink} from 'react-router-dom'

import Header from '../header'
import {logout} from '../../user.ts'
import {getAppUri} from '../../uri.ts'
import T from '../translate'
import Avatar from '../avatar'
import styles from './styles.module.less'
import BellIcon from "@/icons/bell.tsx";
import Alerts from "@/shared/menu/alerts";
import {useState} from "react";
import {gql} from "urql";
import {useQuery} from "@/api";
import Loader from "@/shared/loader";

async function onLogoutClick() {
    await logout()

    window.location.href = getAppUri() + '/account/authenticate/'
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


    let { loading, error, data, reexecuteQuery } = useQuery(ALERT_LIST_QUERY)

    if (loading) {
        return <Loader stroke="black" size={0}/>
    }

    let alerts = data.alerts


    return (
        <>
            <nav id={styles.menu}>
                <Header/>

                <ul>
                    <li>
                        <NavLink
                            className={({isActive, isPending}) =>
                                isActive ? styles.active : ""
                            }
                            to="/apiaries">
                            <T>Hives</T>
                        </NavLink>
                    </li>

                    <li>
                        <NavLink activeClassName={styles.active} to="/insights">
                            <T ctx="this is a menu link to beehive data analytics">Insights</T>
                        </NavLink>
                    </li>

                    <li>
                        <NavLink
                            className={({isActive, isPending}) =>
                                isActive ? styles.active : ""
                            }
                            to="/account">
                            <div style="display:flex;">
                                <Avatar style="margin-right:5px;"/>
                                <T>Account</T>
                            </div>
                        </NavLink>
                    </li>
                </ul>
                <div style="flex-grow:1"></div>

                <ul>
                    <li>
                        <BellIcon size={20}
                                  color={alerts && alerts.length > 0 ? "#ffd900" : "#ddd"}
                                  stroke={alerts && alerts.length > 0 ? "black" : "#bbb"}
                                  onClick={() => setVisible(!isVisible)}/>
                    </li>

                    <li>
                        <a href="#" onClick={onLogoutClick}>
                            <T>Log out</T>
                        </a>
                    </li>
                </ul>
            </nav>

            {isVisible && <Alerts alerts={alerts} error={error}/>}
        </>
    )
}

export default Menu
