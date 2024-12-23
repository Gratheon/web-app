import React, { useEffect, useRef, useState } from 'react';
import { videoUploadUri } from '@/uri.ts'
import { useUploadMutation, gql } from '@/api'

import T from '@/shared/translate';
import VisualForm from '@/shared/visualForm';
import Button from '@/shared/button';


const VideoCapture = ({ boxId }) => {
  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const [hasCameraPermission, setHasCameraPermission] = useState(false);
  const [cameraDevices, setCameraDevices] = useState([]);
  const [selectedCameraDeviceId, setSelectedCameraDeviceId] = useState('');
  const [isCaptureStarted, setIsCaptureStarted] = useState(false);

  // @ts-ignore
  const [uploadFile, { data: uploadResponse }] = useUploadMutation(gql`
  mutation uploadGateVideo($file: Upload!, $boxId: ID!) {
    uploadGateVideo(file: $file, boxId: $boxId)
  }
`, videoUploadUri())

  useEffect(() => {
    const checkCameraPermission = async () => {
      try {
        // @ts-ignore
        const permissionStatus = await navigator.permissions.query({ name: 'camera' });
        setHasCameraPermission(permissionStatus.state === 'granted');
      } catch (error) {
        console.error('Error checking camera permission:', error);
      }
    };

    const getCameraDevices = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const cameras = devices.filter(device => device.kind === 'videoinput');
        setCameraDevices(cameras);
      } catch (error) {
        console.error('Error retrieving camera devices:', error);
      }
    };

    checkCameraPermission();
    getCameraDevices();
  }, []);

  useEffect(() => {
    let timeoutId;

    const startVideoCapture = async () => {
      const video = videoRef.current;

      const constraints = {
        video: {
          deviceId: selectedCameraDeviceId ? { exact: selectedCameraDeviceId } : undefined
        }
      };

      try {
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        video.srcObject = stream;
        setHasCameraPermission(true);

        mediaRecorderRef.current = new MediaRecorder(stream);

        mediaRecorderRef.current.ondataavailable = handleDataAvailable;
        mediaRecorderRef.current.onstop = handleStop;

        chunksRef.current = [];

        mediaRecorderRef.current.start();

        timeoutId = setTimeout(stopVideoCapture, 10000);
      } catch (error) {
        console.error('Error accessing camera:', error);
      }
    };

    const stopVideoCapture = () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }

      clearTimeout(timeoutId);
    };

    const handleDataAvailable = event => {
      if (event.data && event.data.size > 0) {
        chunksRef.current.push(event.data);
      }
    };

    const handleStop = async () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      // const videoUrl = URL.createObjectURL(blob);

      // @ts-ignore
      const { data, error } = await uploadFile({
        file: blob,
        boxId
      })

      // Reset chunks array for the next capture
      chunksRef.current = [];

      // Restart the capture after a delay of 5 seconds
      timeoutId = setTimeout(startVideoCapture, 10000);
    };

    if (hasCameraPermission && isCaptureStarted) {
      startVideoCapture();
    }

    if (!isCaptureStarted && timeoutId) {
      stopVideoCapture()
    }

    return stopVideoCapture;
  }, [selectedCameraDeviceId, hasCameraPermission, isCaptureStarted]);

  const requestPermissions = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      videoRef.current.srcObject = stream;
      setHasCameraPermission(true);

      const devices = await navigator.mediaDevices.enumerateDevices();
      const cameras = devices.filter(device => device.kind === 'videoinput');
      setCameraDevices(cameras);
    } catch (error) {
      console.error('Error requesting camera permissions:', error);
    }
  };

  const handleCameraChange = event => {
    const newCameraDeviceId = event.target.value;

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    setSelectedCameraDeviceId(newCameraDeviceId);
  };

  const handleCaptureStart = (e) => {
    setIsCaptureStarted(true);
    e.preventDefault();
  };

  const handleCaptureStop = (e) => {
    setIsCaptureStarted(false);
    e.preventDefault();
    
  };

  return (
    <>
      <h3>👁️‍🗨️ <T>Entrance Observer</T></h3>

      <p>
        <T>
          Entrance Observer allows you to monitor your hive entrance by counting bees entering and exiting.
          It can also stream video to the app for playback. You can even use your phone camera to stream video to the app.
        </T>
      </p>

      {!hasCameraPermission && (
        <button onClick={requestPermissions}>Allow camera access</button>
      )}

      {hasCameraPermission && (
        <div style="display:flex;width:100%;">
          <div style="flex:1;">

            <VisualForm>
              <div>
                <label htmlFor="camera-select" style="width:120px;"><T>Camera</T></label>
                <select id="camera-select" value={selectedCameraDeviceId} onChange={handleCameraChange}>
                  {cameraDevices.map(camera => (
                    <option key={camera.deviceId} value={camera.deviceId}>
                      {camera.label || `Camera ${camera.deviceId}`}
                    </option>
                  ))}
                </select>

                {!isCaptureStarted && (
                  <Button onClick={handleCaptureStart} type="button">
                    <T>Start stream</T>
                  </Button>
                )}
                {isCaptureStarted && (
                  <Button onClick={handleCaptureStop} type="button"><T>Stop stream</T></Button>
                )}
              </div>
            </VisualForm>

            {isCaptureStarted &&
              <div>
                🟢 <T>Video recording in progress</T> <br />

                {uploadResponse && uploadResponse?.uploadGateVideo && <>
                  🟢 <T>Fragment upload succeeded</T>
                </>}

                {uploadResponse && !uploadResponse?.uploadGateVideo && <>
                  🔴 <T>Fragment upload failed</T>
                </>}
              </div>
            }

            {isCaptureStarted &&
              <video
                title="Local video stream preview"
                ref={videoRef} style={{ width: '100%', maxWidth: '400px' }}
                autoPlay></video>
            }
          </div>

        </div>
      )}
    </>
  );
};

export default VideoCapture;
