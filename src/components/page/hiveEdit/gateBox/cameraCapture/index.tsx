import React, { useEffect, useRef, useState } from 'react';
import { videoUploadUri } from '@/components/uri'
import { useUploadMutation, gql } from '@/components/api'

const VideoCapture = ({ boxId }) => {
  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const [hasCameraPermission, setHasCameraPermission] = useState(false);
  const [cameraDevices, setCameraDevices] = useState([]);
  const [selectedCameraDeviceId, setSelectedCameraDeviceId] = useState('');
  const [isCaptureStarted, setIsCaptureStarted] = useState(false);

  const [uploadFile, /*{ loading, error, data }*/] = useUploadMutation(gql`
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

  const handleCaptureStart = () => {
    setIsCaptureStarted(true);
  };

  const handleCaptureStop = () => {
    setIsCaptureStarted(false);
  };

  return (
    <div>
      {!hasCameraPermission && (
        <button onClick={requestPermissions}>Allow camera access</button>
      )}
      {hasCameraPermission && (
        <>
          <label htmlFor="camera-select">Camera:</label>
          <select id="camera-select" value={selectedCameraDeviceId} onChange={handleCameraChange}>
            {cameraDevices.map(camera => (
              <option key={camera.deviceId} value={camera.deviceId}>
                {camera.label || `Camera ${camera.deviceId}`}
              </option>
            ))}
          </select>
          {!isCaptureStarted && (
            <button onClick={handleCaptureStart}>Start stream</button>
          )}
          {isCaptureStarted && (
            <button onClick={handleCaptureStop}>Stop stream</button>
          )}
        </>
      )}
      {isCaptureStarted && <video ref={videoRef} style={{ width: '100%', maxHeight: '600px' }} autoPlay></video>}

      {!isCaptureStarted &&
        <div style="padding:10px;display:flex;">
          <img width="100"
            src="https://github.com/Gratheon/models-gate-tracker/raw/main/readmeFiles/ks_1.jpg" />

          <p style="padding:10px;">
            You can stream video of your hive entrance directly from the app to the cloud.
            Position it above hive entrance. Use green landing board for bee detection to work.
          </p>
        </div>
      }
    </div>
  );
};

export default VideoCapture;
