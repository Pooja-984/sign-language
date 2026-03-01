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

function LearnSign() {
    const [bot, setBot] = useState(xbot);
    const [speed, setSpeed] = useState(0.1);
    const [pause, setPause] = useState(800);

    const componentRef = useRef({});
    const { current: ref } = componentRef;

    useEffect(() => {

        ref.flag = false;
        ref.pending = false;

        ref.animations = [];
        ref.characters = [];

        ref.scene = new THREE.Scene();
        // Transparent background for glassmorphism
        ref.scene.background = null;

        const spotLight = new THREE.SpotLight(0xffffff, 100);
        spotLight.position.set(0, 5, 5);
        ref.scene.add(spotLight);

        const canvas = document.getElementById("canvas");
        let targetWidth = canvas ? canvas.clientWidth : window.innerWidth * 0.57;
        let targetHeight = canvas ? canvas.clientHeight : window.innerHeight - 70;

        ref.camera = new THREE.PerspectiveCamera(
            30,
            targetWidth / targetHeight,
            0.1,
            1000
        )

        ref.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        ref.renderer.setSize(targetWidth, targetHeight);
        ref.renderer.setClearColor(0x000000, 0);

        if (canvas) {
            canvas.innerHTML = "";
            canvas.appendChild(ref.renderer.domElement);
        }

        const handleResize = () => {
            if (canvas && ref.renderer && ref.camera) {
                const newWidth = canvas.clientWidth;
                const newHeight = canvas.clientHeight;
                ref.camera.aspect = newWidth / newHeight;
                ref.camera.updateProjectionMatrix();
                ref.renderer.setSize(newWidth, newHeight);
            }
        };
        window.addEventListener("resize", handleResize);

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

        return () => {
            window.removeEventListener("resize", handleResize);
        };
    }, [ref, bot]);

    ref.animate = () => {
        if (ref.animations.length === 0) {
            ref.pending = false;
            return;
        }
        if (!ref.avatar) return; // Wait for avatar to load
        requestAnimationFrame(ref.animate);
        if (ref.animations[0].length) {
            if (!ref.flag) {
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
        else {
            ref.flag = true;
            setTimeout(() => {
                ref.flag = false
            }, pause);
            ref.animations.shift();
        }
        ref.renderer.render(ref.scene, ref.camera);
    }

    let alphaButtons = [];
    for (let i = 0; i < 26; i++) {
        alphaButtons.push(
            <button
                key={i}
                className='h-10 w-full text-slate-700 font-bold bg-white/50 border border-red-100 rounded-xl hover:bg-red-500 hover:text-white hover:border-red-500 hover:shadow-lg hover:shadow-red-500/30 transition-all duration-300 transform hover:scale-105 active:scale-95 flex items-center justify-center p-2'
                onClick={() => {
                    if (ref.animations.length === 0) {
                        alphabets[String.fromCharCode(i + 65)](ref);
                    }
                }}
            >
                {String.fromCharCode(i + 65)}
            </button>
        );
    }

    let wordButtons = [];
    for (let i = 0; i < words.wordList.length; i++) {
        wordButtons.push(
            <div className='col-md-4' key={i}>
                <button className='mt-2.5 h-[40px] w-full text-slate-700 font-bold bg-white/50 border border-red-100 rounded-xl hover:bg-red-500 hover:text-white hover:border-red-500 hover:shadow-lg hover:shadow-red-500/30 transition-all duration-300 transform hover:-translate-y-0.5 text-xs uppercase tracking-wide' onClick={() => {
                    if (ref.animations.length === 0) {
                        words[words.wordList[i]](ref);
                    }
                }}>
                    {words.wordList[i]}
                </button>
            </div>
        );
    }

    return (
        <div className='min-h-screen pt-24 px-6 pb-12 relative'>
            <div className='grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-[1600px] mx-auto'>

                {/* Left Panel: Alphabets & Words */}
                <div className='lg:col-span-3 flex flex-col gap-8 bg-white/60 backdrop-blur-xl p-6 rounded-3xl border border-white/50 shadow-xl shadow-red-500/5 h-fit max-h-[80vh] overflow-y-auto scrollbar-thin scrollbar-thumb-red-200 scrollbar-track-transparent'>

                    {/* Alphabets Section */}
                    <div>
                        <h2 className='text-xs font-bold text-red-500 uppercase tracking-widest mb-4 border-b border-red-100 pb-3 flex items-center gap-2'>
                            <div className="w-1 h-4 bg-red-500 rounded-full"></div>
                            Alphabets
                        </h2>
                        <div className='grid grid-cols-6 gap-2'>
                            {alphaButtons}
                        </div>
                    </div>

                    {/* Words Section */}
                    <div>
                        <h2 className='text-xs font-bold text-red-500 uppercase tracking-widest mb-4 border-b border-red-100 pb-3 flex items-center gap-2 mt-4'>
                            <div className="w-1 h-4 bg-red-500 rounded-full"></div>
                            Common Words
                        </h2>
                        <div className='grid grid-cols-2 gap-3'>
                            {wordButtons}
                        </div>
                    </div>
                </div>

                {/* Center Panel: 3D Canvas */}
                <div className='lg:col-span-7 h-[600px] lg:h-[80vh] bg-white/40 backdrop-blur-md rounded-[2.5rem] border border-white/50 shadow-2xl shadow-red-900/5 relative overflow-hidden group'>
                    {/* Overlay Label */}
                    <div className="absolute top-6 left-6 z-10 px-4 py-2 bg-white/80 backdrop-blur-md rounded-2xl border border-white/50 shadow-sm">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                            Live 3D View
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
                            Controls
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
                                    active: { backgroundColor: '#ef4444' }, // Red-500
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
                                    active: { backgroundColor: '#ef4444' }, // Red-500
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

export default LearnSign;
