import React from 'react'

import styles from './styles.module.less'
import ErrorMsg from "@/shared/messageError";
import DateTimeFormat from "@/shared/dateTimeFormat";

// Add onClose prop
type AlertsProps = {
  alerts: any,
  error: any,
  onClose?: () => void
}

const Alerts = ({alerts, error}: AlertsProps) => {
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
        </div>
    )
}

export default Alerts
