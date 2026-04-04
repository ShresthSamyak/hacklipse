import React from 'react';
import { Header } from '@/widgets/landing/Header';
import { HeroSection } from '@/widgets/landing/HeroSection';
import { ProcessSteps } from '@/widgets/landing/ProcessSteps';
import { FeaturesBento } from '@/widgets/landing/FeaturesBento';
import { FinalCTA } from '@/widgets/landing/FinalCTA';
import { Footer } from '@/widgets/landing/Footer';
import { Sidebar } from '@/widgets/landing/Sidebar';

const Home: React.FC = () => {
  return (
    <div className="antialiased overflow-x-hidden selection:bg-primary selection:text-on-primary min-h-screen">
      <Header />
      <Sidebar />
      <HeroSection />
      <ProcessSteps />
      <FeaturesBento />
      <FinalCTA />
      <Footer />
    </div>
  );
};

export default Home;
