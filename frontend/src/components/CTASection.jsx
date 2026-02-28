import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const CTASection = () => {
    return (
        <section className="py-24 bg-slate-900 overflow-hidden relative">
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10"></div>

            {/* Abstract Shapes */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000"></div>

            <div className="w-full px-6 relative z-10 text-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                >
                    <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Ready to Break the Silence?</h2>
                    <p className="text-xl text-slate-300 max-w-2xl mx-auto mb-10">
                        Join thousands of users who are making the world more accessible, one sign at a time.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">


                        <Link
                            to="/register"
                            className="px-8 py-4 bg-transparent border border-slate-700 text-white rounded-lg font-semibold text-lg hover:bg-slate-800 transition-colors"
                        >
                            Create Free Account
                        </Link>
                    </div>
                </motion.div>
            </div>
        </section>
    );
};

export default CTASection;
