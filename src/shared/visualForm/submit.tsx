import styles from './styles.module.less'

export default function VisualFormSubmit({ children, className = '' }) {
	return <div className={`${styles.buttonsWrap} ${className}`}>{children}</div>
}
