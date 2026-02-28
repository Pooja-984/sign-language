import React from 'react';
import { Heart } from 'lucide-react';

const Footer = () => {
    return (
        <footer className="bg-gray-900 text-white py-8">
            <div className="w-full px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col md:flex-row justify-between items-center">
                    <div className="mb-4 md:mb-0">
                        <h3 className="text-xl font-bold">SignTrans</h3>
                        <p className="text-gray-400 text-sm mt-1">Bridging the communication gap.</p>
                    </div>
                    <div className="flex flex-col items-center md:items-end">
                        <p className="flex items-center gap-1 text-sm text-gray-400">
                            Made with <Heart className="h-4 w-4 text-red-500 fill-current" /> by Pooja
                        </p>
                        <p className="text-xs text-gray-500 mt-2">&copy; {new Date().getFullYear()} Sign Language Translator. All rights reserved.</p>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
