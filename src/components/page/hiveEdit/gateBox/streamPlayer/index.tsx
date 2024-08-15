import Hls from 'hls.js';
import React, { useEffect, RefObject } from 'react';
import styles from './style.module.less'
import { format } from 'date-fns';
import {de, et, fr, pl, ru, tr} from 'date-fns/locale'
import { useLiveQuery } from 'dexie-react-hooks';
import { getUser } from '../../../../models/user.ts';
const loadedDateLocales = { de, et, fr, pl, ru, tr }

function ReactHlsPlayer({
  hlsConfig,
  playerRef = React.createRef<HTMLVideoElement>(),
  src,
  autoPlay = true,
  ...props
}) {
  useEffect(() => {
    let hls: Hls;

    function _initPlayer() {
      if (hls != null) {
        hls.destroy();
      }

      const newHls = new Hls({
        enableWorker: false,
        ...hlsConfig,
      });

      if (playerRef.current != null) {
        newHls.attachMedia(playerRef.current);
      }

      newHls.on(Hls.Events.MEDIA_ATTACHED, () => {
        newHls.loadSource(src);

        newHls.on(Hls.Events.MANIFEST_PARSED, () => {
          if (autoPlay) {
            playerRef?.current
              ?.play()
              .catch(() =>
                console.log(
                  'Unable to autoplay prior to user interaction with the dom.'
                )
              );
          }
        });
      });

      newHls.on(Hls.Events.ERROR, function (event, data) {
        if (data.fatal) {
          console.error(data)
          // switch (data.type) {
            // case Hls.ErrorTypes.NETWORK_ERROR:
            //   newHls.startLoad();
            //   break;
            // case Hls.ErrorTypes.MEDIA_ERROR:
            //   newHls.recoverMediaError();
            //   break;
            // default:
            //   console.error(data)
            //   // _initPlayer();
            //   break;
          // }
        }
      });

      hls = newHls;
    }

    // Check for Media Source support
    if (Hls.isSupported()) {
      _initPlayer();
    }

    return () => {
      if (hls != null) {
        hls.destroy();
      }
    };
  }, [autoPlay, hlsConfig, playerRef, src]);

  // If Media Source is supported, use HLS.js to play video
  if (Hls.isSupported()) return <video ref={playerRef} {...props} />;

  // Fallback to using a regular video player if HLS is supported by default in the user's browser
  return <video ref={playerRef} src={src} autoPlay={autoPlay} {...props} />;
}

export default function StreamPlayer({ videoStreams }) {

  let [selectedStream, selectStream] = React.useState(videoStreams.length - 1)

  if (!videoStreams) return

  let playlistURL = videoStreams[selectedStream]?.playlistURL

  if (!playlistURL) return
  // 720px for 12h at 1 min = 1 px

  let userStored = useLiveQuery(() =>  getUser(), [], null)

  if(!userStored){
    return;
  }
  const dateLangOptions = { locale: loadedDateLocales[userStored.lang] }
  
  return <div>
    {videoStreams.map((stream, index) => {
      return <div
        key={index}
        onClick={() => selectStream(index)}
        className={styles.streamSelector}
        style={{
          backgroundColor: selectedStream === index ? "rgba(0, 0, 0, 0.3)" : "rgba(0, 0, 0, 0.1)"
        }}
      >
        {format(new Date(stream.startTime), 'dd MMMM yyyy, hh:mm', dateLangOptions)} &mdash;
        {format(new Date(stream.endTime), 'dd MMMM yyyy, hh:mm', dateLangOptions)}

        ({stream.maxSegment * 10} sec)
      </div>
    })}

    {//@ts-ignore
    }<ReactHlsPlayer src={playlistURL} autoPlay={false} controls={true} style={{ maxWidth: "640px", width:'100%' }} />

  </div>
}
