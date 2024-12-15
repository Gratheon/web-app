export default function ChartHeading({title, value, info}) {
    return <>
        <div style={{fontSize: '20px', display: 'flex', paddingRight: '20px'}}>
            <span style={"flex-grow:1"}>{title}</span>
            <strong>{value}</strong>
        </div>

        <div style={"font-size:10px; color:gray;"}>{info}</div>
    </>
}