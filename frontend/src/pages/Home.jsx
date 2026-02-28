import React from 'react';
import HeroSection from '../components/HeroSection';
import FeaturesSection from '../components/FeaturesSection';
import HowItWorks from '../components/HowItWorks';
import CTASection from '../components/CTASection';

const Home = () => {
    return (
        <div className="flex flex-col w-full ">
            <HeroSection />
            <FeaturesSection />
            <HowItWorks />
            <CTASection />
        </div>
    );
};

export default Home;
