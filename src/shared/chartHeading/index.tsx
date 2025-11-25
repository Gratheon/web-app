import InfoIcon from '@/shared/infoIcon'

interface ChartHeadingProps {
    title: string
    value?: string
    info?: string
    emoji?: string
}

export default function ChartHeading({title, value, info, emoji}: ChartHeadingProps) {
    return (
        <div style={{fontSize: '18px', display: 'flex', alignItems: 'center', paddingRight: '20px'}}>
            {emoji && <span style={{marginRight: '8px', fontSize: '20px'}}>{emoji}</span>}
            <span style={{flexGrow: 1, display: 'flex', alignItems: 'center'}}>
                {title}
                {info && (
                    <InfoIcon size={14}>
                        <p style={{margin: 0, fontSize: '14px', lineHeight: '1.5'}}>{info}</p>
                    </InfoIcon>
                )}
            </span>
            {value && <strong>{value}</strong>}
        </div>
    )
}