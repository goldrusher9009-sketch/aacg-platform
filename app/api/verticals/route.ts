import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase-client';

// Define all trade verticals
const VERTICALS = {
  plumbing: {
    id: 'plumbing',
    name: 'All American Plumbing',
    shortCode: 'AAPlumbing',
    services: [
      'Emergency Repairs',
      'Installations',
      'Pipe Replacements',
      'Water Heater Services',
      'Drain Cleaning',
      'Fixture Installation',
      'Leak Detection'
    ],
    icon: 'Droplet'
  },
  electric: {
    id: 'electric',
    name: 'All American Electric',
    shortCode: 'AAElectric',
    services: [
      'Electrical Wiring',
      'Panel Upgrades',
      'Circuit Repair',
      'Generator Installation',
      'LED Lighting',
      'EV Charger Installation',
      'Code Compliance'
    ],
    icon: 'Zap'
  },
  roofing: {
    id: 'roofing',
    name: 'All American Roofing',
    shortCode: 'AARoofing',
    services: [
      'Roof Inspection',
      'Repairs',
      'New Installation',
      'Leak Detection',
      'Maintenance Plans',
      'Storm Damage Assessment',
      'Material Consultation'
    ],
    icon: 'Home'
  },
  hvac: {
    id: 'hvac',
    name: 'All American HVAC',
    shortCode: 'AAHVAC',
    services: [
      'AC Installation',
      'Heating Services',
      'Maintenance Plans',
      'Emergency Service',
      'System Upgrade',
      'Energy Audit',
      'Ductwork Design'
    ],
    icon: 'Wind'
  },
  generalconstruction: {
    id: 'generalconstruction',
    name: 'All American General Construction',
    shortCode: 'AAGC',
    services: [
      'New Construction',
      'Renovations',
      'Additions',
      'Commercial Build',
      'Residential Build',
      'Project Management',
      'Design Consultation'
    ],
    icon: 'Hammer'
  },
  qsr: {
    id: 'qsr',
    name: 'All American QSR',
    shortCode: 'AAQSR',
    services: [
      'Equipment Installation',
      'Kitchen Design',
      'Maintenance',
      'Compliance Inspection',
      'Upgrade Services',
      'Emergency Repair',
      'Vendor Management'
    ],
    icon: 'UtensilsCrossed'
  },
  office: {
    id: 'office',
    name: 'All American Office',
    shortCode: 'AAOffice',
    services: [
      'Office Setup',
      'Space Planning',
      'Furniture Installation',
      'IT Infrastructure',
      'Maintenance',
      'Renovation',
      'Cost Optimization'
    ],
    icon: 'Briefcase'
  },
  maintenance: {
    id: 'maintenance',
    name: 'All American Maintenance',
    shortCode: 'AAMaintenance',
    services: [
      'Preventive Maintenance',
      'Emergency Response',
      'Equipment Service',
      'Inspection',
      'Repair',
      'Upgrade',
      'Full Service Management'
    ],
    icon: 'Wrench'
  },
  trades: {
    id: 'trades',
    name: 'All American Trades',
    shortCode: 'AATrades',
    services: [
      'Carpentry',
      'Masonry',
      'Welding',
      'Painting',
      'Flooring',
      'Drywall',
      'Tile Work'
    ],
    icon: 'HardHat'
  }
};

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({
      success: true,
      verticals: VERTICALS,
      count: Object.keys(VERTICALS).length
    });
  } catch (error) {
    console.error('Verticals fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch verticals' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { verticalId, companyData } = await request.json();

    if (!VERTICALS[verticalId as keyof typeof VERTICALS]) {
      return NextResponse.json(
        { error: 'Invalid vertical ID' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('vertical_companies')
      .insert([
        {
          vertical_id: verticalId,
          company_data: companyData,
          created_at: new Date().toISOString()
        }
      ])
      .select();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: data[0]
    });
  } catch (error) {
    console.error('Vertical company creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create vertical company' },
      { status: 500 }
    );
  }
}
