import style from './style.less'

export default function FeederHorizontal({selected = false}) {
    return <div className={`${style.feeder} ${selected && style.selected}`}>
        <div className={style.sugarArea}></div>
        <div className={style.beeArea}>

            <svg viewBox="0 0 517 135" xmlns="http://www.w3.org/2000/svg">
                <path
                    style="stroke: rgb(0, 0, 0); fill: rgb(204, 226, 255); stroke-opacity: 0.16; transform-origin: 255.658px 199.302px;"
                    d="M 136.839 1.265 L 81.61 133.252 L 412.657 132.356 L 356.791 1.195 L 136.839 1.265 Z"/>
                <rect x="166.157" y="25.686" width="165.424" height="107.528"
                      style="fill: rgb(216, 216, 216); stroke: rgb(0, 0, 0); transform-origin: 255.075px 185.132px;"/>
                <rect x="177.263" y="25.873" width="141.856" height="107.432"
                      style="fill: rgb(216, 216, 216); stroke: rgb(0, 0, 0); stroke-opacity: 0.43;"
                      transform="matrix(0.9999999999999999, 0, 0, 0.9999999999999999, 0, -1.4210854715202004e-14)"/>
            </svg>
        </div>
    </div>
}