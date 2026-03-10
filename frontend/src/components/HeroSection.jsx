import React, { Suspense, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Video } from 'lucide-react';
import { Canvas } from '@react-three/fiber';
import { Environment, OrbitControls } from '@react-three/drei';
import RobotModel from './RobotModel';
import ErrorBoundary from './ErrorBoundary';

const HeroSection = () => {
    const [robotColor, setRobotColor] = useState('#e85e46'); // Red-500

    return (
        <div className="relative w-full min-h-[80vh] sm:min-h-screen lg:min-h-[90vh] flex items-center overflow-hidden pt-16 pb-8 sm:pt-20 sm:pb-12 lg:pt-0 lg:pb-0">

            {/* Subtle Grid Background - REMOVED (Now Global in App.jsx) */}
            {/* <div className="absolute inset-0 bg-[linear-gradient(to_right,#f0f0f0_1px,transparent_1px),linear-gradient(to_bottom,#f0f0f0_1px,transparent_1px)] bg-[size:6rem_4rem] opacity-30"></div> */}

            <div className="w-full relative z-10">
                <div className="flex flex-col lg:flex-row items-center gap-8 md:gap-12 lg:gap-16 xl:gap-24">

                    {/* Text Content */}
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="flex-1 text-center lg:text-left pt-10 lg:pt-0 px-6 lg:pl-20"
                    >
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/10 mb-8 backdrop-blur-sm mx-auto lg:mx-0"
                        >
                            <span className="flex h-2 w-2 rounded-full bg-red-500"></span>
                            <span className="text-xs font-semibold uppercase tracking-wide text-red-200">
                                AI-Powered Communication
                            </span>
                        </motion.div>

                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-[10rem] font-['Bangers'] tracking-wide text-slate-900 leading-[0.9] mb-6 sm:mb-8 drop-shadow-[2px_2px_0_rgba(0,0,0,1)] sm:drop-shadow-[3px_3px_0_rgba(0,0,0,1)] md:drop-shadow-[5px_5px_0_rgba(0,0,0,1)] mx-auto lg:mx-0"
                        >
                            <span className="text-white [-webkit-text-stroke:1px_black] sm:[-webkit-text-stroke:2px_black] md:[-webkit-text-stroke:3px_black]">Breaking Silence.</span> <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-500 to-red-600 bg-[length:300%_auto] animate-gradient pb-2 md:pb-4 inline-block [-webkit-text-stroke:1px_black] sm:[-webkit-text-stroke:2px_black] md:[-webkit-text-stroke:3px_black] drop-shadow-[2px_2px_0_rgba(0,0,0,1)] sm:drop-shadow-[4px_4px_0_rgba(0,0,0,1)] md:drop-shadow-[6px_6px_0_rgba(0,0,0,1)] text-[#FFD700]">Building Bridges.</span>
                        </motion.h1>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.6 }}
                            className="text-base sm:text-lg lg:text-xl xl:text-2xl text-slate-600 mb-6 sm:mb-8 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-medium"
                        >
                            Experience the future of accessible communication. Real-time sign language translation that empowers connection without barriers.
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.8 }}
                            className="block mx-auto lg:mx-0 w-fit"
                        >
                            {(() => {
                                const isAuthenticated = !!localStorage.getItem('token');
                                const targetLink = isAuthenticated ? "/sign-kit/learn-sign" : "/register";
                                const buttonText = isAuthenticated ? "Continue Learning" : "Get Started Now";

                                return (
                                    <Link
                                        to={targetLink}
                                        className="group relative inline-flex items-center justify-center px-8 py-4 text-base font-bold text-white transition-all duration-300 bg-gradient-to-r from-red-500 via-red-600 to-red-700 rounded-full shadow-[0_0_20px_rgba(239,68,68,0.3)] hover:shadow-[0_0_30px_rgba(239,68,68,0.5)] hover:scale-105 active:scale-95 overflow-hidden !no-underline"
                                    >
                                        <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shimmer" />
                                        <span className="relative flex items-center gap-2">
                                            {buttonText}
                                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                        </span>
                                    </Link>
                                );
                            })()}
                        </motion.div>

                    </motion.div>

                    {/* 3D Robot Visual */}
                    <div className="flex-1 w-full h-[300px] sm:h-[400px] md:h-[500px] lg:h-[650px] xl:h-[700px] flex justify-center lg:justify-end relative border-none outline-none ring-0">
                        <div className="w-full h-full relative z-10 border-none outline-none ring-0 bg-transparent">
                            <ErrorBoundary fallback={
                                <div className="flex flex-col items-center justify-center h-full text-slate-400 p-8 text-center border-2 border-dashed border-slate-200 rounded-3xl">
                                    <p className="mb-2 font-semibold">3D Model Failed to Load</p>
                                    <p className="text-sm">Please ensure 'scene.gltf' is in the public folder.</p>
                                </div>
                            }>
                                <Suspense fallback={<div className="flex items-center justify-center h-full text-slate-400">Loading 3D Model...</div>}>
                                    <Canvas
                                        className="!border-none !outline-none !ring-0 !shadow-none !drop-shadow-none bg-transparent"
                                        style={{ border: 'none', outline: 'none', boxShadow: 'none', background: 'transparent' }}
                                        camera={{ position: [0, 0, 8], fov: 45 }}
                                        gl={{ alpha: true, preserveDrawingBuffer: true }}
                                    >
                                        <ambientLight intensity={0.5} />
                                        <pointLight position={[10, 10, 10]} intensity={1} />
                                        <RobotModel position={[0, -2.5, 0]} scale={0.4} color={robotColor} rotation={[0, -0.4, 0]} />
                                        <Environment preset="studio" />
                                        <OrbitControls enableZoom={false} />
                                    </Canvas>
                                </Suspense>
                            </ErrorBoundary>
                        </div>

                        {/* Color Control Bots */}
                        <div className="absolute bottom-2 sm:bottom-4 md:bottom-8 left-1/2 -translate-x-1/2 flex gap-2 sm:gap-3 md:gap-6 z-20">
                            <button
                                onClick={() => setRobotColor('#f87171')} /* Red-400 (Light Red) */
                                className="group relative flex items-center gap-1.5 sm:gap-2 px-3 py-2 sm:px-5 sm:py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg sm:rounded-xl hover:bg-red-400/20 transition-all duration-300"
                            >
                                <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-red-400 shadow-[0_0_10px_rgba(248,113,113,0.5)] group-hover:scale-125 transition-transform" />
                                <span className="text-[10px] sm:text-xs md:text-sm font-semibold text-slate-700 group-hover:text-red-500 transition-colors">X-Bot</span>
                            </button>

                            <button
                                onClick={() => setRobotColor('#38bdf8')} /* Sky-400 (Light Blue) */
                                className="group relative flex items-center gap-1.5 sm:gap-2 px-3 py-2 sm:px-5 sm:py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg sm:rounded-xl hover:bg-sky-400/20 transition-all duration-300"
                            >
                                <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-sky-400 shadow-[0_0_10px_rgba(56,189,248,0.5)] group-hover:scale-125 transition-transform" />
                                <span className="text-[10px] sm:text-xs md:text-sm font-semibold text-slate-700 group-hover:text-sky-500 transition-colors">Y-Bot</span>
                            </button>
                        </div>

                        {/* Decorative Circles - REMOVED for Global Background */}
                        {/* <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-red-50 rounded-full blur-3xl opacity-50 -z-10"></div> */}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HeroSection;
