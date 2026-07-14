import React, { useRef, useEffect, useState } from 'react';
import { Camera, CameraOff, RefreshCw, ChevronLeft, Check, X, Shield, Brain, Trash2, Zap } from 'lucide-react';
import { drawHand } from "../utils/handPoseDraw";
import { baseURL } from '../Config/config';
import { calculateSkeletonMatch } from '../utils/skeletonMatching';
import { Link } from 'react-router-dom';
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-webgl';
import * as handPoseDetection from '@tensorflow-models/hand-pose-detection';

const TestSkills = () => {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [isCameraOn, setIsCameraOn] = useState(false);
    const [handposeModel, setHandposeModel] = useState(null);
    const [modelStatus, setModelStatus] = useState("Initializing...");
    const [handCount, setHandCount] = useState(0);

    // Skills Data
    const [skills, setSkills] = useState([]);
    const [selectedSkill, setSelectedSkill] = useState(null);
    const [activeTab, setActiveTab] = useState('available'); // 'available' | 'personal'
    const [currentUser, setCurrentUser] = useState(null);

    // We use a Ref for the detection loop to avoid stale closures
    const activeRefsRef = useRef([]); // Array of { name, reference: Array[2] }

    // Detection State
    const [bestMatch, setBestMatch] = useState(null);
    const requestRef = useRef();

    useEffect(() => {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            try {
                setCurrentUser(JSON.parse(userStr));
            } catch (e) {
                console.error("Failed to parse user", e);
            }
        }
        fetchSkills();
        loadHandpose();
    }, []);

    const fetchSkills = async () => {
        try {
            const res = await fetch(`${baseURL}/skills`);
            const data = await res.json();
            // console.log("Fetched Skills:", data);
            setSkills(data);
        } catch (err) {
            console.error("Error fetching skills:", err);
            setModelStatus("Error loading skills");
            alert("Failed to load skills. Check backend connection.");
        }
    };

    const deleteSkill = async (e, skillId) => {
        e.stopPropagation(); // Prevent loading the skill when clicking delete
        if (!window.confirm("Are you sure you want to delete this skill? This action cannot be undone.")) return;

        try {
            const res = await fetch(`${baseURL}/skills/${skillId}`, {
                method: 'DELETE',
            });
            if (res.ok) {
                // Remove from state
                setSkills(skills.filter(s => s._id !== skillId));
                // If deleted skill was selected, clear selection
                if (selectedSkill && selectedSkill._id === skillId) {
                    setSelectedSkill(null);
                    setBestMatch(null);
                }
            } else {
                alert("Failed to delete skill.");
            }
        } catch (err) {
            console.error("Error deleting skill:", err);
            alert("Error deleting skill.");
        }
    };

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
                    modelType: 'full', // 'lite' is faster, 'full' is more accurate
                    maxHands: 2
                }
            );
            setHandposeModel(model);
            setModelStatus("Ready to Test");
            console.log("MediaPipe Handpose Loaded");
        } catch (err) {
            console.error("Failed to load handpose", err);
            setModelStatus("Error Loading Model");
        }
    };

    const loadSkill = (skill) => {
        setSelectedSkill(skill);
        // Ensure references are in the expected format
        activeRefsRef.current = skill.references;
        setBestMatch(null);
    };

    const loadAllSkills = () => {
        setSelectedSkill({ _id: 'ALL', name: 'All Skills' });
        // Flatten all references from all skills
        const allRefs = skills.flatMap(s => s.references);
        activeRefsRef.current = allRefs;
        setBestMatch(null);
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
            setBestMatch(null);
            setHandCount(0);
            if (requestRef.current) {
                cancelAnimationFrame(requestRef.current);
            }
        }
    };

    // Helper to flip/mirror landmarks over wrist X-coordinate
    const flipHandOverWrist = (landmarks) => {
        if (!landmarks || landmarks.length === 0) return landmarks;
        const wristX = landmarks[0].x;
        return landmarks.map(p => ({ ...p, x: wristX - (p.x - wristX) }));
    };

    // Helper: Sort and process hands
    const processHands = (results) => {
        if (!results || results.length === 0) {
            return [null, null];
        }

        const paddedLandmarks = [null, null];

        // 1-Hand Sign: Normalize to Right hand, pad Left hand with Zeros
        if (results.length === 1) {
            const hand = results[0];
            const isLeft = hand.handedness === 'Left';
            let keypoints = hand.keypoints;

            if (isLeft) {
                keypoints = flipHandOverWrist(keypoints);
            }

            paddedLandmarks[0] = null; // Left hand padded
            paddedLandmarks[1] = keypoints; // Right hand normalized

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
                    const xA = a.keypoints[0].x;
                    const xB = b.keypoints[0].x;
                    return xA - xB;
                });
                leftHand = sorted[0];
                rightHand = sorted[1];
            }

            // Real fix for tokens: We always store Left Hand going into paddedLandmarks[0] 
            // and Right Hand going into paddedLandmarks[1].
            paddedLandmarks[0] = leftHand.keypoints;
            paddedLandmarks[1] = rightHand.keypoints;

        } else {
            // > 2 hands detected? Unlikely, but fallback to nulls.
            paddedLandmarks[0] = null;
            paddedLandmarks[1] = null;
        }
        return paddedLandmarks;
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

            // Adapt for drawing util (expects "landmarks" prop)
            const adaptedPredictions = predictions.map(pred => ({
                ...pred,
                landmarks: pred.keypoints.map(kp => [kp.x, kp.y, 0])
            }));

            if (canvasRef.current) {
                const ctx = canvasRef.current.getContext('2d');
                ctx.clearRect(0, 0, videoWidth, videoHeight);
                drawHand(adaptedPredictions, ctx);
            }

            if (predictions.length > 0) {
                setHandCount(predictions.length);
                const currentMeta = processHands(predictions); // returns Array[2] of keypoints

                // Match Logic
                const currentRefs = activeRefsRef.current;
                if (currentRefs.length > 0) {
                    let bestScore = -1;
                    let bestLabel = null;

                    currentRefs.forEach(ref => {
                        // ref.reference should be Array[2] aligned landmarks
                        const score = calculateSkeletonMatch(currentMeta, ref.reference);
                        if (score > bestScore) {
                            bestScore = score;
                            bestLabel = ref.name;
                        }
                    });

                    if (bestScore > 0.92) { // Slightly lower threshold for verification usability
                        setBestMatch({ label: bestLabel, score: bestScore });
                    } else {
                        setBestMatch(null);
                    }
                }

            } else {
                setHandCount(0);
                setBestMatch(null);
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


    // Helper for Ownership check
    const isOwner = (skill, user) => {
        if (!user || !user.id || !skill.createdBy) return false;
        return String(skill.createdBy).trim() === String(user.id).trim();
    };


    return (
        <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 w-full min-h-screen relative">
            <div className="max-w-[1600px] mx-auto h-[85vh] flex flex-col">
                <div className="md:flex md:items-center md:justify-between mb-6 bg-white/60 backdrop-blur-xl p-6 rounded-3xl border border-white/50 shadow-xl shadow-red-500/5 flex-none">
                    <div className="min-w-0 flex-1">
                        <h2 className="text-3xl font-bold leading-7 text-slate-800 sm:truncate sm:text-4xl sm:tracking-tight flex items-center gap-3">
                            <div className="w-2 h-10 bg-red-500 rounded-full"></div>
                            Skill Verification Lab
                        </h2>
                        <p className="mt-2 text-lg text-slate-500">
                            Test your mastery of sign language with real-time AI verification.
                        </p>
                    </div>
                    <div className="mt-4 flex md:ml-4 md:mt-0 gap-3">
                        {!isCameraOn ? (
                            <button
                                onClick={startCamera}
                                disabled={modelStatus !== "Ready to Test"}
                                className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-slate-800 transition shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-2 disabled:opacity-50"
                            >
                                <Camera className="h-5 w-5" />
                                {modelStatus === "Ready to Test" ? "Activate Camera" : "Loading Model..."}
                            </button>
                        ) : (
                            <button
                                onClick={stopCamera}
                                className="bg-red-50 text-red-600 px-6 py-3 rounded-xl font-bold hover:bg-red-100 hover:text-red-700 transition shadow-sm border border-red-100 flex items-center gap-2"
                            >
                                <CameraOff className="h-5 w-5" /> Stop Camera
                            </button>
                        )}
                    </div>
                </div>

                <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-6">
                    {/* Sidebar List */}
                    <div className="bg-white/60 backdrop-blur-xl rounded-[2.5rem] shadow-xl border border-white/50 flex flex-col h-full overflow-hidden relative">

                        {/* Tabs Header */}
                        <div className="flex border-b border-slate-200/50 p-2 gap-2">
                            <button
                                onClick={() => setActiveTab('available')}
                                className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${activeTab === 'available' ? 'bg-red-100 text-red-700 shadow-sm' : 'text-slate-500 hover:bg-white/50'}`}
                            >
                                <RefreshCw className="h-4 w-4" />
                                Available
                            </button>
                            <button
                                onClick={() => setActiveTab('personal')}
                                className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${activeTab === 'personal' ? 'bg-red-100 text-red-700 shadow-sm' : 'text-slate-500 hover:bg-white/50'}`}
                            >
                                <Brain className="h-4 w-4" />
                                Personal
                            </button>
                        </div>

                        {/* Content Area */}
                        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-3">

                            {/* Personalization Tab Content */}
                            {activeTab === 'personal' && (
                                <div className="space-y-4 animate-in fade-in slide-in-from-left-4 duration-300">

                                    {skills.filter(s => {
                                        const userStr = localStorage.getItem('user');
                                        const user = userStr ? JSON.parse(userStr) : null;
                                        return isOwner(s, user);
                                    }).length === 0 ? (
                                        <div className="text-center p-8 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                                            <div className="bg-white p-4 rounded-full shadow-sm w-16 h-16 flex items-center justify-center mx-auto mb-4">
                                                <Brain className="h-8 w-8 text-slate-300" />
                                            </div>
                                            <p className="text-base font-bold text-slate-900">No Custom Skills Yet</p>
                                            <p className="text-sm text-slate-500 mt-2 mb-4 leading-relaxed">Train your own custom gestures to personalize your experience.</p>
                                            <Link to="/training" className="inline-flex items-center text-sm font-bold text-white bg-red-600 px-6 py-2.5 rounded-xl hover:bg-red-700 shadow-lg shadow-red-500/20 transition hover:-translate-y-0.5">
                                                Train Model
                                            </Link>
                                        </div>
                                    ) : (
                                        skills.filter(s => {
                                            const userStr = localStorage.getItem('user');
                                            const user = userStr ? JSON.parse(userStr) : null;
                                            return isOwner(s, user);
                                        }).map(skill => (
                                            <button
                                                key={skill._id}
                                                onClick={() => loadSkill(skill)}
                                                className={`w-full text-left p-4 rounded-2xl transition-all border group relative overflow-hidden ${selectedSkill?._id === skill._id
                                                    ? 'bg-red-600 text-white border-red-600 shadow-lg shadow-red-500/30'
                                                    : 'bg-white/80 border-slate-100 hover:border-red-200 hover:shadow-md'}`}
                                            >
                                                <div className="flex items-center justify-between z-10 relative">
                                                    <div>
                                                        <h4 className={`font-bold text-base ${selectedSkill?._id === skill._id ? 'text-white' : 'text-slate-800'}`}>{skill.name}</h4>
                                                        <p className={`text-xs mt-1 font-medium ${selectedSkill?._id === skill._id ? 'text-red-100' : 'text-slate-400'}`}>{skill.references.length} gestures trained</p>
                                                    </div>
                                                    {selectedSkill?._id === skill._id && <div className="bg-white/20 p-1.5 rounded-full"><Check className="h-4 w-4 text-white" /></div>}
                                                </div>

                                                {/* Delete Button */}
                                                <div className={`absolute right-12 top-1/2 -translate-y-1/2 z-20 ${selectedSkill?._id === skill._id ? 'text-white/80 hover:text-white' : 'text-slate-300 hover:text-red-500'}`}>
                                                    <div
                                                        onClick={(e) => deleteSkill(e, skill._id)}
                                                        className={`p-2 rounded-full hover:bg-white/20 transition cursor-pointer`}
                                                        title="Delete Skill"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </div>
                                                </div>
                                            </button>
                                        ))
                                    )}
                                </div>
                            )}

                            {/* Available Skills Tab Content */}
                            {activeTab === 'available' && (
                                <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                    <div className="flex items-center justify-between mb-2 px-2">
                                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">System Skills</h3>
                                        <button onClick={fetchSkills} className="text-xs font-bold text-red-600 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded-lg transition-colors flex items-center gap-1">
                                            <RefreshCw className="h-3 w-3" /> Refresh
                                        </button>
                                    </div>

                                    <button
                                        onClick={() => loadAllSkills()}
                                        className={`w-full text-left p-4 rounded-2xl transition-all border mb-4 relative overflow-hidden ${selectedSkill?._id === 'ALL'
                                            ? 'bg-red-500 text-white border-red-500 shadow-lg shadow-red-500/30'
                                            : 'bg-white/80 border-slate-100 hover:border-red-200 hover:shadow-md'}`}
                                    >
                                        <div className="relative z-10 flex items-center gap-3">
                                            <div className={`p-2 rounded-xl ${selectedSkill?._id === 'ALL' ? 'bg-white/20' : 'bg-red-50'}`}>
                                                <Zap className={`h-5 w-5 ${selectedSkill?._id === 'ALL' ? 'text-white' : 'text-red-500'}`} />
                                            </div>
                                            <div>
                                                <h4 className={`font-bold text-base ${selectedSkill?._id === 'ALL' ? 'text-white' : 'text-slate-800'}`}>Test All Skills</h4>
                                                <p className={`text-xs mt-1 font-medium ${selectedSkill?._id === 'ALL' ? 'text-red-100' : 'text-slate-400'}`}>
                                                    Combined test against {skills.reduce((acc, s) => acc + s.references.length, 0)} gestures
                                                </p>
                                            </div>
                                        </div>
                                    </button>

                                    {skills
                                        .filter(s => {
                                            if (!currentUser) return true;
                                            return !isOwner(s, currentUser);
                                        })
                                        .map(skill => (
                                            <button
                                                key={skill._id}
                                                onClick={() => loadSkill(skill)}
                                                className={`w-full text-left p-4 rounded-2xl transition-all border group relative overflow-hidden ${selectedSkill?._id === skill._id
                                                    ? 'bg-red-500 text-white border-red-500 shadow-lg shadow-red-500/30'
                                                    : 'bg-white/80 border-slate-100 hover:border-red-200 hover:shadow-md'}`}
                                            >
                                                <div className="flex items-center justify-between relative z-10">
                                                    <div>
                                                        <h4 className={`font-bold text-base ${selectedSkill?._id === skill._id ? 'text-white' : 'text-slate-800'}`}>{skill.name}</h4>
                                                        <p className={`text-xs mt-1 font-medium ${selectedSkill?._id === skill._id ? 'text-red-100' : 'text-slate-400'}`}>{skill.references.length} gestures</p>
                                                    </div>
                                                    {selectedSkill?._id === skill._id && <div className="bg-white/20 p-1.5 rounded-full"><Check className="h-4 w-4 text-white" /></div>}
                                                </div>
                                            </button>
                                        ))}
                                </div>
                            )}

                        </div>
                    </div>

                    {/* Camera Area */}
                    <div className="lg:col-span-1 bg-white/40 backdrop-blur-md rounded-[2.5rem] shadow-2xl shadow-red-900/5 overflow-hidden border border-white/50 flex flex-col relative group h-full">
                        <div className="relative flex-1 bg-slate-900 flex items-center justify-center">
                            {!isCameraOn && (
                                <div className="text-center text-slate-500 z-10">
                                    <div className="bg-slate-800 p-6 rounded-full inline-block mb-4 shadow-inner">
                                        <CameraOff className="h-12 w-12 opacity-50" />
                                    </div>
                                    <p className="font-medium text-lg">Camera is currently off</p>
                                    <p className="text-sm opacity-60 mt-1">Activate camera to verify skills</p>
                                </div>
                            )}

                            {/* Status Badges */}
                            <div className="absolute top-6 left-6 z-20 flex gap-2">
                                <div className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider shadow-lg backdrop-blur-md border border-white/10 ${isCameraOn ? 'bg-green-500/90 text-white' : 'bg-slate-700/80 text-slate-300'}`}>
                                    {isCameraOn ? "Tracking Active" : "Standby"}
                                </div>
                            </div>

                            <div className="absolute top-6 right-6 z-20 bg-slate-800/80 backdrop-blur-md text-white px-4 py-2 rounded-2xl text-xs font-medium border border-white/10 flex flex-col items-end shadow-xl">
                                <span className="opacity-80 uppercase tracking-widest text-[10px] mb-1">Hands Detected</span>
                                <span className="font-bold text-red-400 text-xl">{handCount}</span>
                            </div>

                            {/* Prompts and Overlays */}
                            {!selectedSkill && isCameraOn && (
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 text-center w-full px-6 pointer-events-none">
                                    <p className="text-white font-bold text-lg bg-black/40 px-6 py-4 rounded-2xl backdrop-blur-xl border border-white/10 animate-pulse">
                                        Please select a Skill Set from the sidebar to begin.
                                    </p>
                                </div>
                            )}

                            {bestMatch && isCameraOn && (
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-none">
                                    <div className="bg-green-500/90 backdrop-blur-xl text-white px-12 py-10 rounded-[3rem] shadow-2xl text-center animate-in fade-in zoom-in duration-200 border-[6px] border-white/20 transform hover:scale-105 transition-transform">
                                        <p className="text-sm font-bold uppercase tracking-widest opacity-80 mb-2">Verified Match</p>
                                        <h2 className="text-7xl font-black tracking-tighter drop-shadow-lg">{bestMatch.label}</h2>
                                        <div className="mt-4 inline-flex items-center gap-2 bg-black/20 px-4 py-1.5 rounded-full">
                                            <div className="w-2 h-2 rounded-full bg-green-300 animate-pulse"></div>
                                            <p className="text-sm font-bold font-mono">{(bestMatch.score * 100).toFixed(0)}% Certainty</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <video
                                ref={videoRef}
                                autoPlay
                                muted
                                playsInline
                                className={`absolute inset-0 w-full h-full object-cover pointer-events-none ${!isCameraOn ? 'hidden' : 'block'}`}
                            />
                            <canvas
                                ref={canvasRef}
                                className={`absolute inset-0 w-full h-full object-cover z-10 pointer-events-none opacity-80 ${!isCameraOn ? 'hidden' : 'block'}`}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TestSkills;
