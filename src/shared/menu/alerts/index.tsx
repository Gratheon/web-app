import React, {useState} from 'react'

import styles from './styles.module.less'
import BellIcon from "@/icons/bell";
import {gql} from "urql";
import {useQuery} from "@/api";
import ErrorMsg from "@/shared/messageError";
import Loader from "@/shared/loader";


const ALERT_LIST_QUERY = gql`
{
    alerts {
        id
        text
        time
    }
}
`

const Alerts = ({isLoggedIn = false}) => {
    let [isVisible, setVisible] = useState(false)

    let { loading, error, data, reexecuteQuery } = useQuery(ALERT_LIST_QUERY)

    if (loading) {
        return <Loader/>
    }

    let alerts = data.alerts

    return (
        <>
            <BellIcon size={20}
                      color={alerts && alerts.length > 0 ? "#ffd900" : "#ddd"}
                      stroke={alerts && alerts.length > 0 ? "black" : "#bbb"}
                      onClick={()=>setVisible(!isVisible)}/>
            {isVisible && <div
                style="border:1px solid #eee; position:absolute; background:white; min-width:300px; min-height: 20px;right:0; top:55px;border-radius: 0 0 0 5px;padding:5px 10px;">

                <ErrorMsg error={error} />


                {alerts && alerts.length === 0 && <div style="color:gray;">No alerts</div>}

                {alerts && alerts.length > 0 && alerts.map((alert) => (
                        <div key={alert.id} style="display:flex;">
                            <div>{alert.text}</div>
                            <div>{alert.time}</div>
                        </div>
                    ))
                }

            </div>}
        </>
    )
}

export default Alerts
