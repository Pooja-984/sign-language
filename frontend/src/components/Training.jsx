import React, { useRef, useEffect, useState } from 'react';
import { Camera, CameraOff, Plus, Download, Upload, Trash2, Save, RefreshCw, BarChart2, Video } from 'lucide-react';
import { drawHand } from "../utils/handPoseDraw";
import { baseURL } from '../Config/config';
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-webgl';
import * as handPoseDetection from '@tensorflow-models/hand-pose-detection';

const Training = () => {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [isCameraOn, setIsCameraOn] = useState(false);
    const [handposeModel, setHandposeModel] = useState(null);
    const [model, setModel] = useState(null); // TFJS Model
    const [examples, setExamples] = useState(() => {
        const saved = localStorage.getItem('trainingExamples');
        return saved ? JSON.parse(saved) : [];
    });
    const [modelStatus, setModelStatus] = useState("Initializing...");
    const [classes, setClasses] = useState(() => {
        const saved = localStorage.getItem('trainingClasses');
        return saved ? JSON.parse(saved) : [];
    });
    const [newClassName, setNewClassName] = useState("");
    const [loss, setLoss] = useState(null);
    const [isTraining, setIsTraining] = useState(false);
    const [currentEpoch, setCurrentEpoch] = useState(0); // Progress bar state
    const [totalEpochs, setTotalEpochs] = useState(100);
    const [isDataNormalized, setIsDataNormalized] = useState(false);
    const [publishStatus, setPublishStatus] = useState("");

    useEffect(() => {
        localStorage.setItem('trainingExamples', JSON.stringify(examples));
    }, [examples]);

    useEffect(() => {
        localStorage.setItem('trainingClasses', JSON.stringify(classes));
    }, [classes]);

    // Optimizing High Frequency Updates
    const currentHandRef = useRef(null);
    const isTestingRef = useRef(false);
    const modelRef = useRef(null); // Ref to access latest TFJS Model
    const classesRef = useRef(classes);    // Ref to access latest Classes in closures
    const [isHandDetected, setIsHandDetected] = useState(false); // Only update on change
    const [handCount, setHandCount] = useState(0); // Track number of hands for UI
    const requestRef = useRef();

    // Load Handpose Model on Mount
    // Load Handpose Model on Mount
    const initLock = useRef(false);

    useEffect(() => {
        const loadHandpose = async () => {
            if (initLock.current) return;
            initLock.current = true;

            setModelStatus("Loading Handpose...");
            try {
                await tf.setBackend('webgl');
                await tf.ready();
                const model = await handPoseDetection.createDetector(
                    handPoseDetection.SupportedModels.MediaPipeHands,
                    {
                        runtime: 'mediapipe',
                        solutionPath: '/mediapipe',
                        modelType: 'full',
                        maxHands: 2
                    }
                );
                setHandposeModel(model);
                setModelStatus("Handpose Ready");
                console.log("MediaPipe Handpose Loaded");
            } catch (err) {
                console.error("Failed to load handpose", err);
                setModelStatus("Error Loading Model");
                initLock.current = false; // Allow retry on failure if component remounts
            }
        };

        if (!handposeModel) {
            loadHandpose();
        }
    }, []);

    // Sync Model & Classes with Refs
    useEffect(() => {
        modelRef.current = model;
    }, [model]);

    useEffect(() => {
        classesRef.current = classes;
    }, [classes]);

    // Testing Mode State
    const [isTesting, setIsTesting] = useState(false);
    const [testResult, setTestResult] = useState("-");
    const [confidence, setConfidence] = useState(0);
    const [testMatchScore, setTestMatchScore] = useState(-1);

    // Sync isTesting state with ref for the event listener
    useEffect(() => {
        isTestingRef.current = isTesting;
        if (!isTesting) {
            setTestResult("-");
            setConfidence(0);
            setTestMatchScore(-1);
        }
    }, [isTesting]);

    const resetModel = () => {
        setClasses([]);
        setExamples([]);
        setLoss(null);
        setIsTraining(false);
        if (model) {
            model.dispose();
            setModel(null);
        }
        setModelStatus("Model Reset. Add classes to train.");
    };

    const startCamera = async () => {
        try {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                alert("Camera access is not supported in this browser environment. Please use HTTPS or localhost.");
                return;
            }
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.onloadedmetadata = () => {
                    videoRef.current.play().catch(e => console.error("Play failed", e));
                };
                setIsCameraOn(true);
                // Handpose init moved to onLoadedData callback on video tag
            }
        } catch (err) {
            console.error("Error accessing camera:", err);
            alert("Could not access camera. Please allow camera permissions in your browser.");
        }
    };

    const stopCamera = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const tracks = videoRef.current.srcObject.getTracks();
            tracks.forEach(track => track.stop());
            videoRef.current.srcObject = null;
            setIsCameraOn(false);
            currentHandRef.current = null;
            setIsHandDetected(false);
            setIsTesting(false); // Stop testing if camera is off

            if (requestRef.current) {
                cancelAnimationFrame(requestRef.current);
            }
        }
    };

    const detectHands = async () => {
        if (
            typeof videoRef.current !== "undefined" &&
            videoRef.current !== null &&
            videoRef.current.readyState === 4 &&
            handposeModel
        ) {
            const video = videoRef.current;
            const videoWidth = video.videoWidth;
            const videoHeight = video.videoHeight;

            // Set video width
            video.width = videoWidth;
            video.height = videoHeight;

            // Set canvas height and width
            if (canvasRef.current) {
                canvasRef.current.width = videoWidth;
                canvasRef.current.height = videoHeight;
            }

            // Make Detections
            const estimationConfig = { flipHorizontal: false, staticImageMode: false }; // Ensure video mode
            const predictions = await handposeModel.estimateHands(video, estimationConfig);

            // Adapt results to old format (Landmarks Array)
            // New format: { keypoints: [{x,y,name}, ...], keypoints3D: ... }
            // Old format expectation: { landmarks: [[x,y,z], ...] }
            const adaptedPredictions = predictions.map(pred => ({
                ...pred,
                landmarks: pred.keypoints.map(kp => [kp.x, kp.y, 0]) // Map keypoints to [x,y,z]
            }));

            const testingActive = isTestingRef.current;
            currentHandRef.current = adaptedPredictions;

            if (adaptedPredictions.length > 0) {
                setIsHandDetected(prev => !prev ? true : prev);
                setHandCount(adaptedPredictions.length);

                if (testingActive) {
                    classify(adaptedPredictions);
                }

                // Draw
                if (canvasRef.current) {
                    const ctx = canvasRef.current.getContext('2d');
                    ctx.clearRect(0, 0, videoWidth, videoHeight);
                    // Pass adapted predictions to drawHand which expects 'landmarks' property
                    drawHand(adaptedPredictions, ctx);
                }
            } else {
                setIsHandDetected(prev => prev ? false : prev);
                setHandCount(0);
                if (testingActive) {
                    setTestResult("-");
                    setConfidence(0);
                    setTestMatchScore(-1);
                }
                if (canvasRef.current) {
                    const ctx = canvasRef.current.getContext('2d');
                    ctx.clearRect(0, 0, videoWidth, videoHeight);
                }
            }
        }

        if (isCameraOn) {
            requestRef.current = requestAnimationFrame(detectHands);
        }
    };

    useEffect(() => {
        if (isCameraOn && handposeModel) {
            detectHands();
        }
        return () => {
            if (requestRef.current) {
                cancelAnimationFrame(requestRef.current);
            }
        };
    }, [isCameraOn, handposeModel]);

    const addClass = () => {
        if (!newClassName.trim()) return;
        const newClass = {
            id: Date.now(),
            name: newClassName.trim(),
            count: 0
        };
        setClasses([...classes, newClass]);
        setNewClassName("");
    };

    // --- Advanced Skeleton Matching Logic (Cosine Similarity) ---
    const getAlignedLandmarks = (landmarks) => {
        if (!landmarks || landmarks.length === 0) return null;

        // Robustly handle Object {x,y,z} or Array [x,y,z]
        const getX = (p) => typeof p[0] === 'number' ? p[0] : p.x;
        const getY = (p) => typeof p[1] === 'number' ? p[1] : p.y;

        const wrist = landmarks[0];
        const wristX = getX(wrist);
        const wristY = getY(wrist);

        // 1. Center at Wrist
        let centered = landmarks.map(p => ({
            x: getX(p) - wristX,
            y: getY(p) - wristY
        }));

        // 2. Scale Normalization (Distance from Wrist to Middle Finger MCP)
        // We do NOT rotate anymore to preserve orientation features (vertical vs horizontal hand matters)
        const midMCP = centered[9];
        const scaleRef = Math.sqrt(midMCP.x ** 2 + midMCP.y ** 2) || 1;

        return centered.map(p => ({
            x: p.x / scaleRef,
            y: p.y / scaleRef
        }));
    };

    // Calculate Similarity between two vectors
    const cosineSimilarity = (vecA, vecB) => {
        let dotProduct = 0;
        let magA = 0;
        let magB = 0;

        for (let i = 0; i < vecA.length; i++) {
            const a = vecA[i];
            const b = vecB[i];
            dotProduct += (a * b);
            magA += (a * a);
            magB += (b * b);
        }

        magA = Math.sqrt(magA);
        magB = Math.sqrt(magB);

        if (magA === 0 || magB === 0) return 0;
        return dotProduct / (magA * magB);
    };

    // Helper to flip/mirror landmarks over wrist X-coordinate
    const flipHandOverWrist = (landmarks) => {
        if (!landmarks || landmarks.length === 0) return landmarks;
        const getX = (p) => typeof p[0] === 'number' ? p[0] : p.x;
        const wristX = getX(landmarks[0]);
        return landmarks.map(p => {
            if (Array.isArray(p)) {
                return [wristX - (getX(p) - wristX), p[1], p[2]];
            }
            return { ...p, x: wristX - (p.x - wristX) };
        });
    };

    // Helper: Sort and process hands (Top-left to Bottom-right or purely X based)
    // Left-most hand is Slot 0, Right-most is Slot 1
    const processHands = (results) => {
        if (!results || results.length === 0) {
            return {
                landmarks: [null, null],
                input: new Array(84).fill(0)
            };
        }

        const paddedLandmarks = [null, null];
        const flatInput = [];

        // 1-Hand Sign: Normalize to Right hand, pad Left hand with Zeros.
        if (results.length === 1) {
            const hand = results[0];
            const isLeft = hand.handedness === 'Left';
            let rawLandmarks = hand.landmarks;

            if (isLeft) {
                rawLandmarks = flipHandOverWrist(rawLandmarks);
            }

            // Left Hand slot = Zeros
            flatInput.push(...new Array(42).fill(0));
            paddedLandmarks[0] = null;

            // Right Hand slot = Normalized Hand
            const aligned = getAlignedLandmarks(rawLandmarks);
            if (aligned) {
                // Flatten x,y only
                flatInput.push(...aligned.flatMap(p => [p.x, p.y]));
            } else {
                flatInput.push(...new Array(42).fill(0));
            }
            paddedLandmarks[1] = rawLandmarks;

        } else if (results.length === 2) {
            // For 2-handed signs: Handedness determines mapping.
            // Righty (Default): Left to Left, Right to Right.
            // Lefty: Mirror the whole screen, Swap Left and Right arrays.

            // First identify which hand MediaPipe labeled as what.
            let leftHand = results.find(h => h.handedness === 'Left');
            let rightHand = results.find(h => h.handedness === 'Right');

            // Fault Tolerance: What if MediaPipe gets confused and labels them both "Left" or both "Right"?
            // Fallback to sorting by X-coordinate: physically left-most is "Left".
            if (!leftHand || !rightHand || (leftHand === rightHand)) {
                const sorted = [...results].sort((a, b) => {
                    const xA = a.landmarks[0][0] || a.landmarks[0].x;
                    const xB = b.landmarks[0][0] || b.landmarks[0].x;
                    return xA - xB;
                });
                leftHand = sorted[0];
                rightHand = sorted[1];
            }

            // Real fix for tokens: We always store Left Hand going into paddedLandmarks[0] 
            // and Right Hand going into paddedLandmarks[1].
            paddedLandmarks[0] = leftHand.landmarks;
            paddedLandmarks[1] = rightHand.landmarks;

            // Process Left Hand
            const alignedLeft = getAlignedLandmarks(leftHand.landmarks);
            if (alignedLeft) {
                flatInput.push(...alignedLeft.flatMap(p => [p.x, p.y]));
            } else {
                flatInput.push(...new Array(42).fill(0));
            }

            // Process Right Hand
            const alignedRight = getAlignedLandmarks(rightHand.landmarks);
            if (alignedRight) {
                flatInput.push(...alignedRight.flatMap(p => [p.x, p.y]));
            } else {
                flatInput.push(...new Array(42).fill(0));
            }
        } else {
            // > 2 hands detected? Unlikely with maxHands: 2, but just in case, pad with zeros.
            flatInput.push(...new Array(84).fill(0));
        }

        return {
            landmarks: paddedLandmarks,
            input: flatInput
        };
    };

    // Returns Cosine Similarity (-1 to 1) for Multi-Hand
    const calculateSkeletonMatch = (candidateHands, referenceHands) => {
        if (!referenceHands || !Array.isArray(referenceHands)) return -1;

        let totalSim = 0;
        let validChecks = 0;

        for (let i = 0; i < 2; i++) {
            const cand = candidateHands[i]; // Raw landmarks
            const ref = referenceHands[i]; // Aligned reference

            if (ref) {
                if (!cand) return 0; // Reference expects hand, candidate missing -> Mismatch

                const alignedCand = getAlignedLandmarks(cand);

                // Flatten to vectors {x,y} -> [x,y,x,y...]
                const flatCand = alignedCand.flatMap(p => [p.x, p.y]);
                const flatRef = ref.flatMap(p => [p.x, p.y]);

                totalSim += cosineSimilarity(flatCand, flatRef);
                validChecks++;
            } else {
                if (cand) return 0; // Candidate has extra hand? Strict fail.
            }
        }

        if (validChecks === 0) return 0;
        return totalSim / validChecks;
    };

    // Classify function for testing
    // Classify function for testing
    const classify = async (results) => {
        const tfModel = modelRef.current;
        if (!tfModel) return;

        const { landmarks, input } = processHands(results);

        try {
            const inputTensor = tf.tensor2d([input]); // Shape [1, 84] (normalized)
            const prediction = tfModel.predict(inputTensor);
            const probabilities = await prediction.data();

            // Clean up tensor
            inputTensor.dispose();
            prediction.dispose();

            const maxProbCallback = (arr) => {
                let max = -Infinity;
                let index = -1;
                for (let i = 0; i < arr.length; i++) {
                    if (arr[i] > max) {
                        max = arr[i];
                        index = i;
                    }
                }
                return { max, index };
            };

            const { max, index } = maxProbCallback(probabilities);

            // Map index to label
            // We need to know the mapping order.
            // When training, we will sort classes by ID or Name to ensure consistent order.
            // Let's assume consistent sorting by name for now.
            const sortedClasses = [...classesRef.current].sort((a, b) => a.name.localeCompare(b.name));

            if (index >= 0 && index < sortedClasses.length) {
                const predictedLabel = sortedClasses[index].name;
                const confidenceScore = max;

                const matchedClass = sortedClasses.find(c => c.name === predictedLabel);

                let similarityScore = -1;
                if (matchedClass && matchedClass.reference) {
                    similarityScore = calculateSkeletonMatch(landmarks, matchedClass.reference);
                    setTestMatchScore(similarityScore);
                } else {
                    setTestMatchScore(-1);
                }

                const CONFIDENCE_THRESHOLD = 0.6;
                const SIMILARITY_THRESHOLD = 0.85;

                if (confidenceScore > CONFIDENCE_THRESHOLD) {
                    if (similarityScore > SIMILARITY_THRESHOLD) {
                        setTestResult(predictedLabel);
                        setConfidence(confidenceScore);
                    } else {
                        setTestResult("No Match");
                        setConfidence(confidenceScore);
                    }
                } else {
                    setTestResult("Unsure...");
                    setConfidence(confidenceScore);
                    setTestMatchScore(-1);
                }
            }

        } catch (err) {
            console.error("Prediction Error:", err);
        }
    };

    const addExample = (classId, className) => {
        if (!isCameraOn) {
            alert("Please start camera.");
            return;
        }

        const handResults = currentHandRef.current; // Now stores full results array
        if (!handResults || handResults.length === 0) {
            alert("No hand detected!");
            return;
        }

        const { landmarks } = processHands(handResults);

        // Helper to process landmarks into input vector (Normalization)
        const processToInput = (handLandmarksArray) => {
            const flatInput = [];
            for (let i = 0; i < 2; i++) {
                const raw = handLandmarksArray[i];
                if (raw) {
                    const aligned = getAlignedLandmarks(raw);
                    flatInput.push(...aligned.flatMap(p => [p.x, p.y]));
                } else {
                    flatInput.push(...new Array(42).fill(0));
                }
            }
            return flatInput;
        };

        // Augmentation Helpers
        const addNoise = (lm) => lm.map(p => ({ x: p[0] + (Math.random() - 0.5) * 10, y: p[1] + (Math.random() - 0.5) * 10, z: p[2] })); // Jitter +/- 5px

        const scaleHand = (lm, factor) => {
            const wrist = lm[0];
            return lm.map(p => ({
                x: wrist[0] + (p[0] - wrist[0]) * factor,
                y: wrist[1] + (p[1] - wrist[1]) * factor,
                z: p[2]
            }));
        };

        const rotateHand = (lm, angleRad) => {
            const wrist = lm[0];
            const cos = Math.cos(angleRad);
            const sin = Math.sin(angleRad);
            return lm.map(p => {
                const dx = p[0] - wrist[0];
                const dy = p[1] - wrist[1];
                return {
                    x: wrist[0] + dx * cos - dy * sin,
                    y: wrist[1] + dx * sin + dy * cos,
                    z: p[2]
                };
            });
        };

        // Generate Variations
        const variations = [];

        // 1. Original
        variations.push(processToInput(landmarks));

        // 2. Jittered
        const jittered = landmarks.map(l => l ? addNoise(l) : null);
        variations.push(processToInput(jittered));

        // 3. Scaled Up
        const scaledUp = landmarks.map(l => l ? scaleHand(l, 1.05) : null);
        variations.push(processToInput(scaledUp));

        // 4. Scaled Down
        const scaledDown = landmarks.map(l => l ? scaleHand(l, 0.95) : null);
        variations.push(processToInput(scaledDown));

        // 5. Rotated + (Clockwise)
        const rotPos = landmarks.map(l => l ? rotateHand(l, 0.1) : null); // ~6 degrees
        variations.push(processToInput(rotPos));

        // 6. Rotated - (Counter-Clockwise)
        const rotNeg = landmarks.map(l => l ? rotateHand(l, -0.1) : null);
        variations.push(processToInput(rotNeg));


        // Store all variations
        const newExamples = variations.map(input => ({ input, label: className }));
        setExamples(prev => [...prev, ...newExamples]);

        setIsDataNormalized(false);

        setClasses(prevClasses => prevClasses.map(c => {
            if (c.id === classId) {
                // If first time, store reference (from original)
                if (c.count === 0) {
                    const alignedRefs = landmarks.map(l => l ? getAlignedLandmarks(l) : null);
                    return { ...c, count: c.count + variations.length, reference: alignedRefs };
                }
                return { ...c, count: c.count + variations.length };
            }
            return c;
        }));
    };

    const trainModel = async () => {
        if (classes.length < 2) {
            alert("At least 2 classes required.");
            return;
        }
        if (examples.length === 0) {
            alert("No examples captured.");
            return;
        }

        setIsTraining(true);
        setCurrentEpoch(0);
        setModelStatus("Preparing Data...");

        await new Promise(r => setTimeout(r, 100)); // UI Update

        try {
            // 1. Prepare Data
            const inputs = examples.map(e => e.input);
            const labels = examples.map(e => e.label);

            // Sort classes to ensure consistent One-Hot Encodind
            const sortedClassNames = [...classes].sort((a, b) => a.name.localeCompare(b.name)).map(c => c.name);
            const numClasses = sortedClassNames.length;

            // Map string labels to indices
            const labelIndices = labels.map(l => sortedClassNames.indexOf(l));

            // To Tensors
            const xs = tf.tensor2d(inputs); // [NumExamples, 84] (42 * 2 hands)
            const ys = tf.oneHot(tf.tensor1d(labelIndices, 'int32'), numClasses); // [NumExamples, NumClasses]

            // 2. Create Model
            const newModel = tf.sequential();
            newModel.add(tf.layers.dense({
                units: 128, // Increased capacity
                activation: 'relu',
                inputShape: [84] // Updated for 2 hands * 21 points * 2 coords
            }));
            newModel.add(tf.layers.dropout({ rate: 0.2 }));
            newModel.add(tf.layers.dense({
                units: 64, // Increased capacity
                activation: 'relu'
            }));
            newModel.add(tf.layers.dense({
                units: numClasses,
                activation: 'softmax'
            }));

            newModel.compile({
                optimizer: 'adam',
                loss: 'categoricalCrossentropy',
                metrics: ['accuracy']
            });

            // 3. Train
            setModelStatus("Training Started...");

            await newModel.fit(xs, ys, {
                epochs: totalEpochs,
                batchSize: 16,
                shuffle: true,
                callbacks: {
                    onEpochEnd: (epoch, logs) => {
                        setCurrentEpoch(epoch + 1);
                        setLoss(logs.loss);
                        setModelStatus(`Epoch: ${epoch + 1}/${totalEpochs} Loss: ${logs.loss.toFixed(4)}`);
                    }
                }
            });

            // Cleanup Tensors
            xs.dispose();
            ys.dispose();

            setModel(newModel);
            setModelStatus("Training Complete!");

        } catch (err) {
            console.error("Training Error:", err);
            alert("Training Failed: " + err.message);
            setModelStatus("Error Training");
        } finally {
            setIsTraining(false);
        }
    };

    const publishToSkills = async () => {
        if (classes.length === 0) return;

        const userStr = localStorage.getItem('user');
        const user = userStr ? JSON.parse(userStr) : null;

        if (!user || !user.id) {
            alert("You must be logged in to publish a skill.");
            return;
        }

        try {
            setPublishStatus("Publishing...");
            let thumbnail = "";
            if (canvasRef.current && videoRef.current) {
                const canvas = document.createElement('canvas');
                canvas.width = 300;
                canvas.height = 225;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
                thumbnail = canvas.toDataURL('image/jpeg', 0.5);
            }

            const references = classes.filter(c => c.reference).map(c => ({
                name: c.name,
                reference: c.reference
            }));
            const skillName = prompt("Enter a name for your Skill Set (e.g. 'My Custom Signs'):");
            if (!skillName) {
                setPublishStatus("");
                return;
            }

            const userStr = localStorage.getItem('user');
            const user = userStr ? JSON.parse(userStr) : null;
            const userId = user ? user.id : null;

            const response = await fetch(`${baseURL}/skills`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: skillName,
                    references: references,
                    thumbnail: thumbnail,
                    userId: userId // Send User ID for database persistence
                })
            });
            if (response.ok) {
                const data = await response.json();
                setPublishStatus("Published Successfully!");
                alert("Skill Set published to database! You can find it in the 'Personalization' section.");

            } else {
                const data = await response.json();
                setPublishStatus("Failed: " + data.message);
                alert("Failed to publish: " + data.message);
            }
        } catch (err) {
            console.error("Error publishing:", err);
            setPublishStatus("Error publishing");
            alert("Network error while publishing.");
        }
    };

    const saveModel = async () => {
        if (!model) return;
        try {
            await model.save('downloads://hand_gesture_model');
        } catch (err) {
            console.error("Save Error", err);
        }

        // Save references for strict matching
        try {
            const references = classes.filter(c => c.reference).map(c => ({
                name: c.name,
                reference: c.reference
            }));

            if (references.length > 0) {
                const blob = new Blob([JSON.stringify(references)], { type: "application/json" });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = "model_references.json";
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }
        } catch (err) {
            console.error("Error saving references:", err);
        }
    };

    // Cleanup
    useEffect(() => {
        const loadModel = async () => {
            // Initial setup if needed
        };

        return () => {
            stopCamera();
        };
    }, []);

    return (
        <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 w-full min-h-screen relative">
            <div className="max-w-[1600px] mx-auto">
                <div className="md:flex md:items-center md:justify-between mb-8 bg-white/60 backdrop-blur-xl p-6 rounded-3xl border border-white/50 shadow-xl shadow-red-500/5">
                    <div className="min-w-0 flex-1">
                        <h2 className="text-3xl font-bold leading-7 text-slate-800 sm:truncate sm:text-4xl sm:tracking-tight flex items-center gap-3">
                            <div className="w-2 h-10 bg-red-500 rounded-full"></div>
                            Train Custom Gestures
                        </h2>
                        <p className="mt-2 text-lg text-slate-500">
                            Teach the AI to recognize your signs using hand skeleton landmarks.
                        </p>
                    </div>
                    <div className="mt-4 flex flex-wrap md:ml-4 md:mt-0 gap-3">
                        <button
                            onClick={publishToSkills}
                            disabled={isTraining || classes.length < 2}
                            className="inline-flex items-center rounded-xl bg-white px-4 py-3 text-sm font-bold text-slate-700 shadow-sm border border-slate-200 hover:bg-slate-50 hover:text-red-500 hover:border-red-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50 transition-all"
                        >
                            <Upload className="-ml-0.5 mr-2 h-5 w-5" aria-hidden="true" />
                            Publish Skill
                        </button>
                        <button
                            onClick={saveModel}
                            disabled={isTraining}
                            className="inline-flex items-center rounded-xl bg-white px-4 py-3 text-sm font-bold text-slate-700 shadow-sm border border-slate-200 hover:bg-slate-50 hover:text-red-500 hover:border-red-200 disabled:opacity-50 transition-all"
                        >
                            <Download className="-ml-0.5 mr-2 h-5 w-5" aria-hidden="true" />
                            Save Model
                        </button>
                        <button
                            type="button"
                            onClick={trainModel}
                            disabled={isTraining || classes.length < 2}
                            className={`inline-flex items-center rounded-xl px-4 py-3 text-sm font-bold text-white shadow-lg shadow-red-500/30 transition-all ${isTraining ? 'bg-red-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700 hover:shadow-red-500/50 hover:-translate-y-0.5 active:translate-y-0'} disabled:opacity-50`}
                        >
                            <RefreshCw className={`-ml-0.5 mr-2 h-5 w-5 ${isTraining ? 'animate-spin' : ''}`} aria-hidden="true" />
                            {isTraining ? "Training..." : "Train Model"}
                        </button>

                        {/* NEW Test Button */}
                        <button
                            type="button"
                            onClick={() => setIsTesting(!isTesting)}
                            disabled={isTraining || modelStatus !== "Training Complete!" || !isCameraOn}
                            className={`inline-flex items-center rounded-xl px-4 py-3 text-sm font-bold text-white shadow-lg transition-all ${isTesting ? 'bg-orange-500 hover:bg-orange-600 shadow-orange-500/30' : 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/30'} disabled:opacity-50 disabled:bg-slate-400 disabled:shadow-none hover:-translate-y-0.5 active:translate-y-0`}
                        >
                            {isTesting ? "Stop Testing" : "Test Model"}
                        </button>
                    </div>
                </div>


                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                    {/* Camera Section */}
                    <div className="bg-white/40 backdrop-blur-md rounded-[2.5rem] shadow-2xl shadow-red-900/5 overflow-hidden border border-white/50 flex flex-col h-[650px] relative group">
                        <div className="relative flex-1 bg-slate-900 flex items-center justify-center">
                            {!isCameraOn && (
                                <div className="text-center text-slate-500">
                                    <div className="bg-slate-800 p-6 rounded-full inline-block mb-4 shadow-inner">
                                        <CameraOff className="h-12 w-12 opacity-50" />
                                    </div>
                                    <p className="font-medium text-lg">Camera is currently off</p>
                                    <p className="text-sm opacity-60 mt-1">Start camera to begin training</p>
                                </div>
                            )}
                            <div className={`absolute top-6 left-6 z-10 text-white px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider shadow-lg backdrop-blur-md border border-white/10 ${isTesting ? 'bg-orange-500/90' : 'bg-red-500/90'}`}>
                                {isTesting ? "TESTING MODE" : "Data Collection Mode"}
                            </div>
                            <div className="absolute top-6 right-6 z-10 bg-slate-800/80 backdrop-blur-md text-white px-4 py-2 rounded-2xl text-xs font-medium border border-white/10 flex flex-col items-end shadow-xl">
                                <span className="opacity-80 uppercase tracking-widest text-[10px] mb-1">System Status</span>
                                <span className="font-bold text-red-400">{modelStatus}</span>
                                <span className="text-[10px] font-mono mt-2 bg-black/40 px-2 py-1 rounded w-full text-center">
                                    Hands Detected: <span className="text-white font-bold">{handCount}</span>
                                </span>
                            </div>

                            {/* Training Progress Bar */}
                            {isTraining && (
                                <div className="absolute bottom-0 left-0 right-0 z-20 bg-slate-900/90 backdrop-blur p-6 border-t border-white/10">
                                    <div className="flex justify-between text-xs font-bold text-white mb-2 uppercase tracking-wider">
                                        <span>Training Progress</span>
                                        <span className="text-red-400">{Math.round((currentEpoch / totalEpochs) * 100)}%</span>
                                    </div>
                                    <div className="w-full bg-slate-700 rounded-full h-3 overflow-hidden">
                                        <div
                                            className="bg-gradient-to-r from-red-500 to-orange-500 h-3 rounded-full transition-all duration-300 ease-out shadow-[0_0_10px_rgba(239,68,68,0.5)]"
                                            style={{ width: `${(currentEpoch / totalEpochs) * 100}%` }}
                                        ></div>
                                    </div>
                                    <p className="text-center text-xs text-slate-400 mt-3 font-mono">Loss: {loss ? loss.toFixed(4) : "..."}</p>
                                </div>
                            )}

                            {/* Test Result Overlay */}
                            {isTesting && (
                                <div className="absolute bottom-6 left-6 right-6 z-20">
                                    <div className="bg-white/90 backdrop-blur-xl p-4 rounded-2xl shadow-2xl border border-white/50 text-center transform transition-all duration-300">
                                        <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">Prediction Analysis</p>
                                        <h3 className={`text-4xl font-black mb-2 tracking-tight ${testResult === "No Match" ? "text-slate-400" : "text-slate-800"}`}>
                                            {testResult}
                                        </h3>
                                        <div className="flex justify-center gap-4 text-xs font-bold">
                                            <span className="bg-red-50 text-red-600 px-3 py-1 rounded-lg border border-red-100">
                                                Conf: {(confidence * 100).toFixed(1)}%
                                            </span>
                                            {testMatchScore !== -1 && (
                                                <span className={`px-3 py-1 rounded-lg border ${testMatchScore > 0.85 ? 'bg-green-50 text-green-600 border-green-200' : 'bg-orange-50 text-orange-600 border-orange-200'}`}>
                                                    Sim: {(testMatchScore * 100).toFixed(1)}%
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            <video
                                ref={videoRef}
                                className={`absolute inset-0 w-full h-full object-cover pointer-events-none ${!isCameraOn ? 'hidden' : ''}`}
                                autoPlay
                                playsInline
                                muted // Crucial for autoPlay policies
                            />
                            <canvas
                                ref={canvasRef}
                                className="absolute inset-0 w-full h-full object-cover pointer-events-none opacity-80"
                            />

                        </div>

                        {/* Camera Controls Overlay */}
                        <div className="bg-white p-4 flex justify-center gap-4 border-t border-slate-100/50">
                            {!isCameraOn ? (
                                <button
                                    onClick={startCamera}
                                    className="px-8 py-3 bg-slate-900 text-white font-bold rounded-xl shadow-lg hover:bg-slate-800 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2"
                                >
                                    <Camera className="w-5 h-5" />
                                    Start Camera
                                </button>
                            ) : (
                                <button
                                    onClick={stopCamera}
                                    className="px-8 py-3 bg-red-50 text-red-600 font-bold rounded-xl shadow-sm border border-red-100 hover:bg-red-100 hover:text-red-700 active:scale-[0.98] transition-all flex items-center gap-2"
                                >
                                    <CameraOff className="w-5 h-5" />
                                    Stop Camera
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Data & Training Control Section */}
                    <div className="flex flex-col gap-6">

                        {/* Add Class Panel */}
                        <div className="bg-white/60 backdrop-blur-xl p-6 rounded-3xl border border-white/50 shadow-xl shadow-red-500/5">
                            <h3 className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2">
                                <Plus className="w-5 h-5 text-red-500" />
                                Define Gesture Classes
                            </h3>
                            <div className="flex gap-3">
                                <input
                                    type="text"
                                    placeholder="Enter gesture name (e.g. 'Hello')"
                                    value={newClassName}
                                    onChange={(e) => setNewClassName(e.target.value)}
                                    className="flex-1 px-4 py-3 bg-white/50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-red-500/10 focus:border-red-500 outline-none transition-all font-medium text-slate-700 placeholder:text-slate-400"
                                    onKeyDown={(e) => e.key === 'Enter' && addClass()}
                                />
                                <button
                                    onClick={addClass}
                                    disabled={!newClassName.trim()}
                                    className="px-6 py-3 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-900 shadow-lg disabled:opacity-50 disabled:shadow-none transition-all"
                                >
                                    Add
                                </button>
                            </div>
                        </div>

                        {/* Classes List */}
                        <div className="bg-white/60 backdrop-blur-xl p-6 rounded-3xl border border-white/50 shadow-xl shadow-red-500/5 flex-1 overflow-hidden flex flex-col min-h-[400px]">
                            <h3 className="text-lg font-bold text-slate-700 mb-4 flex items-center justify-between">
                                <span className="flex items-center gap-2">
                                    <BarChart2 className="w-5 h-5 text-red-500" />
                                    Training Data
                                </span>
                                <span className="text-xs font-bold bg-red-100 text-red-600 px-2 py-1 rounded-lg">
                                    Total Samples: {examples.length}
                                </span>
                            </h3>

                            {classes.length === 0 ? (
                                <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 border-2 border-dashed border-slate-200 rounded-2xl">
                                    <div className="bg-slate-50 p-4 rounded-full mb-3">
                                        <Plus className="w-8 h-8 opacity-50" />
                                    </div>
                                    <p className="font-medium text-center">No gesture classes yet.</p>
                                    <p className="text-sm opacity-70 text-center mt-1">Add a class above to start collecting data.</p>
                                </div>
                            ) : (
                                <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                                    {classes.map(cls => (
                                        <div key={cls.id} className="bg-white/80 p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between group hover:shadow-md transition-all">
                                            <div>
                                                <h4 className="font-bold text-slate-800 text-lg">{cls.name}</h4>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-xs font-mono bg-slate-100 text-slate-500 px-2 py-0.5 rounded">ID: {cls.id.toString().slice(-4)}</span>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3">
                                                <div className="text-right mr-2">
                                                    <span className="block text-xl font-black text-red-600">{cls.count}</span>
                                                    <span className="text-[10px] uppercase font-bold text-slate-400">Samples</span>
                                                </div>

                                                <button
                                                    onClick={() => addExample(cls.id, cls.name)}
                                                    disabled={!isCameraOn || isTraining || !isHandDetected}
                                                    className="p-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-500 hover:text-white transition-all disabled:opacity-30 disabled:hover:bg-red-50 disabled:hover:text-red-600"
                                                    title="Capture Sample"
                                                >
                                                    <Camera className="w-5 h-5" />
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        if (confirm('Delete this class?')) {
                                                            setClasses(classes.filter(c => c.id !== cls.id));
                                                            setExamples(examples.filter(e => e.label !== cls.name));
                                                        }
                                                    }}
                                                    className="p-3 text-slate-400 hover:bg-red-50 hover:text-red-500 rounded-xl transition-all"
                                                    title="Remove Class"
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {classes.length > 0 && (
                                <div className="mt-4 pt-4 border-t border-slate-200">
                                    <button
                                        onClick={resetModel}
                                        className="w-full py-3 text-sm font-bold text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all flex items-center justify-center gap-2"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                        Reset All Data
                                    </button>
                                </div>
                            )}

                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Training;
