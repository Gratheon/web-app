import React, {useState} from 'react'

import styles from './styles.module.less'
import BellIcon from "@/icons/bell";
import {gql} from "urql";
import {useQuery} from "@/api";
import ErrorMsg from "@/shared/messageError";
import Loader from "@/shared/loader";
import DateFormat from "@/shared/dateFormat";


const Alerts = ({alerts, error}) => {
    return (
        <>
            <div className={styles.alertList}>

                <ErrorMsg error={error} />

                {!alerts || alerts && alerts.length === 0 && <div style="color:gray;">No alerts</div>}

                {alerts && alerts.length > 0 && alerts.map((alert) => (
                        <div key={alert.id} style="display:flex;">
                            <div style="flex-grow:1; text-align:left;">{alert.text}</div>
                            <div style="font-size:12px;">
                                <DateFormat datetime={alert.date_added} />
                            </div>
                        </div>
                    ))
                }

            </div>
        </>
    )
}

export default Alerts
