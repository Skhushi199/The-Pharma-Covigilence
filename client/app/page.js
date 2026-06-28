'use client';
import Link from 'next/link';
import { Shield, MessageSquare, Activity, ArrowRight, Star, Lock, Zap } from 'lucide-react';

const features = [
  {
    icon: MessageSquare,
    title: 'Conversational Reporting',
    desc: 'Guided chat interface walks you through each step — no complex forms to fill.',
    color: 'text-emerald-600',
    bg: 'bg-emerald-50 border-emerald-500/20',
  },
  {
    icon: Zap,
    title: 'AI-Powered MedDRA Mapping',
    desc: 'Your symptoms are automatically classified using global MedDRA medical terminology.',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10 border-emerald-500/20',
  },
  {
    icon: Activity,
    title: 'Naranjo Causality Score',
    desc: 'Scientifically validated algorithm assesses the likelihood that the drug caused your reaction.',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10 border-amber-500/20',
  },
  {
    icon: Shield,
    title: 'Secure & Confidential',
    desc: 'Your data is encrypted and only reviewed by qualified pharmacovigilance professionals.',
    color: 'text-rose-400',
    bg: 'bg-rose-500/10 border-rose-500/20',
  },
];

const steps = [
  { num: '01', title: 'Identify the Drug', desc: 'Tell us the medicine name and manufacturer' },
  { num: '02', title: 'Describe Symptoms', desc: 'Describe what happened in your own words' },
  { num: '03', title: 'Answer 4 Questions', desc: 'Quick yes/no causality assessment questions' },
  { num: '04', title: 'Get Your Report ID', desc: 'Receive a unique case reference number' },
];

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* ── Navigation ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-emerald-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-lime-500 flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold gradient-text">PharmaVigil</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="btn-secondary text-sm py-2 px-4">
              Sign In
            </Link>
            <Link href="/login?mode=register" className="btn-primary text-sm py-2 px-4">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-6 pt-32 pb-24">


        <h1 className="text-5xl md:text-7xl font-black leading-tight mb-6 max-w-4xl">
          Data-Driven Pharmacovigilance
          <br />
          <span className="gradient-text">Made Simple</span>
        </h1>

        <p className="text-lg md:text-xl text-emerald-700 max-w-2xl mb-12 leading-relaxed">
          Leverage standardized reporting and automated mapping to process adverse drug reactions. Built for precision, speed, and comprehensive safety analysis.
        </p>

        <div className="flex flex-wrap gap-4 justify-center">
          <Link
            href="/login?mode=register"
            className="btn-primary flex items-center gap-2 text-base px-8 py-4 animate-pulse-glow"
          >
            Report an ADR
            <ArrowRight className="w-5 h-5" />
          </Link>
          <Link href="/login?mode=admin" className="btn-secondary flex items-center gap-2 text-base px-8 py-4">
            <Lock className="w-4 h-4" />
            Admin Login
          </Link>
        </div>

        {/* Stats */}
        <div className="flex flex-wrap gap-8 justify-center mt-20">
          {[
            { label: 'Reports Processed', value: 'Real-time' },
            { label: 'MedDRA Mapping', value: 'SapBERT AI' },
            { label: 'Naranjo Algorithm', value: 'Validated' },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-3xl font-black gradient-text">{stat.value}</div>
              <div className="text-emerald-600 text-sm mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-24 px-6 bg-amber-50/30">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            Built to reduce <span className="gradient-text">human effort</span>
          </h2>
          <p className="text-emerald-700 text-center mb-14 max-w-xl mx-auto">
            Automating and streamlining the pharmacovigilance process to save time and improve accuracy.
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f) => (
              <div key={f.title} className={`card border ${f.bg} hover:scale-105 transition-transform duration-300`}>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${f.bg} border`}>
                  <f.icon className={`w-6 h-6 ${f.color}`} />
                </div>
                <h3 className="font-semibold text-emerald-950 mb-2">{f.title}</h3>
                <p className="text-emerald-700 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-14">
            4 Simple <span className="gradient-text">Steps</span>
          </h2>
          <div className="space-y-4">
            {steps.map((step, i) => (
              <div
                key={step.num}
                className="flex items-start gap-6 card hover:border-emerald-300 transition-all duration-300"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div className="text-4xl font-black gradient-text opacity-60 flex-shrink-0 w-16">
                  {step.num}
                </div>
                <div>
                  <div className="font-semibold text-emerald-950 mb-1">{step.title}</div>
                  <div className="text-emerald-700 text-sm">{step.desc}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-12">
            <Link href="/login?mode=register" className="btn-primary inline-flex items-center gap-2 text-base px-10 py-4">
              Start Your Report
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>


    </div>
  );
}
