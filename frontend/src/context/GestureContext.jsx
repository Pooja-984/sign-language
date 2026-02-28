import React, { createContext, useState, useEffect, useRef, useCallback } from 'react';
import { detectControlGesture } from '../utils/gestureRecognition';

export const GestureContext = createContext();

export const GestureContextProvider = ({ children }) => {
    const videoRef = useRef(null);
    const [stream, setStream] = useState(null);
    const [isCameraOn, setIsCameraOn] = useState(false);
    const [landmarks, setLandmarks] = useState(null);
    const [gesture, setGesture] = useState(null);
    const [modelStatus, setModelStatus] = useState("Initializing...");
    const [handpose, setHandpose] = useState(null);

    const startCamera = async () => {
        if (isCameraOn) return;
        try {
            console.log("Requesting Camera Access...");
            const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
            setStream(mediaStream);
            setIsCameraOn(true);

            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
                videoRef.current.play();
            }
        } catch (err) {
            console.error("Error accessing camera:", err);
            setModelStatus("Camera Error: " + err.message);
        }
    };

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
        setIsCameraOn(false);
        setLandmarks(null);
        setGesture(null);
    };

    // Auto-start camera on mount (User Request)
    useEffect(() => {
        startCamera();
        return () => stopCamera();
    }, []);

    // Initialize Handpose when video is ready
    const handleVideoLoad = () => {
        if (videoRef.current && !handpose && window.ml5) {
            console.log("Loading Global Handpose Model...");
            setModelStatus("Loading Handpose...");

            const hp = window.ml5.handpose(videoRef.current, () => {
                console.log("Global Handpose Loaded");
                setModelStatus("Handpose Ready");
            });

            hp.on("predict", (results) => {
                if (results && results.length > 0) {
                    setLandmarks(results[0].landmarks);
                    const detected = detectControlGesture(results[0].landmarks);
                    setGesture(detected);
                } else {
                    setLandmarks(null);
                    setGesture(null);
                }
            });

            setHandpose(hp);
        }
    };

    return (
        <GestureContext.Provider value={{
            videoRef,
            stream,
            isCameraOn,
            landmarks,
            gesture,
            modelStatus,
            startCamera,
            stopCamera
        }}>
            {children}
            {/* Hidden global video for processing */}
            <video
                ref={videoRef}
                style={{ position: 'fixed', top: '-1000px', left: '-1000px', opacity: 0 }}
                width={640}
                height={480}
                muted
                playsInline
                onLoadedData={handleVideoLoad}
            />
        </GestureContext.Provider>
    );
};
