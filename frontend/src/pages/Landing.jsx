import { motion } from 'framer-motion';
import { 
  CloudRain, 
  Sun, 
  Wind, 
  ShieldAlert, 
  BrainCircuit, 
  Zap, 
  ShieldCheck, 
  Wallet,
  IndianRupee 
} from 'lucide-react';
import { Link } from 'react-router-dom';

const fadeIn = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15 }
  }
};

export default function Landing() {
  return (
    <div className="flex flex-col gap-32 pb-24 overflow-hidden pt-12">
      
      {/* --- HERO SECTION --- */}
      <section id="hero" className="max-w-7xl mx-auto px-4 w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative">
        {/* Background Glow */}
        <div className="absolute top-1/2 left-0 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[100px] -z-10" />
        
        {/* Left Side */}
        <motion.div 
          initial="hidden" animate="visible" variants={staggerContainer}
          className="flex flex-col items-start text-left"
        >
          <motion.h1 variants={fadeIn} className="text-[48px] font-[700] tracking-tight leading-[1.1] mb-4">
            Protecting Gig Workers' Income With AI
          </motion.h1>
          <motion.p variants={fadeIn} className="text-xl text-zinc-400 max-w-lg mb-10 mt-[16px]">
            Parametric insurance that automatically compensates delivery workers when weather disruptions stop deliveries.
          </motion.p>
          <motion.div variants={fadeIn} className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <button onClick={() => document.getElementById('pricing')?.scrollIntoView({behavior: 'smooth'})} className="w-full sm:w-auto bg-[#6366F1] text-white px-[28px] py-[14px] rounded-[12px] font-semibold transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-[0_0_20px_rgba(99,102,241,0.6)]">
              Get Covered
            </button>
            <button onClick={() => document.getElementById('how-it-works')?.scrollIntoView({behavior: 'smooth'})} className="w-full sm:w-auto border border-white/20 px-[28px] py-[14px] rounded-[12px] font-semibold text-white transition-all hover:bg-white/5">
              See How It Works
            </button>
          </motion.div>
        </motion.div>

        {/* Right Side (Floating Cards) */}
        <div className="relative h-[400px] sm:h-[500px] w-full flex items-center justify-center">
          <motion.div 
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-[10%] left-[10%] z-10 w-64 glass-card p-4 border border-red-500/30 bg-red-500/10 shadow-lg shadow-red-500/20"
          >
            <div className="flex items-center gap-3">
              <CloudRain className="w-8 h-8 text-red-400" />
              <div>
                <p className="text-sm font-bold text-red-400">Weather Alert</p>
                <p className="text-xs text-zinc-300">Rainfall 55mm warning</p>
              </div>
            </div>
          </motion.div>

          <motion.div 
            animate={{ y: [0, 6, 0] }}
            transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="absolute top-[40%] right-[5%] z-20 w-72 glass-card p-5 border border-secondary/30 bg-secondary/10 shadow-lg shadow-secondary/20"
          >
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-10 h-10 text-secondary" />
              <div>
                <p className="text-sm font-bold text-secondary">Income Protection Active</p>
                <p className="text-xl font-bold text-white flex items-center"><IndianRupee className="w-5 h-5"/>600 protected earnings</p>
              </div>
            </div>
          </motion.div>

          {/* Delivery Worker Icon Card */}
          <motion.div 
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 2 }}
            className="absolute bottom-[15%] left-[20%] z-0 w-48 glass-card p-4 flex flex-col items-center justify-center bg-white/5 border border-white/10"
          >
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-primary to-purple-500 flex items-center justify-center mb-2">
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <p className="text-sm font-semibold">Delivery Agent #802</p>
            <p className="text-xs text-primary">Status: Secured</p>
          </motion.div>
        </div>
      </section>

      {/* --- PROBLEM SECTION --- */}
      <section className="max-w-7xl mx-auto px-4 w-full">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={fadeIn} className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold">Gig Workers Lose Income During Disruptions</h2>
        </motion.div>
        
        <motion.div 
          initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={staggerContainer}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          <ProblemCard 
            icon={<CloudRain className="w-8 h-8 text-blue-400" />}
            title="Heavy Rain"
            text="Deliveries stop during severe storms."
          />
          <ProblemCard 
            icon={<Sun className="w-8 h-8 text-orange-500" />}
            title="Extreme Heat"
            text="Outdoor delivery becomes unsafe."
          />
          <ProblemCard 
            icon={<Wind className="w-8 h-8 text-zinc-400" />} /* representing pollution mask vaguely */
            title="Pollution & Curfews"
            text="Cities restrict movement suddenly."
          />
        </motion.div>
      </section>

      {/* --- SOLUTION SECTION --- */}
      <section id="how-it-works" className="max-w-7xl mx-auto px-4 w-full">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={fadeIn} className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Introducing GigShield AI</h2>
          <p className="text-xl text-zinc-400 max-w-2xl mx-auto">AI powered parametric insurance designed specifically for delivery partners.</p>
        </motion.div>
        
        <motion.div 
          initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={staggerContainer}
          className="grid grid-cols-1 md:grid-cols-1 gap-6 max-w-4xl mx-auto"
        >
          <div className="space-y-6">
            <FeatureStep 
              num="1"
              text="Delivery workers register and select a weekly protection plan."
            />
            <FeatureStep 
              num="2"
              text="The system continuously monitors environmental data including rainfall, temperature, and pollution levels."
            />
            <FeatureStep 
              num="3"
              text="If extreme weather conditions occur such as heavy rainfall above 40mm or temperature above 42°C, the AI parametric trigger activates automatically."
            />
            <FeatureStep 
              num="4"
              text="The system verifies the event using fraud detection rules and validates the worker's coverage."
            />
            <FeatureStep 
              num="5"
              text="The worker automatically receives compensation for lost income caused by environmental disruptions."
            />
          </div>
        </motion.div>
      </section>

      {/* --- WEEKLY PRICING SECTION --- */}
      <section id="pricing" className="max-w-6xl mx-auto px-4 w-full">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={fadeIn} className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold">Weekly Pricing</h2>
        </motion.div>
        
        <motion.div 
          initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={staggerContainer}
          className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center"
        >
          <PricingCard 
            plan="Basic Plan"
            price={20}
            coverage={300}
          />
          <PricingCard 
            plan="Premium Plan"
            price={50}
            coverage={1000}
            isPremium={true}
          />
          <PricingCard 
            plan="Standard Plan"
            price={35}
            coverage={600}
          />
        </motion.div>
      </section>

      {/* --- PARAMETRIC TRIGGER DEMO --- */}
      <section className="max-w-7xl mx-auto px-4 w-full">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={fadeIn} className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold">Live Parametric Simulation</h2>
        </motion.div>
        
        <motion.div 
          initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={staggerContainer}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          <TriggerDemoCard title="Heavy Rain Trigger" condition="Rainfall > 40mm" activateText="activates payout" />
          <TriggerDemoCard title="Extreme Heat Trigger" condition="Temperature > 42°C" activateText="activates coverage" />
          <TriggerDemoCard title="Severe Pollution" condition="AQI > 300" activateText="activates claim" />
          <TriggerDemoCard title="Curfew Event" condition="Delivery zone shutdown" activateText="activates payout" />
        </motion.div>
      </section>

    </div>
  );
}

// Subcomponents

function ProblemCard({ icon, title, text }) {
  return (
    <motion.div 
      variants={fadeIn}
      whileHover={{ y: -8, boxShadow: "0 20px 40px rgba(0,0,0,0.4)" }}
      className="bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] rounded-[16px] p-[24px] transition-all duration-300"
    >
      <div className="mb-4 bg-white/5 inline-block p-3 rounded-xl border border-white/10">{icon}</div>
      <h3 className="text-xl font-bold mb-2 text-white">{title}</h3>
      <p className="text-zinc-400">{text}</p>
    </motion.div>
  );
}

function FeatureStep({ num, text }) {
  return (
    <motion.div 
      variants={fadeIn}
      className="glass-card p-6 border-white/10 flex items-start gap-6 hover:border-primary/50 transition-colors"
    >
      <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30">
        <span className="text-xl font-bold text-primary">{num}</span>
      </div>
      <p className="text-lg text-zinc-300 mt-2">{text}</p>
    </motion.div>
  );
}

function PricingCard({ plan, price, coverage, isPremium }) {
  return (
    <motion.div 
      variants={fadeIn}
      whileHover={{ scale: 1.03, boxShadow: isPremium ? "0 0 40px rgba(99,102,241,0.3)" : "0 20px 40px rgba(0,0,0,0.3)" }}
      className={`relative p-8 rounded-2xl flex flex-col items-center text-center transition-all duration-300 ${isPremium ? 'border-2 border-primary bg-primary/5 scale-105' : 'glass-card border-white/10'}`}
    >
      {isPremium && (
        <div className="absolute -top-4 bg-primary text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
          Most Popular
        </div>
      )}
      <h3 className="text-xl font-bold mb-4">{plan}</h3>
      <div className="flex items-end gap-1 mb-6">
        <span className="text-4xl font-bold text-white flex items-center justify-center">
          <IndianRupee className="w-8 h-8"/>{price}
        </span>
        <span className="text-zinc-400 mb-1">/ week</span>
      </div>
      <div className="w-full h-px bg-white/10 mb-6" />
      <p className="text-zinc-300 flex items-center gap-2 justify-center">
        <ShieldCheck className="w-5 h-5 text-secondary" />
        Income protection up to <strong className="text-white">₹{coverage}</strong>
      </p>
      <button className={`w-full mt-8 py-3 rounded-xl font-bold transition-colors ${isPremium ? 'bg-primary text-white hover:bg-primary/90' : 'bg-white/10 text-white hover:bg-white/20'}`}>
        Select {plan}
      </button>
    </motion.div>
  );
}

function TriggerDemoCard({ title, condition, activateText }) {
  return (
    <motion.div 
      variants={fadeIn}
      className="glass-card p-6 border-white/10 relative overflow-hidden group"
    >
      <motion.div 
        animate={{ opacity: [0, 1, 0] }}
        transition={{ duration: 3, repeat: Infinity }}
        className="absolute top-4 right-4 w-3 h-3 rounded-full bg-alert shadow-[0_0_10px_rgba(249,115,22,1)]"
      />
      <h3 className="text-lg font-bold mb-3">{title}</h3>
      <p className="font-mono text-sm text-primary mb-2 bg-primary/10 p-2 rounded-lg inline-block">{condition}</p>
      <p className="text-sm text-zinc-400 mt-2">{activateText}.</p>
      
      {/* Visual pulse effect on hover for extra flair */}
      <div className="absolute inset-0 border-2 border-primary/0 group-hover:border-primary/20 rounded-[16px] transition-colors" />
    </motion.div>
  );
}
