import React from 'react'
import { Link } from 'react-router-dom'

import styles from './styles.module.less'
import BellIcon from "@/icons/bell";
import {gql} from "urql";
import {useQuery} from "@/api";
import ErrorMsg from "@/shared/messageError";
import Loader from "@/shared/loader";
import DateTimeFormat from "@/shared/dateTimeFormat";

const Alerts = ({alerts, error}) => {
    return (
        <div className={styles.alertDropdownContainer}>
            <div className={styles.alertList}>
                <ErrorMsg error={error} />
                {!alerts || alerts && alerts.length === 0 && <div style={{color: 'gray'}}>No alerts</div>}
                {alerts && alerts.length > 0 && alerts.map((alert) => (
                    <div key={alert.id} style={{display: 'flex'}}>
                        <div style={{flexGrow: 1, textAlign: 'left'}}>{alert.text}</div>
                        <div style={{fontSize: 12}}>
                            <DateTimeFormat datetime={alert.date_added} />
                        </div>
                    </div>
                ))}
            </div>
            <div className={styles.alertDropdownFooter}>
                <Link to="/alert-config" style={{ color: '#1976d2', textDecoration: 'underline', fontSize: 14 }}>
                    Alert Channel Settings
                </Link>
            </div>
        </div>
    )
}

export default Alerts
