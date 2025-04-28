import styles from './styles.module.less'

export default function VisualFormSubmit({ children }) {
	return <div className={`${styles.buttonsWrap}`}>{children}</div>
}