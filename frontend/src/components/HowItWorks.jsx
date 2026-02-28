import React from 'react';
import { motion } from 'framer-motion';
import { Mic, Keyboard, Cpu, Sparkles, Smile, Bot } from 'lucide-react';

const steps = [
    {
        icon: <div className="flex gap-2"><Mic className="w-8 h-8 text-red-600" /><Keyboard className="w-8 h-8 text-red-600" /></div>,
        title: "Input Text or Speech",
        description: "Simply type your message or use voice input to start. Our system captures your words instantly.",
        color: "red"
    },
    {
        icon: <Cpu className="w-8 h-8 text-orange-600" />,
        title: "AI Processing",
        description: "Our advanced NLP engine converts your input into precise sign language sequences and skeletal data.",
        color: "orange"
    },
    {
        icon: <Bot className="w-8 h-8 text-pink-600" />,
        title: "3D Avatar Display",
        description: "Watch as our realistic 3D avatars, X-Bot and Y-Bot, perform the signs fluently in real-time.",
        color: "pink"
    }
];

const HowItWorks = () => {
    return (
        <section className="py-24 relative overflow-hidden">
            <div className="max-w-7xl mx-auto px-6 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-20"
                >
                    <span className="inline-block py-1 px-3 rounded-full bg-red-100 text-red-700 font-bold text-xs uppercase tracking-widest mb-4 border border-red-200">
                        Seamless Communication
                    </span>
                    <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-6 tracking-tight">
                        From Voice to <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-orange-600">Visible Sign.</span>
                    </h2>
                    <p className="text-lg text-slate-600 max-w-2xl mx-auto font-medium">
                        Bridging the gap with technology. Turn any conversation into visual sign language instantly.
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
                    {/* Connecting Line (Desktop) */}
                    <div className="hidden md:block absolute top-16 left-[16%] right-[16%] h-0.5 bg-gradient-to-r from-red-200 via-orange-200 to-pink-200 z-0"></div>

                    {steps.map((step, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 40 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.2 }}
                            className="relative group"
                        >
                            <div className="flex flex-col items-center text-center">
                                {/* Icon Container */}
                                <div className={`w-32 h-32 rounded-3xl bg-white/70 backdrop-blur-md shadow-xl shadow-slate-200/50 mb-8 flex items-center justify-center relative z-10 transition-transform duration-300 group-hover:-translate-y-2 border border-white/50 group-hover:border-red-200`}>
                                    <div className={`absolute inset-0 bg-${step.color}-50 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                                    <div className={`relative z-10 p-6 bg-${step.color}-50 rounded-2xl transform transition-transform duration-300 group-hover:scale-110`}>
                                        {step.icon}
                                    </div>

                                    {/* Number Badge */}
                                    <div className="absolute -top-4 -right-4 w-10 h-10 bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-xl flex items-center justify-center font-bold text-lg shadow-lg rotate-12 group-hover:rotate-0 transition-transform duration-300 border border-white/20">
                                        {index + 1}
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="bg-white/40 backdrop-blur-sm p-6 rounded-3xl border border-white/50 hover:border-red-200 hover:bg-white/60 transition-all w-full shadow-lg shadow-red-500/5">
                                    <h3 className="text-xl font-bold text-slate-900 mb-3">{step.title}</h3>
                                    <p className="text-slate-600 leading-relaxed text-sm font-medium">
                                        {step.description}
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default HowItWorks;
