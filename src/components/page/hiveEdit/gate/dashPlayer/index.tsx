import React, { useEffect, useRef } from "react";
import dashjs from "dashjs";

export default function DashPlayer({ manifestBase64 }) {
  if(!manifestBase64){
    return
  }

  const dataUrl = ("data:application/dash+xml;charset=utf-8;base64," + manifestBase64)
  const videoRef = useRef(null);
  const playerRef = useRef(null);

  useEffect(() => {
    async function init() {
      if (videoRef.current) {
        const video = videoRef.current;

        // const dashjs = await import('dashjs')
        playerRef.current = dashjs.MediaPlayer().create();

        playerRef.current.initialize(video, dataUrl, true);
        playerRef.current.updateSettings({
          'debug': {
            'logLevel': dashjs.Debug.LOG_LEVEL_INFO
          },
        });
        // playerRef.current.attachView(video);

        // var controlbar = new ControlBar(playerRef.current, null);
        // controlbar.initialize();
      }
    }
    init();

    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
    };
  }, [manifestBase64]);

  return (
<div class="dash-video-player ">
      <div class="videoContainer" id="videoContainer">
        <video
          slot="media"
          controls={false}
          ref={videoRef}
          style={{ width: "100%" }}
          preload="auto"
          autoPlay
        />
      </div>
    </div>
  );
}
