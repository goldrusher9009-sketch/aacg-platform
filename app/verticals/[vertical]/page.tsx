'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Droplet, Zap, Home, Wind, Wrench, UtensilsCrossed, Briefcase, HardHat,
  Clock, MapPin, Phone, Mail, Star, Check, ArrowRight, Calendar, Users
} from 'lucide-react';

interface Vertical {
  id: string;
  name: string;
  shortCode: string;
  services: string[];
  icon: string;
}

interface Service {
  id: string;
  name: string;
  description: string;
  price: string;
  duration: string;
}

const VERTICALS_MAP: { [key: string]: Vertical } = {
  plumbing: {
    id: 'plumbing',
    name: 'All American Plumbing',
    shortCode: 'AAPlumbing',
    services: ['Emergency Repairs', 'Installations', 'Pipe Replacements', 'Water Heater Services'],
    icon: 'Droplet'
  },
  electric: {
    id: 'electric',
    name: 'All American Electric',
    shortCode: 'AAElectric',
    services: ['Wiring', 'Panel Upgrades', 'Repairs', 'LED Lighting'],
    icon: 'Zap'
  },
  roofing: {
    id: 'roofing',
    name: 'All American Roofing',
    shortCode: 'AARoofing',
    services: ['Inspection', 'Repairs', 'New Installation', 'Maintenance'],
    icon: 'Home'
  },
  hvac: {
    id: 'hvac',
    name: 'All American HVAC',
    shortCode: 'AAHVAC',
    services: ['AC Installation', 'Heating', 'Maintenance', 'Emergency Service'],
    icon: 'Wind'
  },
  maintenance: {
    id: 'maintenance',
    name: 'All American Maintenance',
    shortCode: 'AAMaintenance',
    services: ['Preventive Maintenance', 'Emergency Response', 'Inspection', 'Upgrade'],
    icon: 'Wrench'
  },
  qsr: {
    id: 'qsr',
    name: 'All American QSR',
    shortCode: 'AAQSR',
    services: ['Equipment Installation', 'Kitchen Design', 'Maintenance', 'Compliance'],
    icon: 'UtensilsCrossed'
  },
  office: {
    id: 'office',
    name: 'All American Office',
    shortCode: 'AAOffice',
    services: ['Office Setup', 'Space Planning', 'IT Infrastructure', 'Maintenance'],
    icon: 'Briefcase'
  },
  trades: {
    id: 'trades',
    name: 'All American Trades',
    shortCode: 'AATrades',
    services: ['Carpentry', 'Masonry', 'Painting', 'Flooring'],
    icon: 'HardHat'
  }
};

const iconMap: { [key: string]: any } = {
  Droplet, Zap, Home, Wind, Wrench, UtensilsCrossed, Briefcase, HardHat
};

export default function VerticalPage() {
  const params = useParams();
  const verticalId = params.vertical as string;
  const vertical = VERTICALS_MAP[verticalId];
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!vertical) return;
    loadServices();
  }, [vertical]);

  const loadServices = async () => {
    try {
      // Generate mock services for demo
      const mockServices: Service[] = vertical?.services.map((name, idx) => ({
        id: `${vertical.id}-${idx}`,
        name,
        description: `Professional ${name.toLowerCase()} service for residential and commercial properties`,
        price: `$${(150 + idx * 50).toString()}`,
        duration: '1-2 hours'
      })) || [];
      setServices(mockServices);
    } finally {
      setLoading(false);
    }
  };

  if (!vertical) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <Card className="bg-slate-700 border-slate-600">
          <CardContent className="p-8">
            <p className="text-white text-xl">Vertical not found: {verticalId}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const Icon = iconMap[vertical.icon];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      {/* Hero Section */}
      <div className="relative pt-20 pb-32 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            {Icon && <Icon className="w-12 h-12 text-blue-400" />}
            <div>
              <p className="text-blue-400 text-sm font-semibold">{vertical.shortCode}</p>
              <h1 className="text-5xl font-bold text-white">{vertical.name}</h1>
            </div>
          </div>
          <p className="text-xl text-slate-300 max-w-2xl mb-8">
            Professional {vertical.name.split(' ').slice(2).join(' ').toLowerCase()} services with certified technicians, transparent pricing, and 24/7 availability.
          </p>
          <div className="flex gap-4">
            <button className="px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 flex items-center gap-2">
              Get Quote <ArrowRight className="w-4 h-4" />
            </button>
            <button className="px-8 py-3 bg-slate-700 text-white rounded-lg font-semibold hover:bg-slate-600 flex items-center gap-2">
              <Phone className="w-4 h-4" /> Call Now
            </button>
          </div>
        </div>
      </div>

      {/* Services Grid */}
      <div className="max-w-6xl mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-white mb-12">Our Services</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service) => (
            <Card key={service.id} className="bg-slate-700 border-slate-600 hover:border-blue-500 transition">
              <CardHeader>
                <CardTitle className="text-white text-lg">{service.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-slate-300">{service.description}</p>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-slate-400 text-sm">Starting at</p>
                    <p className="text-2xl font-bold text-blue-400">{service.price}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-slate-400 text-sm flex items-center gap-1">
                      <Clock className="w-4 h-4" /> {service.duration}
                    </p>
                  </div>
                </div>
                <button className="w-full mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                  Book Service
                </button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Why Choose Us */}
      <div className="max-w-6xl mx-auto px-4 py-16 border-t border-slate-700">
        <h2 className="text-3xl font-bold text-white mb-12">Why Choose {vertical.shortCode}?</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { icon: Users, label: 'Expert Team', desc: 'Certified professionals with years of experience' },
            { icon: Clock, label: '24/7 Available', desc: 'Emergency service whenever you need us' },
            { icon: Check, label: 'Guaranteed Quality', desc: '100% satisfaction guarantee on all work' },
            { icon: MapPin, label: 'Local Service', desc: 'Fast response in your area' }
          ].map((item, idx) => {
            const ItemIcon = item.icon;
            return (
              <div key={idx} className="text-center">
                <ItemIcon className="w-12 h-12 text-blue-400 mx-auto mb-4" />
                <h3 className="text-white font-semibold mb-2">{item.label}</h3>
                <p className="text-slate-400 text-sm">{item.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 py-16 px-4 mt-16">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Get Started?</h2>
          <p className="text-blue-100 mb-8 text-lg">
            Schedule your service today and experience {vertical.shortCode} excellence
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="px-8 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50">
              <Calendar className="inline mr-2 w-4 h-4" /> Schedule Now
            </button>
            <button className="px-8 py-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 border border-white">
              <Phone className="inline mr-2 w-4 h-4" /> 1-800-AACG-PRO
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
