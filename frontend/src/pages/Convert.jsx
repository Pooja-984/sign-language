import React, { useState, useEffect, useRef } from "react";
import Slider from 'react-input-slider';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'font-awesome/css/font-awesome.min.css';

import xbot from '../Models/xbot/xbot.glb';
import ybot from '../Models/ybot/ybot.glb';
import xbotPic from '../Models/xbot/xbot.png';
import ybotPic from '../Models/ybot/ybot.png';

import * as words from '../Animations/words';
import * as alphabets from '../Animations/alphabets';
import { defaultPose } from '../Animations/defaultPose';

import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";

import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';

function Convert() {
    const [text, setText] = useState("");
    const [bot, setBot] = useState(xbot); // Default to X-Bot (Red)
    const [speed, setSpeed] = useState(0.1);
    const [pause, setPause] = useState(800);

    const componentRef = useRef({});
    const { current: ref } = componentRef;

    const textFromAudio = useRef(null);
    const textFromInput = useRef(null);

    const {
        transcript,
        listening,
        resetTranscript,
    } = useSpeechRecognition();

    useEffect(() => {

        ref.flag = false;
        ref.pending = false;

        ref.animations = [];
        ref.characters = [];

        ref.scene = new THREE.Scene();
        ref.scene.background = null; // Transparent for Glassmorphism

        const spotLight = new THREE.SpotLight(0xffffff, 100);
        spotLight.position.set(0, 5, 5);
        ref.scene.add(spotLight);
        ref.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }); // Alpha true
        ref.renderer.setClearColor(0x000000, 0);

        ref.camera = new THREE.PerspectiveCamera(
            30,
            window.innerWidth * 0.57 / (window.innerHeight - 70),
            0.1,
            1000
        )
        ref.renderer.setSize(window.innerWidth * 0.57, window.innerHeight - 70);

        const canvas = document.getElementById("canvas");
        if (canvas) {
            canvas.innerHTML = "";
            canvas.appendChild(ref.renderer.domElement);
        }

        ref.camera.position.z = 1.6;
        ref.camera.position.y = 1.4;

        let loader = new GLTFLoader();
        loader.load(
            bot,
            (gltf) => {
                gltf.scene.traverse((child) => {
                    if (child.type === 'SkinnedMesh') {
                        child.frustumCulled = false;
                        if (child.name.includes('Joints')) {
                            child.material.color.setHex(0x000000);
                        } else {
                            // Set color based on selected bot
                            if (bot === xbot) {
                                child.material.color.setHex(0xef4444); // Red-500 for X-Bot
                            } else {
                                child.material.color.setHex(0x38bdf8); // Light Blue for Y-Bot
                            }
                        }
                    }
                });
                ref.avatar = gltf.scene;
                ref.scene.add(ref.avatar);
                defaultPose(ref);
            },
            (xhr) => {
                console.log(xhr);
            }
        );

    }, [ref, bot]);

    ref.animate = () => {
        if (ref.animations.length === 0) {
            ref.pending = false;
            return;
        }
        if (!ref.avatar) return;
        requestAnimationFrame(ref.animate);
        if (ref.animations[0].length) {
            if (!ref.flag) {
                if (ref.animations[0][0] === 'add-text') {
                    setText(text + ref.animations[0][1]);
                    ref.animations.shift();
                }
                else {
                    for (let i = 0; i < ref.animations[0].length;) {
                        let [boneName, action, axis, limit, sign] = ref.animations[0][i]
                        if (sign === "+" && ref.avatar.getObjectByName(boneName)[action][axis] < limit) {
                            ref.avatar.getObjectByName(boneName)[action][axis] += speed;
                            ref.avatar.getObjectByName(boneName)[action][axis] = Math.min(ref.avatar.getObjectByName(boneName)[action][axis], limit);
                            i++;
                        }
                        else if (sign === "-" && ref.avatar.getObjectByName(boneName)[action][axis] > limit) {
                            ref.avatar.getObjectByName(boneName)[action][axis] -= speed;
                            ref.avatar.getObjectByName(boneName)[action][axis] = Math.max(ref.avatar.getObjectByName(boneName)[action][axis], limit);
                            i++;
                        }
                        else {
                            ref.animations[0].splice(i, 1);
                        }
                    }
                }
            }
        }
        else {
            ref.flag = true;
            setTimeout(() => {
                ref.flag = false
            }, pause);
            ref.animations.shift();
        }
        ref.renderer.render(ref.scene, ref.camera);
    }

    const sign = (inputRef) => {

        var str = inputRef.current.value.toUpperCase();
        var strWords = str.split(' ');
        setText('')

        for (let word of strWords) {
            if (words[word]) {
                ref.animations.push(['add-text', word + ' ']);
                words[word](ref);

            }
            else {
                for (const [index, ch] of word.split('').entries()) {
                    if (index === word.length - 1)
                        ref.animations.push(['add-text', ch + ' ']);
                    else
                        ref.animations.push(['add-text', ch]);
                    alphabets[ch](ref);

                }
            }
        }
    }

    const startListening = () => {
        SpeechRecognition.startListening({ continuous: true });
    }

    const stopListening = () => {
        SpeechRecognition.stopListening();
    }

    return (
        <div className='min-h-screen pt-24 px-6 pb-12 relative'>
            <div className='grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-[1600px] mx-auto'>

                {/* Left Panel: Controls */}
                <div className='lg:col-span-3 flex flex-col gap-6 bg-white/60 backdrop-blur-xl p-6 rounded-3xl border border-white/50 shadow-xl shadow-red-500/5 h-fit'>

                    {/* Processed Text Section */}
                    <div>
                        <label className='text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block flex items-center gap-2'>
                            <div className="w-1 h-4 bg-red-500 rounded-full"></div>
                            Processed Text
                        </label>
                        <textarea
                            rows={3}
                            value={text}
                            className='w-full p-4 bg-white/50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-red-500/10 focus:border-red-500 outline-none transition-all resize-none text-slate-700 font-medium'
                            readOnly
                        />
                    </div>

                    {/* Speech Recognition Controls */}
                    <div className="bg-white/40 p-4 rounded-2xl border border-white/50">
                        <div className='flex items-center justify-between mb-4'>
                            <label className='text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2'>
                                <i className="fa fa-microphone text-red-400"></i>
                                Speech Control
                            </label>
                            <span className={`text-[10px] font-bold px-2 py-1 rounded-full border ${listening ? 'bg-green-50 text-green-600 border-green-200' : 'bg-slate-50 text-slate-400 border-slate-200'}`}>
                                {listening ? 'ACTIVE' : 'OFF'}
                            </span>
                        </div>

                        <div className='grid grid-cols-3 gap-2'>
                            <button
                                className="flex flex-col items-center justify-center p-3 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-red-500 hover:text-white hover:border-red-500 hover:shadow-lg hover:shadow-red-500/20 transition-all active:scale-95 group"
                                onClick={startListening}
                            >
                                <i className="fa fa-microphone mb-1 opacity-50 group-hover:opacity-100" />
                                <span>On</span>
                            </button>
                            <button
                                className="flex flex-col items-center justify-center p-3 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-800 hover:text-white hover:border-slate-800 transition-all active:scale-95 group"
                                onClick={stopListening}
                            >
                                <i className="fa fa-microphone-slash mb-1 opacity-50 group-hover:opacity-100" />
                                <span>Off</span>
                            </button>
                            <button
                                className="flex flex-col items-center justify-center p-3 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 transition-all active:scale-95"
                                onClick={resetTranscript}
                            >
                                <i className="fa fa-trash mb-1 opacity-50" />
                                <span>Clear</span>
                            </button>
                        </div>
                    </div>

                    {/* Transcript Input */}
                    <div>
                        <textarea
                            rows={3}
                            ref={textFromAudio}
                            value={transcript}
                            placeholder='Speech input will appear here...'
                            className='w-full p-4 bg-white/50 border border-slate-200 rounded-2xl text-slate-500 text-sm resize-none focus:outline-none mb-3'
                            readOnly
                        />
                        <button
                            onClick={() => { sign(textFromAudio) }}
                            className='w-full py-3 px-4 bg-gradient-to-r from-red-500 to-red-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-red-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2'
                        >
                            <span>Animate Speech</span>
                            <i className="fa fa-play text-xs opacity-70"></i>
                        </button>
                    </div>

                    <div className="w-full h-px bg-slate-200/50"></div>

                    {/* Manual Text Input */}
                    <div>
                        <label className='text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block flex items-center gap-2'>
                            <div className="w-1 h-4 bg-slate-400 rounded-full"></div>
                            Manual Input
                        </label>
                        <textarea
                            rows={3}
                            ref={textFromInput}
                            placeholder='Type text to translate...'
                            className='w-full p-4 bg-white/50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-red-500/10 focus:border-red-500 outline-none transition-all resize-none text-slate-700 font-medium mb-3'
                        />
                        <button
                            onClick={() => { sign(textFromInput) }}
                            className='w-full py-3 px-4 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-900 hover:shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2'
                        >
                            <span>Animate Text</span>
                            <i className="fa fa-keyboard-o text-xs opacity-70"></i>
                        </button>
                    </div>
                </div>

                {/* Center Panel: 3D Canvas */}
                <div className='lg:col-span-7 h-[600px] lg:h-[80vh] bg-white/40 backdrop-blur-md rounded-[2.5rem] border border-white/50 shadow-2xl shadow-red-900/5 relative overflow-hidden group'>
                    {/* Overlay Label */}
                    <div className="absolute top-6 left-6 z-10 px-4 py-2 bg-white/80 backdrop-blur-md rounded-2xl border border-white/50 shadow-sm">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                            Live 3D Viewport
                        </span>
                    </div>
                    <div id='canvas' className="w-full h-full" />
                </div>

                {/* Right Panel: Avatar & Settings */}
                <div className='lg:col-span-2 flex flex-col gap-6'>

                    {/* Avatar Selection */}
                    <div className="bg-white/60 backdrop-blur-xl p-5 rounded-3xl border border-white/50 shadow-xl shadow-red-500/5">
                        <label className='text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 block text-center'>
                            Select Avatar
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => setBot(xbot)}
                                className={`group relative rounded-2xl overflow-hidden border-2 transition-all duration-300 ${bot === xbot ? 'border-red-500 ring-4 ring-red-500/10 scale-95' : 'border-transparent hover:border-red-200'}`}
                            >
                                <img src={xbotPic} className='w-full h-auto object-cover' alt='Avatar 1: XBOT' />
                                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-red-900/80 to-transparent p-2 pt-8">
                                    <span className="text-white text-[10px] font-bold uppercase tracking-wider">X-Bot</span>
                                </div>
                            </button>
                            <button
                                onClick={() => setBot(ybot)}
                                className={`group relative rounded-2xl overflow-hidden border-2 transition-all duration-300 ${bot === ybot ? 'border-sky-500 ring-4 ring-sky-500/10 scale-95' : 'border-transparent hover:border-sky-200'}`}
                            >
                                <img src={ybotPic} className='w-full h-auto object-cover' alt='Avatar 2: YBOT' />
                                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-sky-900/80 to-transparent p-2 pt-8">
                                    <span className="text-white text-[10px] font-bold uppercase tracking-wider">Y-Bot</span>
                                </div>
                            </button>
                        </div>
                    </div>

                    {/* Animation Settings */}
                    <div className="bg-white/60 backdrop-blur-xl p-6 rounded-3xl border border-white/50 shadow-xl shadow-red-500/5 flex-1 relative overflow-hidden">
                        {/* Decorative background blob */}
                        <div className="absolute -right-20 -bottom-20 w-40 h-40 bg-red-500/10 rounded-full blur-3xl pointer-events-none"></div>

                        <label className='text-xs font-bold text-slate-500 uppercase tracking-widest mb-6 block border-b border-red-100 pb-3'>
                            Settings
                        </label>

                        <div className="mb-8 relative z-10">
                            <div className="flex justify-between items-center mb-3">
                                <span className="text-sm font-bold text-slate-700">Speed</span>
                                <span className="text-[10px] font-mono bg-red-50 px-2 py-1 rounded-lg border border-red-100 text-red-600 font-bold">{Math.round(speed * 100) / 100}x</span>
                            </div>
                            <Slider
                                axis="x"
                                xmin={0.05}
                                xmax={0.50}
                                xstep={0.01}
                                x={speed}
                                onChange={({ x }) => setSpeed(x)}
                                className='w-full'
                                styles={{
                                    track: { backgroundColor: '#fee2e2', height: '6px', borderRadius: '3px' },
                                    active: { backgroundColor: '#ef4444' },
                                    thumb: { width: 18, height: 18, backgroundColor: 'white', border: '3px solid #ef4444', boxShadow: '0 2px 8px rgba(239, 68, 68, 0.3)' }
                                }}
                            />
                        </div>

                        <div className="relative z-10">
                            <div className="flex justify-between items-center mb-3">
                                <span className="text-sm font-bold text-slate-700">Pause</span>
                                <span className="text-[10px] font-mono bg-red-50 px-2 py-1 rounded-lg border border-red-100 text-red-600 font-bold">{pause}ms</span>
                            </div>
                            <Slider
                                axis="x"
                                xmin={0}
                                xmax={2000}
                                xstep={100}
                                x={pause}
                                onChange={({ x }) => setPause(x)}
                                className='w-full'
                                styles={{
                                    track: { backgroundColor: '#fee2e2', height: '6px', borderRadius: '3px' },
                                    active: { backgroundColor: '#ef4444' },
                                    thumb: { width: 18, height: 18, backgroundColor: 'white', border: '3px solid #ef4444', boxShadow: '0 2px 8px rgba(239, 68, 68, 0.3)' }
                                }}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Convert;
