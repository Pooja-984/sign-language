import React, { useRef, useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Camera, CameraOff, Plus, Upload, Trash2, RefreshCw, Shield, LayoutDashboard, Brain, Users, Settings, LogOut, ChevronRight, Search, Bell, Menu, X } from 'lucide-react';
import { drawHand } from "../utils/handPoseDraw";
import { baseURL } from '../Config/config';
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-webgl';
import * as handPoseDetection from '@tensorflow-models/hand-pose-detection';

const AdminTraining = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [user, setUser] = useState({ role: 'admin', name: "Administrator" }); // Consistent user state
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Sidebar Items
    const navItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/admin/dashboard' },
        { icon: Brain, label: 'Model Training', path: '/admin/training' },
        { icon: Users, label: 'Skill Management', path: '/admin/skills' },
    ];

    // Core Refs & State (Mirrored from Training.jsx)
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [isCameraOn, setIsCameraOn] = useState(false);
    const [handposeModel, setHandposeModel] = useState(null);
    const [model, setModel] = useState(null); // TFJS Model
    const [examples, setExamples] = useState(() => {
        const saved = localStorage.getItem('adminTrainingExamples');
        return saved ? JSON.parse(saved) : [];
    });
    const [modelStatus, setModelStatus] = useState("Initializing...");
    const [classes, setClasses] = useState(() => {
        const saved = localStorage.getItem('adminTrainingClasses');
        return saved ? JSON.parse(saved) : [];
    });
    const [newClassName, setNewClassName] = useState("");
    const [loss, setLoss] = useState(null);

    useEffect(() => {
        localStorage.setItem('adminTrainingExamples', JSON.stringify(examples));
    }, [examples]);

    useEffect(() => {
        localStorage.setItem('adminTrainingClasses', JSON.stringify(classes));
    }, [classes]);
    const [isTraining, setIsTraining] = useState(false);
    const [currentEpoch, setCurrentEpoch] = useState(0);
    const [totalEpochs, setTotalEpochs] = useState(150); // 150 Epochs for higher accuracy
    const [isDataNormalized, setIsDataNormalized] = useState(false);
    const [publishStatus, setPublishStatus] = useState("");

    // Optimization Refs
    const currentHandRef = useRef(null);
    const isTestingRef = useRef(false);
    const modelRef = useRef(null);
    const classesRef = useRef(classes);
    const [isHandDetected, setIsHandDetected] = useState(false);
    const [handCount, setHandCount] = useState(0); // Track number of hands
    const requestRef = useRef();



    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        navigate('/login');
    };

    // Load Handpose Model on Mount
    useEffect(() => {
        const loadHandpose = async () => {
            setModelStatus("Loading Handpose...");
            try {
                await tf.setBackend('webgl');
                await tf.ready();
                const model = await handPoseDetection.createDetector(
                    handPoseDetection.SupportedModels.MediaPipeHands,
                    {
                        runtime: 'mediapipe',
                        solutionPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/hands',
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
            }
        };
        loadHandpose();

        // Enforce Admin Access
        const role = localStorage.getItem('role');
        if (role !== 'admin') {
            navigate('/admin/login');
        }

        return () => {
            stopCamera();
        };
    }, [navigate]);

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

    useEffect(() => {
        isTestingRef.current = isTesting;
        if (!isTesting) {
            setTestResult("-");
            setConfidence(0);
            setTestMatchScore(-1);
        }
    }, [isTesting]);

    // --- Core Logic Functions (Mirrored from Training.jsx) ---

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                setIsCameraOn(true);
            }
        } catch (err) {
            console.error("Error accessing camera:", err);
            alert("Could not access camera.");
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
            setIsTesting(false);
            if (requestRef.current) {
                cancelAnimationFrame(requestRef.current);
            }
        }
    };

    // Advanced Skeleton Matching Logic
    const getAlignedLandmarks = (landmarks) => {
        if (!landmarks || landmarks.length === 0) return null;

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
        // No rotation to preserve orientation features
        const midMCP = centered[9];
        const scaleRef = Math.sqrt(midMCP.x ** 2 + midMCP.y ** 2) || 1;

        return centered.map(p => ({
            x: p.x / scaleRef,
            y: p.y / scaleRef
        }));
    };

    const cosineSimilarity = (vecA, vecB) => {
        let dotProduct = 0;
        let magA = 0;
        let magB = 0;
        for (let i = 0; i < vecA.length; i++) {
            dotProduct += (vecA[i] * vecB[i]);
            magA += (vecA[i] * vecA[i]);
            magB += (vecB[i] * vecB[i]);
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
                flatInput.push(...aligned.flatMap(p => [p.x, p.y]));
            } else {
                flatInput.push(...new Array(42).fill(0));
            }
            paddedLandmarks[1] = rawLandmarks;

        } else {
            // Sort by X coordinate of wrist [0]
            const sorted = [...results].sort((a, b) => {
                const xA = a.landmarks[0][0];
                const xB = b.landmarks[0][0];
                return xA - xB;
            });

            for (let i = 0; i < 2; i++) {
                if (sorted[i]) {
                    const rawLandmarks = sorted[i].landmarks;
                    paddedLandmarks[i] = rawLandmarks;

                    const aligned = getAlignedLandmarks(rawLandmarks);
                    if (aligned) {
                        flatInput.push(...aligned.flatMap(p => [p.x, p.y]));
                    } else {
                        flatInput.push(...new Array(42).fill(0));
                    }
                } else {
                    flatInput.push(...new Array(42).fill(0));
                }
            }
        }

        return {
            landmarks: paddedLandmarks,
            input: flatInput
        };
    };

    const calculateSkeletonMatch = (candidateHands, referenceHands) => {
        if (!referenceHands || !Array.isArray(referenceHands)) return -1;
        let totalSim = 0;
        let validChecks = 0;
        for (let i = 0; i < 2; i++) {
            const cand = candidateHands[i];
            const ref = referenceHands[i];
            if (ref) {
                if (!cand) return 0;
                const alignedCand = getAlignedLandmarks(cand);
                const flatCand = alignedCand.flatMap(p => [p.x, p.y]);
                const flatRef = ref.flatMap(p => [p.x, p.y]);
                totalSim += cosineSimilarity(flatCand, flatRef);
                validChecks++;
            } else {
                if (cand) return 0;
            }
        }
        if (validChecks === 0) return 0;
        return totalSim / validChecks;
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
            video.width = videoWidth;
            video.height = videoHeight;
            if (canvasRef.current) {
                canvasRef.current.width = videoWidth;
                canvasRef.current.height = videoHeight;
            }

            const estimationConfig = { flipHorizontal: false, staticImageMode: false };
            const predictions = await handposeModel.estimateHands(video, estimationConfig);

            const adaptedPredictions = predictions.map(pred => ({
                ...pred,
                landmarks: pred.keypoints.map(kp => [kp.x, kp.y, 0])
            }));

            const testingActive = isTestingRef.current;
            currentHandRef.current = adaptedPredictions;

            if (adaptedPredictions.length > 0) {
                setIsHandDetected(prev => !prev ? true : prev);
                setHandCount(adaptedPredictions.length);

                if (testingActive) {
                    classify(adaptedPredictions);
                }

                if (canvasRef.current) {
                    const ctx = canvasRef.current.getContext('2d');
                    ctx.clearRect(0, 0, videoWidth, videoHeight);
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

    const classify = async (results) => {
        const tfModel = modelRef.current;
        if (!tfModel) return;

        const { landmarks, input } = processHands(results);

        try {
            const inputTensor = tf.tensor2d([input]); // Shape [1, 84]
            const prediction = tfModel.predict(inputTensor);
            const probabilities = await prediction.data();

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

                const CONFIDENCE_THRESHOLD = 0.75; // Increased from 0.6 for better precision
                const SIMILARITY_THRESHOLD = 0.92; // Increased from 0.85 for stricter matching

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

    const addExample = (classId, className) => {
        if (!isCameraOn) {
            alert("Please start camera.");
            return;
        }

        const handResults = currentHandRef.current;
        if (!handResults || handResults.length === 0) {
            alert("No hand detected!");
            return;
        }

        const { landmarks } = processHands(handResults);

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
        const addNoise = (lm) => lm.map(p => ({ x: p[0] + (Math.random() - 0.5) * 10, y: p[1] + (Math.random() - 0.5) * 10, z: p[2] }));

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

        const variations = [];
        variations.push(processToInput(landmarks)); // Original
        const jittered = landmarks.map(l => l ? addNoise(l) : null);
        variations.push(processToInput(jittered)); // Noise variation 1
        const scaledUp = landmarks.map(l => l ? scaleHand(l, 1.05) : null);
        variations.push(processToInput(scaledUp)); // Scale up
        const scaledDown = landmarks.map(l => l ? scaleHand(l, 0.95) : null);
        variations.push(processToInput(scaledDown)); // Scale down
        const rotPos = landmarks.map(l => l ? rotateHand(l, 0.1) : null);
        variations.push(processToInput(rotPos)); // Rotate positive
        const rotNeg = landmarks.map(l => l ? rotateHand(l, -0.1) : null);
        variations.push(processToInput(rotNeg)); // Rotate negative
        // Additional variations for better accuracy
        const jittered2 = landmarks.map(l => l ? addNoise(l) : null);
        variations.push(processToInput(jittered2)); // Noise variation 2
        const scaledMid = landmarks.map(l => l ? scaleHand(l, 1.02) : null);
        variations.push(processToInput(scaledMid)); // Subtle scale up

        const newExamples = variations.map(input => ({ input, label: className }));
        setExamples(prev => [...prev, ...newExamples]);

        setIsDataNormalized(false);

        setClasses(prevClasses => prevClasses.map(c => {
            if (c.id === classId) {
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
        await new Promise(r => setTimeout(r, 100));

        try {
            const inputs = examples.map(e => e.input);
            const labels = examples.map(e => e.label);
            const sortedClassNames = [...classes].sort((a, b) => a.name.localeCompare(b.name)).map(c => c.name);
            const numClasses = sortedClassNames.length;
            const labelIndices = labels.map(l => sortedClassNames.indexOf(l));

            const xs = tf.tensor2d(inputs);
            const ys = tf.oneHot(tf.tensor1d(labelIndices, 'int32'), numClasses);

            const newModel = tf.sequential();
            newModel.add(tf.layers.dense({ units: 128, activation: 'relu', inputShape: [84] }));
            newModel.add(tf.layers.dropout({ rate: 0.2 }));
            newModel.add(tf.layers.dense({ units: 64, activation: 'relu' }));
            newModel.add(tf.layers.dense({ units: numClasses, activation: 'softmax' }));

            newModel.compile({ optimizer: 'adam', loss: 'categoricalCrossentropy', metrics: ['accuracy'] });

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
            const skillName = prompt("Enter a name for this Skill Set (e.g. 'Advanced Two-Hands'):");
            if (!skillName) {
                setPublishStatus("");
                return;
            }
            const response = await fetch(`${baseURL}/skills`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: skillName,
                    references: references,
                    thumbnail: thumbnail
                })
            });
            if (response.ok) {
                setPublishStatus("Published Successfully!");
                alert("Skill Set published to Test Skills!");
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

    return (
        <div className="flex h-screen overflow-hidden font-sans bg-slate-50 relative">

            {/* Mobile Sidebar Overlay */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/50 z-40 md:hidden backdrop-blur-sm transition-opacity"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* Sidebar - Enhanced Glassmorphism */}
            <aside className={`fixed md:relative inset-y-0 left-0 z-50 w-72 bg-white/90 md:bg-white/70 backdrop-blur-2xl border-r border-white/50 flex flex-col shadow-[0_8px_30px_rgb(0,0,0,0.04)] m-4 rounded-3xl h-[calc(100vh-2rem)] transform transition-transform duration-300 ease-in-out md:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-[120%]'}`}>
                <div className="p-8 border-b border-white/20 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-red-600 rounded-xl flex items-center justify-center shadow-lg shadow-red-600/20">
                            <Shield className="text-white h-6 w-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold tracking-tight text-slate-800">SignTrans</h2>
                            <span className="text-xs text-red-500 uppercase tracking-widest font-bold">Admin Panel</span>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="p-2 text-slate-400 hover:text-red-500 md:hidden"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <nav className="flex-1 px-4 py-8 space-y-2 overflow-y-auto custom-scrollbar">
                    {navItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.label}
                                to={item.path}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className={`flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-300 group !no-underline ${isActive
                                    ? 'bg-red-50 text-red-700 shadow-sm ring-1 ring-red-100'
                                    : 'text-slate-500 hover:bg-white/50 hover:text-red-600'
                                    }`}
                            >
                                <item.icon className={`h-5 w-5 shrink-0 ${isActive ? 'text-red-600' : 'text-slate-400 group-hover:text-red-500'}`} />
                                <span className="font-bold text-sm whitespace-nowrap">{item.label}</span>
                                {isActive && <ChevronRight className="ml-auto h-4 w-4 text-red-400 shrink-0" />}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-white/20">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 text-slate-500 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all duration-200 group font-bold"
                    >
                        <LogOut size={20} className="group-hover:stroke-red-600" />
                        <span className="text-sm">Sign Out</span>
                    </button>
                    <div className="mt-4 text-center">
                        <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">v1.2.0-beta</p>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col relative overflow-hidden bg-transparent z-10">
                {/* Header - Enhanced Glassmorphism */}
                <header className="h-20 md:h-24 bg-transparent flex items-center justify-between px-4 md:px-8 z-10 sticky top-0">
                    <div className="flex-1 bg-white/70 backdrop-blur-2xl border border-white/50 rounded-2xl p-3 md:p-4 shadow-sm flex items-center justify-between mx-2 md:mx-4 mt-2 md:mt-4">
                        <div className="flex items-center gap-4 flex-1">
                            <button
                                onClick={() => setIsMobileMenuOpen(true)}
                                className="p-2 -ml-2 text-slate-500 hover:text-red-600 md:hidden"
                            >
                                <Menu className="h-6 w-6" />
                            </button>
                            <div className="relative w-full max-w-md hidden md:block">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Search models, skills, or logs..."
                                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200/50 focus:border-red-400 focus:ring-4 focus:ring-red-500/10 text-sm outline-none transition-all bg-white/50 focus:bg-white"
                                />
                            </div>
                        </div>
                        <div className="flex items-center gap-6">
                            <button className="relative text-slate-400 hover:text-red-500 transition-colors p-2 hover:bg-red-50 rounded-full">
                                <Bell className="h-5 w-5" />
                                <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-red-500 rounded-full ring-2 ring-white"></span>
                            </button>
                            <div className="h-8 w-[1px] bg-slate-200/50"></div>
                            <div className="flex items-center gap-3">
                                <div className="text-right hidden sm:block">
                                    <p className="text-sm font-bold text-slate-800">{user?.name || "Admin"}</p>
                                    <p className="text-xs text-red-500 font-bold uppercase tracking-wider">Super Admin</p>
                                </div>
                                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-red-100 to-orange-100 text-red-700 border border-red-200 flex items-center justify-center font-bold shadow-sm cursor-pointer hover:ring-4 hover:ring-red-50 transition-all">
                                    {user?.name?.[0] || "A"}
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
                    <div className="max-w-screen-2xl mx-auto h-full flex flex-col space-y-6 md:space-y-8 pb-12">

                        {/* Header Section - Red Gradient */}
                        <div className="relative overflow-hidden bg-gradient-to-br from-red-600 via-red-500 to-orange-500 rounded-[2rem] p-6 md:p-8 shadow-xl shadow-red-500/20 text-white shrink-0 border border-white/20 group">
                            <div className="absolute top-0 right-0 -mt-10 -mr-10 opacity-10 rotate-12 transition-transform duration-700 group-hover:rotate-45 group-hover:scale-110">
                                <Brain size={250} />
                            </div>
                            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                                <div>
                                    <h2 className="text-2xl md:text-3xl font-black mb-2 tracking-tight">Train New Model</h2>
                                    <p className="text-red-50 max-w-xl text-base md:text-lg font-medium opacity-90">
                                        Capture gestures with 6x Data Augmentation, train the neural network, and publish for verification.
                                    </p>
                                </div>
                                <div className="flex flex-wrap gap-3">
                                    <button
                                        onClick={publishToSkills}
                                        disabled={isTraining || classes.length === 0}
                                        className="w-full sm:w-auto bg-white/10 backdrop-blur-md border border-white/30 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-white/20 hover:border-white/50 transition-all shadow-lg hover:shadow-white/10 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group"
                                    >
                                        <Upload className="h-4 w-4 group-hover:-translate-y-0.5 transition-transform" />
                                        Publish to Skills
                                    </button>
                                    <button
                                        onClick={trainModel}
                                        disabled={isTraining || classes.length < 2}
                                        className={`w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-sm text-red-600 shadow-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed group ${isTraining ? 'bg-white/80' : 'bg-white hover:bg-slate-50 hover:scale-105 hover:shadow-2xl'}`}
                                    >
                                        <RefreshCw className={`h-4 w-4 ${isTraining ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
                                        {isTraining ? "Training..." : "Train Model"}
                                    </button>
                                    <button
                                        onClick={() => setIsTesting(!isTesting)}
                                        disabled={isTraining || modelStatus !== "Training Complete!" || !isCameraOn}
                                        className={`w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-sm shadow-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed group ${isTesting ? 'bg-slate-900/40 text-white hover:bg-slate-900/60 backdrop-blur-md' : 'bg-emerald-500 text-white hover:bg-emerald-400 hover:shadow-emerald-500/30 ring-1 ring-white/20 hover:-translate-y-0.5'}`}
                                    >
                                        {isTesting ? "Stop Testing" : "Test Model"}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 lg:h-full min-h-[600px]">
                            {/* Camera Area */}
                            <div className="lg:col-span-2 bg-white/70 backdrop-blur-2xl rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/50 flex flex-col relative overflow-hidden min-h-[400px]">
                                <div className="relative flex-1 bg-slate-900 flex items-center justify-center overflow-hidden rounded-t-[2rem]">
                                    {!isCameraOn && (
                                        <div className="text-center text-slate-500">
                                            <CameraOff className="h-16 w-16 mx-auto mb-4 opacity-30" />
                                            <p className="font-medium">Camera is currently off</p>
                                        </div>
                                    )}
                                    <div className="absolute top-4 left-4 z-10 bg-red-600/90 backdrop-blur-sm text-white px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider shadow-lg">
                                        {isTesting ? "Testing Mode" : "Recording Mode"}
                                    </div>
                                    <div className="absolute top-4 right-4 z-10 bg-black/60 backdrop-blur-sm text-white px-4 py-1.5 rounded-full text-xs font-mono shadow-lg border border-white/10 flex flex-col items-end">
                                        <span>{modelStatus}</span>
                                        <span className="text-xs text-green-400 mt-0.5">Hands: {handCount}</span>
                                    </div>

                                    <video
                                        ref={videoRef}
                                        autoPlay
                                        muted
                                        playsInline
                                        onLoadedData={() => {
                                            if (videoRef.current && isCameraOn && !handposeModel) {
                                                // Model loaded in useEffect 
                                            }
                                        }}
                                        className={`w-full h-full object-cover ${!isCameraOn ? 'hidden' : 'block'}`}
                                    />
                                    <canvas
                                        ref={canvasRef}
                                        className={`absolute top-0 left-0 w-full h-full object-cover z-20 pointer-events-none ${!isCameraOn ? 'hidden' : 'block'}`}
                                    />

                                    {/* Training Overlay */}
                                    {isTraining && (
                                        <div className="absolute inset-x-0 bottom-0 bg-black/70 p-6 transition-all z-30 backdrop-blur-md">
                                            <div className="w-full bg-slate-700 rounded-full h-2 mb-3">
                                                <div className="bg-orange-500 h-2 rounded-full transition-all duration-300 shadow-[0_0_10px_rgba(249,115,22,0.5)]" style={{ width: `${(currentEpoch / totalEpochs) * 100}%` }}></div>
                                            </div>
                                            <div className="flex justify-between text-xs text-slate-300 font-mono uppercase tracking-wider">
                                                <span>Epoch {currentEpoch}/{totalEpochs}</span>
                                                <span className="text-orange-300">Loss: {typeof loss === 'number' ? loss.toFixed(4) : loss || '...'}</span>
                                            </div>
                                        </div>
                                    )}

                                    {/* Testing Result Overlay */}
                                    {isTesting && (
                                        <div className="absolute bottom-10 left-0 right-0 z-30 flex justify-center pointer-events-none">
                                            <div className="bg-white/95 backdrop-blur-xl px-10 py-6 rounded-3xl shadow-2xl text-center transform transition-all scale-110 border border-white/20">
                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Detected Sign</p>
                                                <p className={`text-6xl font-black mb-2 ${testResult === "No Match" ? "text-slate-300" : "text-red-600"}`}>{testResult}</p>
                                                <p className="text-xs text-slate-400 font-mono bg-slate-100 px-3 py-1 rounded-full inline-block">{(confidence * 100).toFixed(1)}% Confidence</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className="p-4 md:p-6 bg-white/70 backdrop-blur-xl border-t border-slate-100 flex justify-center shrink-0">
                                    {!isCameraOn ? (
                                        <button
                                            onClick={startCamera}
                                            disabled={modelStatus !== "Handpose Ready"}
                                            className="w-full inline-flex justify-center items-center gap-2 rounded-xl bg-red-600 px-6 py-3 md:py-4 text-sm font-bold text-white shadow-lg shadow-red-600/20 hover:bg-red-500 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <Camera className="h-5 w-5" /> {modelStatus === "Handpose Ready" ? "Activate Camera" : "Loading Model..."}
                                        </button>
                                    ) : (
                                        <button onClick={stopCamera} className="w-full inline-flex justify-center items-center gap-2 rounded-xl bg-red-50 text-red-600 border border-red-100 px-6 py-3 md:py-4 text-sm font-bold shadow-sm hover:bg-red-100 transition-all">
                                            <CameraOff className="h-5 w-5" /> Deactivate Camera
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Controls Area */}
                            <div className="flex flex-col gap-6 lg:h-[700px] pb-8 md:pb-0">
                                <div className={`bg-white/70 backdrop-blur-xl rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 border border-white/50 relative shrink-0 ${isTesting ? 'opacity-50 pointer-events-none select-none grayscale' : ''}`}>
                                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                                        <Plus className="h-4 w-4 text-red-600" /> New Skill Class
                                    </h3>
                                    <div className="space-y-3">
                                        <input
                                            type="text"
                                            value={newClassName}
                                            onChange={(e) => setNewClassName(e.target.value)}
                                            placeholder="E.g., 'Thumbs Up'"
                                            className="block w-full rounded-xl border-slate-200 px-4 py-3 text-slate-900 shadow-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-sm bg-white/50 focus:bg-white transition-colors"
                                        />
                                        <button
                                            onClick={addClass}
                                            className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-bold text-white shadow-lg hover:bg-slate-800 hover:-translate-y-0.5 transition-all flex justify-center items-center gap-2"
                                        >
                                            <Plus className="h-4 w-4" /> Add Class
                                        </button>
                                    </div>
                                </div>

                                <div className={`flex-1 bg-white/70 backdrop-blur-xl rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/50 overflow-hidden flex flex-col ${isTesting ? 'opacity-50 pointer-events-none select-none grayscale' : ''}`}>
                                    <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                                        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Active Classes</h3>
                                        <span className="bg-white border border-slate-200 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-md">{classes.length}</span>
                                    </div>
                                    <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                                        {classes.length === 0 && (
                                            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
                                                <Brain className="h-10 w-10 mb-2 opacity-20" />
                                                <p className="text-sm font-medium">No classes added yet.</p>
                                                <p className="text-xs opacity-50 mt-1">Add a class above to start training.</p>
                                            </div>
                                        )}
                                        {classes.map((cls) => (
                                            <div key={cls.id} className="group bg-white/50 hover:bg-white rounded-xl border border-slate-200 hover:border-red-200 hover:shadow-md p-3 transition-all">
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="font-bold text-slate-800 text-sm">{cls.name}</span>
                                                    <button
                                                        onClick={() => {
                                                            if (confirm('Delete this class?')) {
                                                                setClasses(classes.filter(c => c.id !== cls.id));
                                                                setExamples(examples.filter(e => e.label !== cls.name));
                                                            }
                                                        }}
                                                        className="text-slate-400 hover:text-red-500 transition-colors p-1"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs font-mono text-slate-500 bg-white px-2 py-1 rounded border border-slate-200">{cls.count} samples</span>
                                                    <button
                                                        onClick={() => addExample(cls.id, cls.name)}
                                                        disabled={!isCameraOn}
                                                        className="bg-white border border-slate-200 hover:border-red-300 hover:text-red-600 text-slate-600 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 shadow-sm disabled:opacity-50"
                                                    >
                                                        <Camera size={12} /> Capture (8x)
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default AdminTraining;
