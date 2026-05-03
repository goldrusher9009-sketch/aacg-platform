'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Droplet, Zap, Home, Wind, Wrench, UtensilsCrossed, Briefcase, HardHat,
  ArrowRight, Award, TrendingUp, Users, Zap as ZapIcon
} from 'lucide-react';

const VERTICALS = [
  {
    id: 'plumbing',
    name: 'All American Plumbing',
    shortCode: 'AAPlumbing',
    icon: Droplet,
    description: 'Emergency repairs, installations, and comprehensive plumbing solutions',
  },
  {
    id: 'electric',
    name: 'All American Electric',
    shortCode: 'AAElectric',
    icon: Zap,
    description: 'Electrical wiring, panel upgrades, and code compliance services',
  },
  {
    id: 'roofing',
    name: 'All American Roofing',
    shortCode: 'AARoofing',
    icon: Home,
    description: 'Professional roof inspection, repair, and installation services',
  },
  {
    id: 'hvac',
    name: 'All American HVAC',
    shortCode: 'AAHVAC',
    icon: Wind,
    description: 'Heating, cooling, and climate control solutions for any space',
  },
  {
    id: 'maintenance',
    name: 'All American Maintenance',
    shortCode: 'AAMaintenance',
    icon: Wrench,
    description: 'Full-service general construction and project management',
  },
  {
    id: 'qsr',
    name: 'All American QSR',
    shortCode: 'AAQSR',
    icon: UtensilsCrossed,
    description: 'Quick service restaurant equipment and compliance solutions',
  },
  {
    id: 'office',
    name: 'All American Office',
    shortCode: 'AAOffice',
    icon: Briefcase,
    description: 'Office setup, IT infrastructure, and workspace solutions',
  },
  {
    id: 'trades',
    name: 'All American Trades',
    shortCode: 'AATrades',
    icon: HardHat,
    description: 'Specialized trade services including carpentry, masonry, and finishing',
  }
];

export default function Home() {
  const [hoveredVertical, setHoveredVertical] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-slate-900/80 backdrop-blur-md border-b border-slate-700 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">AA</span>
              </div>
              <span className="text-white font-bold text-xl hidden sm:inline">AACG</span>
            </div>
            <div className="hidden md:flex gap-8">
              <a href="#verticals" className="text-slate-300 hover:text-white">Services</a>
              <a href="#features" className="text-slate-300 hover:text-white">Why Us</a>
            </div>
            <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold">Get Quote</button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div className="pt-32 pb-20 px-4 text-center">
        <h1 className="text-6xl md:text-7xl font-bold text-white mb-6">All American Construction Group</h1>
        <p className="text-xl text-slate-300 mb-8 max-w-3xl mx-auto">
          Complete trade solutions across 8 verticals. Your trusted partner for quality service.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button className="px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold flex items-center justify-center gap-2">
            Start Project <ArrowRight className="w-5 h-5" />
          </button>
          <button className="px-8 py-4 bg-slate-700 text-white rounded-lg hover:bg-slate-600 font-semibold">
            Call 1-800-AACG-PRO
          </button>
        </div>
      </div>

      {/* Verticals Grid */}
      <div id="verticals" className="max-w-7xl mx-auto px-4 py-20">
        <h2 className="text-4xl font-bold text-white text-center mb-16">Our Services</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {VERTICALS.map((vertical) => {
            const Icon = vertical.icon;
            return (
              <Link key={vertical.id} href={`/verticals/${vertical.id}`}>
                <div
                  className="h-full p-6 bg-gradient-to-br from-slate-700 to-slate-800 rounded-xl border border-slate-600 hover:border-blue-500 transition hover:shadow-lg hover:shadow-blue-500/20 cursor-pointer"
                  onMouseEnter={() => setHoveredVertical(vertical.id)}
                  onMouseLeave={() => setHoveredVertical(null)}
                >
                  <Icon className={`w-12 h-12 mb-4 transition ${hoveredVertical === vertical.id ? 'text-blue-400 scale-110' : 'text-slate-400'}`} />
                  <h3 className="text-white font-bold text-lg mb-2">{vertical.name}</h3>
                  <p className="text-slate-400 text-sm mb-4">{vertical.description}</p>
                  <div className="flex items-center text-blue-400">
                    <span className="text-sm font-semibold">Learn More</span>
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Stats */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 py-16 px-4 mt-20">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
          {[
            { number: '10K+', label: 'Projects' },
            { number: '8', label: 'Verticals' },
            { number: '500+', label: 'Technicians' },
            { number: '98%', label: 'Satisfaction' }
          ].map((stat, idx) => (
            <div key={idx}>
              <p className="text-4xl font-bold text-white">{stat.number}</p>
              <p className="text-blue-100">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <h2 className="text-4xl font-bold text-white mb-6">Ready to Get Started?</h2>
        <button className="px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold text-lg">Get Free Quote</button>
      </div>
    </div>
  );
}
