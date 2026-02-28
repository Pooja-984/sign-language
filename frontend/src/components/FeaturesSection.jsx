import React from 'react';
import { motion } from 'framer-motion';
import { Languages, GraduationCap, Video, Users, Zap, Shield, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const features = [

    {
        icon: <GraduationCap className="w-6 h-6" />,
        title: "Learn Sign Language",
        description: "Interactive tutorials and lessons to help you master sign language from basics to advanced.",
        link: "/sign-kit/learn-sign",
        color: "bg-emerald-500"
    },
    {
        icon: <Video className="w-6 h-6" />,
        title: "Avatar Sign",
        description: "Convert text or audio into sign language animations using our 3D avatar technology.",
        link: "/sign-kit/convert",
        color: "bg-violet-500"
    },

    {
        icon: <Zap className="w-6 h-6" />,
        title: "Skill Verification",
        description: "Test your signing skills with real-time feedback.",
        link: "/skills/test",
        color: "bg-amber-500"
    },
    {
        icon: <Shield className="w-6 h-6" />,
        title: "Privacy First",
        description: "All processing happens securely. Your camera input is processed locally where possible.",
        link: null, // No link for this info card
        color: "bg-slate-500"
    }
];

const FeaturesSection = () => {
    return (
        <section className="py-24 relative">
            <div className="w-full px-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="text-center max-w-3xl mx-auto mb-16"
                >
                    <span className="text-sm font-semibold text-red-500 uppercase tracking-wider mb-2 block bg-red-50 inline-block px-4 py-1 rounded-full border border-red-100">Why Choose SignTrans</span>
                    <h2 className="text-3xl md:text-5xl font-bold text-slate-900 mb-6 tracking-tight">Complete Toolkit for <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-red-500">Inclusive</span> Communication</h2>
                    <p className="text-slate-600 text-lg font-light leading-relaxed">Everything you need to bridge the gap between sign language and spoken language, powered by advanced AI.</p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
                    {features.map((feature, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            whileHover={{ y: -5 }}
                            className="bg-white/40 backdrop-blur-md rounded-3xl p-6 shadow-lg border border-white/50 hover:shadow-red-500/10 hover:border-red-200 transition-all group"
                        >
                            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br from-white to-slate-50 border border-white shadow-sm flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                                <div className="text-red-500">
                                    {feature.icon}
                                </div>
                            </div>

                            <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-red-600 transition-colors">{feature.title}</h3>
                            <p className="text-slate-600 leading-relaxed mb-6 text-sm">{feature.description}</p>

                            {feature.link && (
                                <Link to={feature.link} className="inline-flex items-center text-sm font-bold text-red-500 hover:text-red-700 transition-colors">
                                    Learn more <ArrowRight className="ml-1 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </Link>
                            )}
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );

};

export default FeaturesSection;
