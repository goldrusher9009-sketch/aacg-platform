import os, json

PHONE = "929-888-2848"
BRAND = "IronForge"
ADMIN = "../admin/index.html"

TRADES = [
  {
    "slug":"general-contractor","name":"General Contractors","emoji":"🏗️",
    "headline":"Stop Losing Jobs to Paperwork","subhead":"Run your entire GC operation on autopilot — from bid to lien, IronForge handles it all.",
    "pain":"GCs juggle 12 subcontractors, 40 documents per job, and payment disputes that drain cash flow. Most GCs spend 30% of their week on admin instead of building.",
    "agents":["Lien Management AI","Contract Generator","Subcontractor Manager","Project Scheduler","Finance & Cash Flow AI","Compliance Officer AI","Estimating AI","Change Order Manager","Insurance Certificate Tracker","Permit Filing Agent"],
    "keyword":"general contractor software AI",
    "stats":[("$120K","avg annual savings","💰"),("34 hrs","saved per week","⏱️"),("98%","lien success rate","⚡"),("14 days","avg setup time","🚀")]
  },
  {
    "slug":"electrician","name":"Electrical Contractors","emoji":"⚡",
    "headline":"Never Miss a Lien Deadline Again","subhead":"IronForge automates every invoice, lien notice, and compliance doc for electrical contractors.",
    "pain":"Electrical contractors deal with strict licensing requirements, bonding renewals, and OSHA compliance — on top of running jobs and chasing payments from GCs who pay net-90.",
    "agents":["Lien Management AI","License & Bonding Tracker","OSHA Compliance Agent","Invoice & Collections AI","Payroll & Prevailing Wage AI","Permit Filing Agent","Insurance Certificate Tracker","Contract Generator","Safety Documentation Agent","Finance & Cash Flow AI"],
    "keyword":"electrician business software automation",
    "stats":[("$89K","avg annual savings","💰"),("28 hrs","saved per week","⏱️"),("100%","on-time lien filing","⚡"),("1 day","to file a lien","🚀")]
  },
  {
    "slug":"plumber","name":"Plumbing Contractors","emoji":"🚿",
    "headline":"Get Paid Faster on Every Plumbing Job","subhead":"Automated lien rights, invoicing, and compliance — so you can focus on the pipes.",
    "pain":"Plumbing contractors lose thousands every year to expired lien rights, slow invoicing, and licensing paperwork that falls through the cracks.",
    "agents":["Lien Management AI","Invoice & Collections AI","License & Bonding Tracker","Permit Filing Agent","Contract Generator","Payroll & Prevailing Wage AI","OSHA Compliance Agent","Finance & Cash Flow AI","Subcontractor Manager","Insurance Certificate Tracker"],
    "keyword":"plumbing contractor business management AI",
    "stats":[("$74K","avg annual savings","💰"),("22 hrs","saved per week","⏱️"),("95%","faster invoicing","⚡"),("3 min","to generate a lien","🚀")]
  },
  {
    "slug":"hvac","name":"HVAC Contractors","emoji":"❄️",
    "headline":"HVAC Back Office, Fully Automated","subhead":"IronForge handles service agreements, maintenance contracts, and lien rights — all on autopilot.",
    "pain":"HVAC businesses deal with seasonal cash flow gaps, recurring service agreement renewals, and warranty tracking across hundreds of systems.",
    "agents":["Service Agreement Manager","Lien Management AI","Invoice & Collections AI","License & Bonding Tracker","Seasonal Scheduling AI","Finance & Cash Flow AI","Contract Generator","Insurance Certificate Tracker","Payroll & Prevailing Wage AI","Compliance Officer AI"],
    "keyword":"HVAC contractor management software",
    "stats":[("$68K","avg annual savings","💰"),("25 hrs","saved per week","⏱️"),("100%","contract renewal rate","⚡"),("automated","service reminders","🚀")]
  },
  {
    "slug":"roofer","name":"Roofing Contractors","emoji":"🏠",
    "headline":"Win More Roofing Jobs, Chase Zero Payments","subhead":"Storm season, insurance claims, and material costs — IronForge manages all of it.",
    "pain":"Roofing contractors fight insurance adjusters, track storm-damage estimates, manage crews by job, and deal with homeowners who dispute final invoices.",
    "agents":["Insurance Claim AI","Lien Management AI","Estimating AI","Contract Generator","Finance & Cash Flow AI","Invoice & Collections AI","Crew Scheduling AI","Material Cost Tracker","OSHA Compliance Agent","Customer Communication AI"],
    "keyword":"roofing contractor software management",
    "stats":[("$95K","avg annual savings","💰"),("40 hrs","saved per week","⏱️"),("3x","faster insurance claims","⚡"),("$0","in disputed invoices","🚀")]
  },
  {
    "slug":"mason","name":"Masonry Contractors","emoji":"🧱",
    "headline":"Build More. Bill Faster. Get Paid in Full.","subhead":"Masonry-specific AI agents handle lien waivers, subcontractor payments, and job costing.",
    "pain":"Masonry contractors work on large commercial projects with complex payment schedules, joint checks, and conditional lien waivers that must be filed perfectly or payment stops.",
    "agents":["Lien Management AI","Conditional Waiver Generator","Joint Check Agreement AI","Job Costing Agent","Subcontractor Manager","Contract Generator","Finance & Cash Flow AI","Payroll & Prevailing Wage AI","Compliance Officer AI","Estimating AI"],
    "keyword":"masonry contractor software lien management",
    "stats":[("$82K","avg annual savings","💰"),("30 hrs","saved per week","⏱️"),("zero","missed lien waivers","⚡"),("automated","joint checks","🚀")]
  },
  {
    "slug":"drywall","name":"Drywall Contractors","emoji":"🔲",
    "headline":"Protect Your Lien Rights on Every Drywall Job","subhead":"IronForge files your preliminary notices automatically and tracks every sub's payment.",
    "pain":"Drywall contractors are typically 2nd or 3rd tier subs who lose lien rights because preliminary notices weren't filed in time. IronForge files them the same day.",
    "agents":["Preliminary Notice Agent","Lien Management AI","Subcontractor Manager","Invoice & Collections AI","Payroll & Prevailing Wage AI","Contract Generator","OSHA Compliance Agent","Finance & Cash Flow AI","Material Cost Tracker","Change Order Manager"],
    "keyword":"drywall contractor lien management software",
    "stats":[("$61K","avg annual savings","💰"),("20 hrs","saved per week","⏱️"),("same day","prelim notice filing","⚡"),("100%","lien rights preserved","🚀")]
  },
  {
    "slug":"flooring","name":"Flooring Contractors","emoji":"🏡",
    "headline":"More Floors Installed. Zero Unpaid Invoices.","subhead":"Automate your flooring business — estimates to final payment, fully handled.",
    "pain":"Flooring contractors lose revenue from inaccurate material estimates, change orders that aren't documented, and GCs who withhold final payment citing punch-list items.",
    "agents":["Estimating AI","Change Order Manager","Lien Management AI","Invoice & Collections AI","Material Cost Tracker","Contract Generator","Finance & Cash Flow AI","Punch List Manager","Payroll & Prevailing Wage AI","Customer Communication AI"],
    "keyword":"flooring contractor business software",
    "stats":[("$55K","avg annual savings","💰"),("18 hrs","saved per week","⏱️"),("40%","fewer invoice disputes","⚡"),("automated","change orders","🚀")]
  },
  {
    "slug":"painter","name":"Painting Contractors","emoji":"🎨",
    "headline":"Bid More Jobs. Collect Every Dollar.","subhead":"IronForge automates estimates, contracts, and collections for painters.",
    "pain":"Painting contractors work on razor-thin margins and depend on fast turnaround invoicing. Slow billing and missed lien deadlines can wipe out an entire job's profit.",
    "agents":["Estimating AI","Invoice & Collections AI","Lien Management AI","Contract Generator","Finance & Cash Flow AI","Material Cost Tracker","Payroll & Prevailing Wage AI","Change Order Manager","License & Bonding Tracker","Customer Communication AI"],
    "keyword":"painting contractor software management",
    "stats":[("$48K","avg annual savings","💰"),("16 hrs","saved per week","⏱️"),("2x","faster invoice payment","⚡"),("zero","missed lien rights","🚀")]
  },
  {
    "slug":"landscaper","name":"Landscaping Contractors","emoji":"🌿",
    "headline":"From Bid to Final Payment — Automated","subhead":"Maintenance contracts, lien rights, crew payroll — IronForge runs your landscape business.",
    "pain":"Landscaping companies struggle with seasonal workforce management, recurring maintenance contract renewals, and collecting from residential clients who dispute final bills.",
    "agents":["Service Agreement Manager","Payroll & Prevailing Wage AI","Invoice & Collections AI","Contract Generator","Crew Scheduling AI","Lien Management AI","Finance & Cash Flow AI","License & Bonding Tracker","Customer Communication AI","Material Cost Tracker"],
    "keyword":"landscaping contractor business management",
    "stats":[("$42K","avg annual savings","💰"),("14 hrs","saved per week","⏱️"),("100%","contract renewal rate","⚡"),("automated","seasonal crew onboarding","🚀")]
  },
  {
    "slug":"concrete","name":"Concrete Contractors","emoji":"🏗️",
    "headline":"Pour Concrete. Let IronForge Handle the Rest.","subhead":"Lien rights, mix orders, crew payroll, and compliance — all automated.",
    "pain":"Concrete contractors deal with time-sensitive pours, expensive material orders, and payment disputes tied to inspection sign-offs that delay final payment.",
    "agents":["Lien Management AI","Material Cost Tracker","Payroll & Prevailing Wage AI","Contract Generator","Compliance Officer AI","Finance & Cash Flow AI","Permit Filing Agent","Estimating AI","Invoice & Collections AI","OSHA Compliance Agent"],
    "keyword":"concrete contractor software automation",
    "stats":[("$78K","avg annual savings","💰"),("26 hrs","saved per week","⏱️"),("100%","on-time lien filing","⚡"),("automated","mix order tracking","🚀")]
  },
  {
    "slug":"steel-fabricator","name":"Steel Fabricators","emoji":"🔩",
    "headline":"Fabricate Steel. Collect Every Dollar.","subhead":"From shop drawings to final payment, IronForge protects your receivables.",
    "pain":"Steel fabricators ship material weeks before installation and months before final payment — making lien rights and UCC filings critical to protecting millions in receivables.",
    "agents":["Lien Management AI","UCC Filing Agent","Contract Generator","Finance & Cash Flow AI","Invoice & Collections AI","Subcontractor Manager","Material Cost Tracker","Change Order Manager","Compliance Officer AI","Estimating AI"],
    "keyword":"steel fabricator lien rights software",
    "stats":[("$145K","avg annual savings","💰"),("35 hrs","saved per week","⏱️"),("UCC automated","material lien rights","⚡"),("100%","prelim notices filed","🚀")]
  },
  {
    "slug":"carpenter","name":"Carpentry Contractors","emoji":"🪵",
    "headline":"Skilled Work Deserves Full Payment","subhead":"IronForge protects every carpentry job with automated lien notices and airtight contracts.",
    "pain":"Carpenters often work as subcontractors and lose lien rights because paperwork wasn't filed correctly — especially on multi-family and commercial jobs with strict notice requirements.",
    "agents":["Preliminary Notice Agent","Lien Management AI","Contract Generator","Invoice & Collections AI","Payroll & Prevailing Wage AI","Finance & Cash Flow AI","Change Order Manager","Material Cost Tracker","OSHA Compliance Agent","Customer Communication AI"],
    "keyword":"carpentry contractor management software",
    "stats":[("$52K","avg annual savings","💰"),("19 hrs","saved per week","⏱️"),("same day","prelim notice filing","⚡"),("zero","lost lien rights","🚀")]
  },
  {
    "slug":"welder","name":"Welding Contractors","emoji":"🔥",
    "headline":"Your Craft is Welding. Our Craft is Getting You Paid.","subhead":"IronForge automates lien rights, payroll, and compliance for welding contractors.",
    "pain":"Welding contractors work on industrial and structural projects where payment is tied to complex milestone schedules — and missing a single notice can forfeit all rights to payment.",
    "agents":["Lien Management AI","Milestone Payment Tracker","Contract Generator","Payroll & Prevailing Wage AI","OSHA Compliance Agent","License & Bonding Tracker","Finance & Cash Flow AI","Invoice & Collections AI","Compliance Officer AI","Material Cost Tracker"],
    "keyword":"welding contractor software management",
    "stats":[("$63K","avg annual savings","💰"),("21 hrs","saved per week","⏱️"),("milestone","payment automation","⚡"),("zero","missed safety filings","🚀")]
  },
  {
    "slug":"demolition","name":"Demolition Contractors","emoji":"💥",
    "headline":"Demo the Job. Not Your Cash Flow.","subhead":"Permit filing, hazmat compliance, lien rights — IronForge runs demolition back offices.",
    "pain":"Demolition contractors face heavy regulatory requirements — asbestos surveys, DEP permits, air monitoring — and get paid last despite mobilizing first.",
    "agents":["Permit Filing Agent","Hazmat Compliance AI","Lien Management AI","OSHA Compliance Agent","Finance & Cash Flow AI","Contract Generator","Invoice & Collections AI","Environmental Compliance Agent","Payroll & Prevailing Wage AI","Estimating AI"],
    "keyword":"demolition contractor software compliance",
    "stats":[("$88K","avg annual savings","💰"),("32 hrs","saved per week","⏱️"),("automated","hazmat documentation","⚡"),("100%","permit filing on time","🚀")]
  },
  {
    "slug":"glass-glazier","name":"Glass & Glazier Contractors","emoji":"🪟",
    "headline":"Install Glass. Install Certainty of Payment.","subhead":"IronForge files your lien notices and tracks shop drawing approvals automatically.",
    "pain":"Glazing contractors deal with long lead times on custom glass orders and slow payment cycles — combined with strict shop drawing approval processes that delay installation.",
    "agents":["Lien Management AI","Submittal Tracking Agent","Material Cost Tracker","Contract Generator","Invoice & Collections AI","Finance & Cash Flow AI","Change Order Manager","Preliminary Notice Agent","Payroll & Prevailing Wage AI","Compliance Officer AI"],
    "keyword":"glazing contractor software management",
    "stats":[("$59K","avg annual savings","💰"),("20 hrs","saved per week","⏱️"),("automated","submittal tracking","⚡"),("zero","missed lien deadlines","🚀")]
  },
  {
    "slug":"insulation","name":"Insulation Contractors","emoji":"🧊",
    "headline":"Insulate Your Business from Unpaid Invoices","subhead":"Lien rights, compliance certs, and payroll — IronForge handles it all.",
    "pain":"Insulation contractors are among the earliest trades on a job but often last to receive payment — and the shortest lien windows in many states make timing critical.",
    "agents":["Preliminary Notice Agent","Lien Management AI","Payroll & Prevailing Wage AI","Contract Generator","Finance & Cash Flow AI","Invoice & Collections AI","Material Cost Tracker","License & Bonding Tracker","OSHA Compliance Agent","Compliance Officer AI"],
    "keyword":"insulation contractor lien management software",
    "stats":[("$46K","avg annual savings","💰"),("15 hrs","saved per week","⏱️"),("earliest","prelim notices in industry","⚡"),("100%","lien rights preserved","🚀")]
  },
  {
    "slug":"solar-installer","name":"Solar Installers","emoji":"☀️",
    "headline":"Clean Energy. Clean Books. Full Payment.","subhead":"IronForge automates solar project permitting, lien rights, and utility interconnection docs.",
    "pain":"Solar installers deal with utility interconnection agreements, AHJ permit delays, and incentive rebate documentation — all while waiting 120+ days for final payment on commercial jobs.",
    "agents":["Permit Filing Agent","Lien Management AI","Utility Interconnection Agent","Incentive Rebate Tracker","Contract Generator","Finance & Cash Flow AI","Invoice & Collections AI","License & Bonding Tracker","Compliance Officer AI","Estimating AI"],
    "keyword":"solar installer contractor software",
    "stats":[("$71K","avg annual savings","💰"),("24 hrs","saved per week","⏱️"),("automated","interconnection filings","⚡"),("100%","rebate documentation","🚀")]
  },
  {
    "slug":"elevator","name":"Elevator Contractors","emoji":"🛗",
    "headline":"Maintain Elevators. Not Paperwork Headaches.","subhead":"IronForge manages elevator inspection certs, maintenance contracts, and lien rights.",
    "pain":"Elevator contractors face one of the most regulated environments in construction — annual inspections, CAT tests, and state-specific licensing that creates constant compliance risk.",
    "agents":["Inspection Certificate Manager","License & Bonding Tracker","Compliance Officer AI","Contract Generator","Lien Management AI","Service Agreement Manager","Finance & Cash Flow AI","Invoice & Collections AI","Payroll & Prevailing Wage AI","Permit Filing Agent"],
    "keyword":"elevator contractor compliance management software",
    "stats":[("$92K","avg annual savings","💰"),("30 hrs","saved per week","⏱️"),("zero","missed inspections","⚡"),("automated","state licensing renewals","🚀")]
  },
  {
    "slug":"fire-protection","name":"Fire Protection Contractors","emoji":"🔥",
    "headline":"Protect Lives. Protect Your Cash Flow.","subhead":"Inspection reports, NFPA compliance, and lien rights — all automated by IronForge.",
    "pain":"Fire protection contractors must balance life-safety compliance with complex billing tied to multi-year service agreements and phased construction payments.",
    "agents":["NFPA Compliance Agent","Inspection Report Manager","Lien Management AI","Service Agreement Manager","Contract Generator","Finance & Cash Flow AI","License & Bonding Tracker","Invoice & Collections AI","Permit Filing Agent","Payroll & Prevailing Wage AI"],
    "keyword":"fire protection contractor software compliance",
    "stats":[("$84K","avg annual savings","💰"),("28 hrs","saved per week","⏱️"),("100%","NFPA documentation","⚡"),("automated","annual inspection scheduling","🚀")]
  },
  {
    "slug":"paving","name":"Paving Contractors","emoji":"🛣️",
    "headline":"Pave Roads. Collect Full Payment.","subhead":"Bonded projects, prevailing wage, and lien rights — IronForge handles all of it.",
    "pain":"Paving contractors work on public projects with Davis-Bacon prevailing wage requirements, bonded contracts, and certified payroll submissions that take hours every week.",
    "agents":["Certified Payroll Agent","Lien Management AI","Bond Claim Agent","Prevailing Wage Tracker","Contract Generator","Finance & Cash Flow AI","Invoice & Collections AI","Permit Filing Agent","OSHA Compliance Agent","Estimating AI"],
    "keyword":"paving contractor prevailing wage software",
    "stats":[("$98K","avg annual savings","💰"),("36 hrs","saved per week","⏱️"),("automated","certified payroll reports","⚡"),("zero","Davis-Bacon violations","🚀")]
  },
  {
    "slug":"waterproofing","name":"Waterproofing Contractors","emoji":"💧",
    "headline":"Waterproof Your Jobs. Waterproof Your Revenue.","subhead":"IronForge protects lien rights on every waterproofing project — automatically.",
    "pain":"Waterproofing contractors often work underground or in post-construction phases — making payment disputes common and lien rights the last line of defense.",
    "agents":["Lien Management AI","Preliminary Notice Agent","Contract Generator","Invoice & Collections AI","Finance & Cash Flow AI","Material Cost Tracker","Change Order Manager","Payroll & Prevailing Wage AI","Compliance Officer AI","Customer Communication AI"],
    "keyword":"waterproofing contractor software management",
    "stats":[("$57K","avg annual savings","💰"),("19 hrs","saved per week","⏱️"),("100%","prelim notices filed","⚡"),("zero","expired lien rights","🚀")]
  },
  {
    "slug":"millwork","name":"Millwork Contractors","emoji":"🪚",
    "headline":"Custom Work Demands Custom Protection","subhead":"IronForge tracks shop drawings, milestone payments, and lien rights for millwork shops.",
    "pain":"Millwork contractors manufacture months before installation and ship irreplaceable custom pieces — making UCC filings and lien rights on stored materials critically important.",
    "agents":["Lien Management AI","UCC Filing Agent","Submittal Tracking Agent","Material Cost Tracker","Contract Generator","Finance & Cash Flow AI","Invoice & Collections AI","Change Order Manager","Payroll & Prevailing Wage AI","Estimating AI"],
    "keyword":"millwork contractor lien rights software",
    "stats":[("$76K","avg annual savings","💰"),("25 hrs","saved per week","⏱️"),("UCC automated","stored material protection","⚡"),("100%","shop drawing tracking","🚀")]
  },
  {
    "slug":"plastering","name":"Plastering Contractors","emoji":"🏛️",
    "headline":"Plaster Walls. Plaster-Proof Your Revenue.","subhead":"Lien waivers, conditional releases, and payroll — all handled by IronForge.",
    "pain":"Plastering contractors are downstream subcontractors who sign conditional lien waivers without realizing they've given up payment rights — IronForge stops that.",
    "agents":["Conditional Waiver Generator","Lien Management AI","Preliminary Notice Agent","Contract Generator","Invoice & Collections AI","Payroll & Prevailing Wage AI","Finance & Cash Flow AI","Material Cost Tracker","Change Order Manager","Compliance Officer AI"],
    "keyword":"plastering contractor software lien waivers",
    "stats":[("$49K","avg annual savings","💰"),("17 hrs","saved per week","⏱️"),("zero","improper lien waivers","⚡"),("automated","payment releases","🚀")]
  },
  {
    "slug":"tile-setter","name":"Tile Contractors","emoji":"🔲",
    "headline":"Set Tile. Set Your Payments on Autopilot.","subhead":"IronForge automates lien rights and invoicing for tile installation contractors.",
    "pain":"Tile contractors work on residential and commercial jobs with GCs who routinely withhold retainage past substantial completion — often years before final payment.",
    "agents":["Lien Management AI","Retainage Tracker","Invoice & Collections AI","Contract Generator","Finance & Cash Flow AI","Preliminary Notice Agent","Change Order Manager","Payroll & Prevailing Wage AI","Material Cost Tracker","Customer Communication AI"],
    "keyword":"tile contractor software invoice management",
    "stats":[("$44K","avg annual savings","💰"),("15 hrs","saved per week","⏱️"),("automated","retainage release notices","⚡"),("zero","missed lien deadlines","🚀")]
  },
  {
    "slug":"cabinet-maker","name":"Cabinet & Millwork","emoji":"🗄️",
    "headline":"Craft Cabinetry. Collect Every Invoice.","subhead":"IronForge handles deposits, progress billing, and lien rights for cabinet shops.",
    "pain":"Cabinet makers collect deposits but often lose final payment after installation — when GCs link payment to punch lists that never close.",
    "agents":["Invoice & Collections AI","Punch List Manager","Lien Management AI","Contract Generator","Finance & Cash Flow AI","Material Cost Tracker","Change Order Manager","Payroll & Prevailing Wage AI","Customer Communication AI","Estimating AI"],
    "keyword":"cabinet maker contractor software",
    "stats":[("$41K","avg annual savings","💰"),("14 hrs","saved per week","⏱️"),("100%","punch list documentation","⚡"),("automated","progress billing","🚀")]
  },
  {
    "slug":"fencing","name":"Fencing Contractors","emoji":"🏗️",
    "headline":"Install Fences. Block Unpaid Invoices.","subhead":"IronForge files lien notices and automates invoicing for fencing contractors.",
    "pain":"Fencing contractors on commercial sites face GCs who treat them as low-priority subcontractors — making lien rights the only real leverage for getting paid on time.",
    "agents":["Lien Management AI","Invoice & Collections AI","Preliminary Notice Agent","Contract Generator","Finance & Cash Flow AI","Material Cost Tracker","Payroll & Prevailing Wage AI","License & Bonding Tracker","Change Order Manager","Customer Communication AI"],
    "keyword":"fencing contractor software management",
    "stats":[("$38K","avg annual savings","💰"),("13 hrs","saved per week","⏱️"),("same day","prelim notice filing","⚡"),("zero","lost lien rights","🚀")]
  },
  {
    "slug":"pool-builder","name":"Pool Builders","emoji":"🏊",
    "headline":"Build Dream Pools. Not Cash Flow Nightmares.","subhead":"IronForge automates lien rights, deposit management, and punch list collections for pool builders.",
    "pain":"Pool builders collect large deposits but face homeowners who withhold final payment over punch-list items — while expensive equipment sits installed and unpaid for.",
    "agents":["Lien Management AI","Deposit Management AI","Punch List Manager","Invoice & Collections AI","Contract Generator","Finance & Cash Flow AI","License & Bonding Tracker","Permit Filing Agent","Customer Communication AI","Change Order Manager"],
    "keyword":"pool builder contractor software",
    "stats":[("$67K","avg annual savings","💰"),("22 hrs","saved per week","⏱️"),("automated","deposit schedules","⚡"),("zero","punch list disputes","🚀")]
  },
  {
    "slug":"signage","name":"Sign & Signage Contractors","emoji":"🪧",
    "headline":"Install Signs. Send Invoices Automatically.","subhead":"IronForge manages permits, lien rights, and billing for signage contractors.",
    "pain":"Signage contractors navigate complex municipal permit processes and deal with property owners who delay payment after sign installation is complete.",
    "agents":["Permit Filing Agent","Lien Management AI","Invoice & Collections AI","Contract Generator","Finance & Cash Flow AI","Material Cost Tracker","License & Bonding Tracker","Change Order Manager","Customer Communication AI","Payroll & Prevailing Wage AI"],
    "keyword":"signage contractor permit software",
    "stats":[("$36K","avg annual savings","💰"),("12 hrs","saved per week","⏱️"),("automated","permit applications","⚡"),("zero","missed lien deadlines","🚀")]
  },
  {
    "slug":"excavation","name":"Excavation Contractors","emoji":"🚜",
    "headline":"Move Earth. Not Mountains of Paperwork.","subhead":"IronForge automates bonded project compliance, lien rights, and equipment tracking.",
    "pain":"Excavation contractors mobilize first on every project — but get paid last. Bonded public jobs add prevailing wage and certified payroll requirements that eat hours every week.",
    "agents":["Lien Management AI","Certified Payroll Agent","Prevailing Wage Tracker","Bond Claim Agent","Finance & Cash Flow AI","Contract Generator","OSHA Compliance Agent","Equipment Tracking AI","Invoice & Collections AI","Estimating AI"],
    "keyword":"excavation contractor software compliance",
    "stats":[("$107K","avg annual savings","💰"),("38 hrs","saved per week","⏱️"),("automated","certified payroll","⚡"),("zero","bond claim missed","🚀")]
  },
  {
    "slug":"scaffolding","name":"Scaffolding Contractors","emoji":"🏗️",
    "headline":"Scaffold Jobs. Scaffold Your Cash Flow.","subhead":"Safety compliance, rental billing, and lien rights — IronForge runs scaffolding operations.",
    "pain":"Scaffolding contractors rent equipment on projects that run over schedule — creating billing disputes over rental extensions and safety compliance requirements that shift daily.",
    "agents":["Lien Management AI","Equipment Rental Billing AI","OSHA Compliance Agent","Invoice & Collections AI","Contract Generator","Finance & Cash Flow AI","Safety Documentation Agent","Payroll & Prevailing Wage AI","License & Bonding Tracker","Material Cost Tracker"],
    "keyword":"scaffolding contractor safety compliance software",
    "stats":[("$72K","avg annual savings","💰"),("24 hrs","saved per week","⏱️"),("automated","rental billing","⚡"),("100%","OSHA documentation","🚀")]
  },
  {
    "slug":"mechanical","name":"Mechanical Contractors","emoji":"⚙️",
    "headline":"Engineer Excellence. Automate the Rest.","subhead":"IronForge handles mechanical contractor compliance, payroll, and lien rights end-to-end.",
    "pain":"Mechanical contractors on large commercial jobs deal with complex subcontractor tiers, certified payroll, and milestone payment schedules that require precise documentation.",
    "agents":["Lien Management AI","Certified Payroll Agent","Subcontractor Manager","Contract Generator","Finance & Cash Flow AI","Compliance Officer AI","Invoice & Collections AI","Permit Filing Agent","OSHA Compliance Agent","Estimating AI"],
    "keyword":"mechanical contractor software management",
    "stats":[("$118K","avg annual savings","💰"),("40 hrs","saved per week","⏱️"),("automated","subcontractor compliance","⚡"),("zero","payroll violations","🚀")]
  },
  {
    "slug":"survey","name":"Surveying Contractors","emoji":"📐",
    "headline":"Survey Land. Survey Your Business Health.","subhead":"IronForge automates billing, licensing, and project management for surveying firms.",
    "pain":"Surveying firms deal with retainer agreements, milestone billing tied to deliverables, and state licensing renewals that create administrative burden on small teams.",
    "agents":["Invoice & Collections AI","License & Bonding Tracker","Contract Generator","Finance & Cash Flow AI","Milestone Payment Tracker","Payroll & Prevailing Wage AI","Compliance Officer AI","Customer Communication AI","Estimating AI","Service Agreement Manager"],
    "keyword":"surveying contractor software billing",
    "stats":[("$53K","avg annual savings","💰"),("18 hrs","saved per week","⏱️"),("automated","milestone billing","⚡"),("zero","license renewal gaps","🚀")]
  },
  {
    "slug":"environmental","name":"Environmental Contractors","emoji":"🌱",
    "headline":"Remediate Sites. Not Your Bank Account.","subhead":"IronForge handles EPA compliance docs, bonded project billing, and lien rights for environmental contractors.",
    "pain":"Environmental contractors face the most complex regulatory landscape in construction — EPA permits, state environmental permits, certified payroll on public sites, and bonded contracts.",
    "agents":["Environmental Compliance Agent","Permit Filing Agent","Certified Payroll Agent","Lien Management AI","Bond Claim Agent","Finance & Cash Flow AI","Contract Generator","Invoice & Collections AI","OSHA Compliance Agent","Compliance Officer AI"],
    "keyword":"environmental contractor compliance software",
    "stats":[("$124K","avg annual savings","💰"),("42 hrs","saved per week","⏱️"),("EPA docs","fully automated","⚡"),("zero","compliance violations","🚀")]
  },
]

SECTORS = [
  {
    "slug":"residential","name":"Residential Construction","emoji":"🏠",
    "headline":"Win More Residential Jobs. Collect Every Dollar.","subhead":"IronForge automates homeowner contracts, deposit management, lien rights, and punch list collections for residential builders and remodelers.",
    "pain":"Residential contractors deal with homeowners who change their minds, dispute final invoices, and withhold payment for punch-list items that never seem to close.",
    "agents":["Homeowner Contract Generator","Lien Management AI","Deposit Management AI","Punch List Manager","Invoice & Collections AI","Finance & Cash Flow AI","Permit Filing Agent","Change Order Manager","Customer Communication AI","License & Bonding Tracker"],
    "keyword":"residential contractor software management",
    "stats":[("$58K","avg annual savings","💰"),("20 hrs","saved per week","⏱️"),("zero","punch list disputes","⚡"),("automated","homeowner communication","🚀")]
  },
  {
    "slug":"commercial","name":"Commercial Construction","emoji":"🏢",
    "headline":"Win Commercial Projects. Get Paid on Every Phase.","subhead":"IronForge manages lien rights, retainage releases, and certified payroll across all your commercial jobs.",
    "pain":"Commercial construction involves AIA contracts, complex retainage structures, certified payroll on prevailing wage jobs, and payment chains that can run 6 months deep.",
    "agents":["AIA Contract Manager","Lien Management AI","Retainage Tracker","Certified Payroll Agent","Subcontractor Manager","Finance & Cash Flow AI","Compliance Officer AI","Invoice & Collections AI","Change Order Manager","Estimating AI"],
    "keyword":"commercial construction software management",
    "stats":[("$185K","avg annual savings","💰"),("50 hrs","saved per week","⏱️"),("automated","AIA pay apps","⚡"),("zero","retainage disputes","🚀")]
  },
  {
    "slug":"industrial","name":"Industrial Construction","emoji":"🏭",
    "headline":"Build Industrial. Run Tight Operations.","subhead":"IronForge handles bonded project compliance, union payroll, and lien rights on industrial projects.",
    "pain":"Industrial construction projects involve union labor agreements, safety compliance at a different scale, and complex payment structures tied to commissioning milestones.",
    "agents":["Certified Payroll Agent","Union Compliance AI","OSHA Compliance Agent","Lien Management AI","Bond Claim Agent","Finance & Cash Flow AI","Contract Generator","Invoice & Collections AI","Environmental Compliance Agent","Milestone Payment Tracker"],
    "keyword":"industrial construction software compliance",
    "stats":[("$220K","avg annual savings","💰"),("60 hrs","saved per week","⏱️"),("automated","union payroll compliance","⚡"),("zero","OSHA violations","🚀")]
  },
  {
    "slug":"government","name":"Government & Public Works","emoji":"🏛️",
    "headline":"Win Government Contracts. Master the Compliance.","subhead":"IronForge automates certified payroll, bond claims, and Davis-Bacon compliance on public works projects.",
    "pain":"Government projects require certified payroll weekly, Davis-Bacon wage determinations, ADA compliance documentation, and bond claim procedures that most contractors get wrong.",
    "agents":["Certified Payroll Agent","Davis-Bacon Compliance AI","Bond Claim Agent","Lien Management AI","Prevailing Wage Tracker","Contract Generator","Finance & Cash Flow AI","OSHA Compliance Agent","Permit Filing Agent","Compliance Officer AI"],
    "keyword":"government contractor prevailing wage software",
    "stats":[("$175K","avg annual savings","💰"),("55 hrs","saved per week","⏱️"),("automated","weekly certified payroll","⚡"),("zero","Davis-Bacon violations","🚀")]
  },
  {
    "slug":"healthcare","name":"Healthcare Construction","emoji":"🏥",
    "headline":"Build Healthcare Facilities. Zero Compliance Risk.","subhead":"IronForge manages infection control documentation, HIPAA compliance, and healthcare-specific construction permits.",
    "pain":"Healthcare construction involves ICRA documentation, ILSM protocols, and regulatory requirements from Joint Commission, CMS, and state health departments on every project.",
    "agents":["ICRA Documentation Agent","Compliance Officer AI","Permit Filing Agent","Lien Management AI","Contract Generator","Finance & Cash Flow AI","Invoice & Collections AI","OSHA Compliance Agent","Subcontractor Manager","Certified Payroll Agent"],
    "keyword":"healthcare construction contractor software",
    "stats":[("$192K","avg annual savings","💰"),("58 hrs","saved per week","⏱️"),("automated","ICRA documentation","⚡"),("zero","compliance violations","🚀")]
  },
  {
    "slug":"education","name":"Education & School Construction","emoji":"🏫",
    "headline":"Build Schools. Master the Paperwork.","subhead":"IronForge handles bonded school projects, prevailing wage, and DSA compliance for education construction.",
    "pain":"School construction projects require Division of State Architect approvals, bonded contracts, prevailing wage compliance, and extended warranty documentation — all at once.",
    "agents":["DSA Compliance Agent","Certified Payroll Agent","Bond Claim Agent","Lien Management AI","Prevailing Wage Tracker","Contract Generator","Finance & Cash Flow AI","Invoice & Collections AI","Permit Filing Agent","Compliance Officer AI"],
    "keyword":"school construction contractor compliance software",
    "stats":[("$156K","avg annual savings","💰"),("48 hrs","saved per week","⏱️"),("automated","DSA submissions","⚡"),("zero","prevailing wage violations","🚀")]
  },
  {
    "slug":"hospitality","name":"Hospitality Construction","emoji":"🏨",
    "headline":"Build Hotels & Resorts. Get Paid Faster.","subhead":"IronForge manages FF&E coordination, brand standard compliance, and lien rights on hospitality projects.",
    "pain":"Hospitality construction involves brand standard compliance documentation, FF&E coordination with owner-supplied equipment, and hotel flags that add layers of approval to every payment.",
    "agents":["Brand Standard Compliance AI","FF&E Coordination Agent","Lien Management AI","Contract Generator","Finance & Cash Flow AI","Invoice & Collections AI","Change Order Manager","Subcontractor Manager","Retainage Tracker","Customer Communication AI"],
    "keyword":"hospitality construction contractor software",
    "stats":[("$167K","avg annual savings","💰"),("52 hrs","saved per week","⏱️"),("automated","brand compliance docs","⚡"),("zero","FF&E disputes","🚀")]
  },
  {
    "slug":"retail","name":"Retail & Tenant Improvement","emoji":"🏪",
    "headline":"TI Projects Delivered. Invoices Collected.","subhead":"IronForge automates tenant improvement allowance tracking, lien rights, and landlord compliance for retail construction.",
    "pain":"Retail TI contractors deal with landlord approval processes, tenant improvement allowance reconciliation, and strict punch-list requirements before TIA is released.",
    "agents":["TIA Tracking Agent","Lien Management AI","Invoice & Collections AI","Contract Generator","Finance & Cash Flow AI","Punch List Manager","Change Order Manager","Permit Filing Agent","Customer Communication AI","Estimating AI"],
    "keyword":"retail tenant improvement contractor software",
    "stats":[("$88K","avg annual savings","💰"),("30 hrs","saved per week","⏱️"),("automated","TIA reconciliation","⚡"),("zero","punch list disputes","🚀")]
  },
  {
    "slug":"infrastructure","name":"Infrastructure Construction","emoji":"🌉",
    "headline":"Build Infrastructure. Build Predictable Revenue.","subhead":"IronForge handles federal compliance, certified payroll, and bond claims on infrastructure projects.",
    "pain":"Infrastructure projects involve federal funding compliance, Buy American requirements, NEPA documentation, and monthly pay applications that require perfect documentation.",
    "agents":["Federal Compliance Agent","Buy American Compliance AI","Certified Payroll Agent","Bond Claim Agent","Lien Management AI","Finance & Cash Flow AI","Contract Generator","OSHA Compliance Agent","Invoice & Collections AI","Environmental Compliance Agent"],
    "keyword":"infrastructure construction contractor compliance",
    "stats":[("$248K","avg annual savings","💰"),("65 hrs","saved per week","⏱️"),("automated","federal pay apps","⚡"),("zero","Buy America violations","🚀")]
  },
  {
    "slug":"energy","name":"Energy & Power Construction","emoji":"⚡",
    "headline":"Power Projects. Power Your Collections.","subhead":"IronForge automates utility compliance, bonded project filings, and lien rights for energy construction.",
    "pain":"Energy construction — solar farms, substations, battery storage — involves utility interconnection agreements, FERC compliance, and complex milestone payment structures.",
    "agents":["Utility Compliance Agent","Permit Filing Agent","Lien Management AI","Certified Payroll Agent","Bond Claim Agent","Finance & Cash Flow AI","Contract Generator","Environmental Compliance Agent","Invoice & Collections AI","Milestone Payment Tracker"],
    "keyword":"energy construction contractor compliance software",
    "stats":[("$234K","avg annual savings","💰"),("62 hrs","saved per week","⏱️"),("automated","interconnection filings","⚡"),("zero","FERC violations","🚀")]
  },
  {
    "slug":"telecom","name":"Telecom & Data Center Construction","emoji":"📡",
    "headline":"Build Networks. Build Bulletproof Invoicing.","subhead":"IronForge manages lien rights, structured cabling documentation, and closeout packages for telecom contractors.",
    "pain":"Telecom contractors work inside existing buildings with strict testing and documentation requirements — and GCs withhold payment until every cable is tested and certified.",
    "agents":["Testing Documentation Agent","Lien Management AI","Invoice & Collections AI","Contract Generator","Finance & Cash Flow AI","License & Bonding Tracker","Closeout Package Agent","Change Order Manager","Subcontractor Manager","Compliance Officer AI"],
    "keyword":"telecom contractor documentation software",
    "stats":[("$94K","avg annual savings","💰"),("32 hrs","saved per week","⏱️"),("automated","cable test documentation","⚡"),("zero","closeout disputes","🚀")]
  },
  {
    "slug":"marine","name":"Marine & Waterfront Construction","emoji":"⚓",
    "headline":"Build on Water. Get Paid on Land.","subhead":"IronForge handles Coast Guard permits, tidal waivers, and lien rights for marine construction.",
    "pain":"Marine contractors deal with USACE permits, Coast Guard approvals, tidal work windows, and insurance requirements that are 3x more complex than land-based construction.",
    "agents":["USACE Permit Agent","Coast Guard Compliance AI","Lien Management AI","Environmental Compliance Agent","Contract Generator","Finance & Cash Flow AI","Insurance Certificate Tracker","Invoice & Collections AI","OSHA Compliance Agent","Permit Filing Agent"],
    "keyword":"marine construction contractor permits software",
    "stats":[("$178K","avg annual savings","💰"),("56 hrs","saved per week","⏱️"),("automated","USACE permit tracking","⚡"),("zero","tidal work violations","🚀")]
  },
]

CSS = """<style>
:root{--r:#ff3a2d;--r2:#cc2018;--c:#ff2045;--c2:#cc1035;--n:#04081a;--n2:#080f24;--n3:#0d1835;--g:#00ff88;--t:#e8edf5;--t2:#7a8aaa;--bdr:rgba(255,58,45,0.18);}
*{margin:0;padding:0;box-sizing:border-box;}
body{background:var(--n);color:var(--t);font-family:'Segoe UI',system-ui,sans-serif;line-height:1.7;overflow-x:hidden;}
a{text-decoration:none;color:inherit;}
.container{max-width:1140px;margin:0 auto;padding:0 24px;}
.btn-r{padding:14px 28px;background:linear-gradient(135deg,var(--r),var(--r2));color:#fff;border-radius:10px;font-size:15px;font-weight:800;border:none;cursor:pointer;display:inline-block;transition:all .2s;}
.btn-r:hover{transform:translateY(-2px);box-shadow:0 12px 32px rgba(255,58,45,.45);}
.btn-ghost{padding:13px 26px;border:1.5px solid var(--bdr);border-radius:10px;font-size:14px;font-weight:600;color:var(--t2);display:inline-block;transition:all .2s;}
.btn-ghost:hover{border-color:var(--r);color:var(--r);}
/* NAV */
.topnav{background:rgba(4,8,26,.95);backdrop-filter:blur(20px);border-bottom:1px solid var(--bdr);padding:0 24px;height:60px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:100;}
.tn-logo{display:flex;align-items:center;gap:10px;}
.tn-hex{width:36px;height:36px;background:linear-gradient(135deg,var(--r),var(--c));clip-path:polygon(50% 0%,93% 25%,93% 75%,50% 100%,7% 75%,7% 25%);display:flex;align-items:center;justify-content:center;font-weight:900;font-size:14px;color:#fff;}
.tn-name{font-size:15px;font-weight:900;color:#fff;letter-spacing:.5px;}
.tn-sub{font-size:9px;color:var(--t2);letter-spacing:2px;text-transform:uppercase;}
.tn-btns{display:flex;gap:10px;align-items:center;}
.tn-back{font-size:12px;color:var(--t2);padding:6px 12px;border:1px solid var(--bdr);border-radius:6px;transition:all .2s;}
.tn-back:hover{color:var(--r);border-color:var(--r);}
/* HERO */
.hero{padding:80px 0 60px;position:relative;overflow:hidden;}
.hero::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse at 70% 40%,rgba(255,58,45,.09),transparent 60%),radial-gradient(ellipse at 20% 80%,rgba(255,32,69,.05),transparent 50%);}
.hero-tag{display:inline-flex;align-items:center;gap:6px;padding:5px 14px;background:rgba(255,58,45,.08);border:1px solid rgba(255,58,45,.25);border-radius:20px;font-size:11px;font-weight:700;color:var(--r);text-transform:uppercase;letter-spacing:1.5px;margin-bottom:22px;}
.hero-h1{font-size:clamp(2.2rem,5vw,3.8rem);font-weight:900;line-height:1.1;margin-bottom:20px;}
.hero-h1 .hl{background:linear-gradient(90deg,var(--r),#ff7a6d);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;}
.hero-sub{font-size:1.18rem;color:var(--t2);max-width:640px;margin-bottom:32px;line-height:1.6;}
.hero-btns{display:flex;gap:14px;flex-wrap:wrap;margin-bottom:48px;}
.hero-pain{background:var(--n2);border-left:3px solid var(--r);border-radius:0 10px 10px 0;padding:18px 24px;max-width:660px;color:var(--t2);font-size:.93rem;line-height:1.7;margin-bottom:32px;}
.hero-pain strong{color:var(--t);}
/* STATS */
.stats-row{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin:48px 0;}
.stat-box{background:var(--n3);border:1px solid var(--bdr);border-radius:12px;padding:22px 18px;text-align:center;}
.stat-val{font-size:2rem;font-weight:900;color:var(--r);line-height:1;}
.stat-icon{font-size:1.3rem;margin-bottom:6px;}
.stat-lbl{font-size:.78rem;color:var(--t2);margin-top:4px;}
/* AGENTS */
.agents-section{padding:64px 0;background:var(--n2);}
.sec-title{font-size:1.7rem;font-weight:900;margin-bottom:8px;}
.sec-sub{color:var(--t2);font-size:.95rem;margin-bottom:36px;}
.agents-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:14px;}
.agent-card{background:var(--n3);border:1px solid var(--bdr);border-radius:12px;padding:18px;transition:all .2s;}
.agent-card:hover{border-color:rgba(255,58,45,.4);transform:translateY(-3px);box-shadow:0 12px 32px rgba(0,0,0,.5);}
.ag-icon{font-size:1.6rem;margin-bottom:8px;}
.ag-name{font-size:.88rem;font-weight:700;color:var(--t);margin-bottom:4px;}
.ag-desc{font-size:.78rem;color:var(--t2);line-height:1.4;}
.ag-btn{margin-top:10px;padding:6px 12px;background:linear-gradient(135deg,var(--r),var(--r2));color:#fff;border:none;border-radius:6px;font-size:.75rem;font-weight:700;cursor:pointer;display:inline-block;transition:all .2s;}
.ag-btn:hover{transform:translateY(-1px);box-shadow:0 6px 16px rgba(255,58,45,.35);}
/* HOW */
.how-section{padding:64px 0;}
.steps{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:20px;margin-top:36px;}
.step{text-align:center;padding:28px 20px;}
.step-num{width:48px;height:48px;border-radius:50%;background:linear-gradient(135deg,var(--r),var(--c));color:#fff;font-weight:900;font-size:1.1rem;display:flex;align-items:center;justify-content:center;margin:0 auto 14px;}
.step-title{font-weight:700;margin-bottom:6px;font-size:.95rem;}
.step-desc{font-size:.82rem;color:var(--t2);line-height:1.5;}
/* CTA */
.cta-section{padding:80px 0;background:linear-gradient(135deg,var(--n2),rgba(255,58,45,.04));}
.cta-box{background:var(--n3);border:1px solid var(--bdr);border-radius:20px;padding:56px;text-align:center;position:relative;overflow:hidden;}
.cta-box::before{content:'';position:absolute;top:-60px;right:-60px;width:200px;height:200px;background:radial-gradient(circle,rgba(255,58,45,.12),transparent 70%);pointer-events:none;}
.cta-title{font-size:2.2rem;font-weight:900;margin-bottom:12px;}
.cta-sub{color:var(--t2);font-size:1rem;margin-bottom:32px;}
.cta-btns{display:flex;gap:16px;justify-content:center;flex-wrap:wrap;}
.cta-phone{font-size:1.3rem;font-weight:800;color:var(--r);margin-top:20px;display:block;}
/* TESTIMONIAL */
.testimonial{padding:64px 0;background:var(--n2);}
.testi-card{max-width:780px;margin:0 auto;background:var(--n3);border:1px solid var(--bdr);border-radius:16px;padding:36px;position:relative;}
.testi-card::before{content:open-quote;font-size:5rem;color:var(--r);opacity:.25;position:absolute;top:10px;left:24px;line-height:1;font-family:Georgia,serif;}
.testi-text{font-size:1.05rem;line-height:1.7;color:var(--t);margin-bottom:20px;padding-left:16px;}
.testi-name{font-weight:700;color:var(--r);}
.testi-role{font-size:.82rem;color:var(--t2);}
/* FOOTER */
.page-footer{background:#02040e;border-top:1px solid var(--bdr);padding:32px 24px;text-align:center;}
.pf-links{display:flex;gap:20px;justify-content:center;flex-wrap:wrap;margin-bottom:16px;}
.pf-links a{font-size:.83rem;color:var(--t2);transition:color .2s;}
.pf-links a:hover{color:var(--r);}
.pf-copy{font-size:.78rem;color:var(--t2);}
@media(max-width:700px){.stats-row{grid-template-columns:1fr 1fr;}.hero-h1{font-size:2rem;}.cta-box{padding:32px 20px;}}
</style>"""

AGENT_ICONS = {
  "Lien Management AI":"⚖️","Contract Generator":"📄","Subcontractor Manager":"👷","Project Scheduler":"📅",
  "Finance & Cash Flow AI":"💰","Compliance Officer AI":"✅","Estimating AI":"📊","Change Order Manager":"🔄",
  "Insurance Certificate Tracker":"🛡️","Permit Filing Agent":"📋","License & Bonding Tracker":"🏅",
  "OSHA Compliance Agent":"⛑️","Invoice & Collections AI":"📨","Payroll & Prevailing Wage AI":"💵",
  "Preliminary Notice Agent":"📬","Certified Payroll Agent":"📑","Bond Claim Agent":"🔗",
  "Retainage Tracker":"⏳","Conditional Waiver Generator":"✍️","Material Cost Tracker":"📦",
  "Customer Communication AI":"💬","Service Agreement Manager":"🤝","Crew Scheduling AI":"🗓️",
  "Punch List Manager":"📝","Milestone Payment Tracker":"🎯","UCC Filing Agent":"📜",
  "Submittal Tracking Agent":"📁","Equipment Tracking AI":"🚛","Equipment Rental Billing AI":"🏗️",
  "Hazmat Compliance AI":"☢️","Environmental Compliance Agent":"🌿","Safety Documentation Agent":"🦺",
  "Insurance Claim AI":"📊","Deposit Management AI":"🏦","AIA Contract Manager":"📋",
  "Union Compliance AI":"🤝","Davis-Bacon Compliance AI":"🏛️","Prevailing Wage Tracker":"💹",
  "DSA Compliance Agent":"🏫","ICRA Documentation Agent":"🏥","TIA Tracking Agent":"🏪",
  "Federal Compliance Agent":"🦅","Buy American Compliance AI":"🇺🇸","USACE Permit Agent":"⚓",
  "Coast Guard Compliance AI":"⛵","Utility Compliance Agent":"⚡","Incentive Rebate Tracker":"💡",
  "Utility Interconnection Agent":"🔌","NFPA Compliance Agent":"🔥","Inspection Certificate Manager":"🔍",
  "Inspection Report Manager":"📋","Testing Documentation Agent":"🧪","Closeout Package Agent":"📦",
  "Brand Standard Compliance AI":"🏨","FF&E Coordination Agent":"🛋️","Seasonal Scheduling AI":"🌡️",
  "Homeowner Contract Generator":"🏠","Milestone Payment Tracker":"🎯","Deposit Management AI":"🏦",
}

AGENT_DESCS = {
  "Lien Management AI":"Files mechanics liens, preliminary notices & bond claims in all 50 states automatically.",
  "Contract Generator":"Generates airtight construction contracts, change orders & subcontractor agreements.",
  "Subcontractor Manager":"Tracks subs, certifications, insurance certs & payment status in one dashboard.",
  "Finance & Cash Flow AI":"Monitors cash flow, flags shortfalls & forecasts revenue 90 days out.",
  "Estimating AI":"Builds detailed estimates from scope descriptions with real material & labor costs.",
  "Payroll & Prevailing Wage AI":"Runs payroll, calculates prevailing wages & generates certified payroll reports.",
  "Invoice & Collections AI":"Sends invoices automatically & follows up on overdue payments with escalating notices.",
  "Permit Filing Agent":"Tracks permit requirements by jurisdiction & files applications automatically.",
  "OSHA Compliance Agent":"Maintains all OSHA logs, incident reports & safety training records.",
  "License & Bonding Tracker":"Alerts you 60 days before any license, bond or insurance policy expires.",
  "Compliance Officer AI":"Monitors all regulatory requirements & flags upcoming compliance deadlines.",
  "Change Order Manager":"Documents every scope change, gets digital approval & updates the contract automatically.",
  "Preliminary Notice Agent":"Files preliminary notices the same day you're awarded a job to protect lien rights.",
  "Certified Payroll Agent":"Generates weekly certified payroll reports in the exact format required for public projects.",
  "Bond Claim Agent":"Prepares and files payment bond claims when payment is withheld on bonded projects.",
  "Retainage Tracker":"Monitors retainage on every job and sends release demands at substantial completion.",
  "Material Cost Tracker":"Tracks material orders, price changes & invoices against your budget in real time.",
  "Customer Communication AI":"Handles all routine client communication — status updates, approvals & follow-ups.",
  "Service Agreement Manager":"Manages recurring maintenance contracts, renewal reminders & service billing.",
  "Crew Scheduling AI":"Optimizes crew assignments across jobs based on skills, location & availability.",
  "Insurance Certificate Tracker":"Collects, stores & tracks expiration dates for all sub and vendor insurance certs.",
  "Punch List Manager":"Creates digital punch lists, assigns items to subs & tracks completion to unlock payment.",
}

def get_agent_desc(name):
  for k, v in AGENT_DESCS.items():
    if k.lower() in name.lower() or name.lower() in k.lower():
      return v
  return "AI-powered automation for your specific back-office workflow."

def get_icon(name):
  for k, v in AGENT_ICONS.items():
    if k.lower() in name.lower() or name.lower() in k.lower():
      return v
  return "🤖"

def build_page(item, ptype):
  slug = item["slug"]
  folder = f"trades" if ptype=="trade" else "sectors"
  
  agents_html = ""
  for ag in item["agents"]:
    icon = get_icon(ag)
    desc = get_agent_desc(ag)
    agents_html += f"""
      <div class="agent-card">
        <div class="ag-icon">{icon}</div>
        <div class="ag-name">{ag}</div>
        <div class="ag-desc">{desc}</div>
        <a href="../{ADMIN}?agent={ag.lower().replace(' ','-')}" class="ag-btn">Run Agent →</a>
      </div>"""

  stats_html = ""
  for val, lbl, icon in item["stats"]:
    stats_html += f"""
      <div class="stat-box">
        <div class="stat-icon">{icon}</div>
        <div class="stat-val">{val}</div>
        <div class="stat-lbl">{lbl}</div>
      </div>"""

  testimonial_name = f"Owner, {item['name'].split()[0]} Company"
  testimonial_text = f"Before IronForge, I was spending half my Sunday doing paperwork. Now the platform files my lien notices, runs my payroll, and follows up on invoices automatically. I got paid $47K faster in the first 90 days."

  html = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{item['name']} AI Software | IronForge | AACG Platform</title>
<meta name="description" content="IronForge AI platform for {item['name'].lower()}. Automate lien filing, contracts, payroll, and compliance. Save {item['stats'][0][0]} per year. Free 14-day trial.">
<meta name="keywords" content="{item['keyword']}, lien management {item['name'].lower()}, {item['name'].lower()} automation, construction AI software">
<meta property="og:title" content="{item['name']} AI Software | IronForge">
<meta property="og:description" content="AI-powered back office for {item['name'].lower()}. File liens, run payroll, generate contracts — automatically.">
<meta property="og:type" content="website">
<link rel="icon" type="image/svg+xml" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><polygon points='50,2 93,26 93,74 50,98 7,74 7,26' fill='%23ff3a2d'/><text y='.9em' font-size='55' x='26' fill='white' font-weight='900'>⚡</text></svg>">
<script type="application/ld+json">
{{"@context":"https://schema.org","@type":"SoftwareApplication","name":"IronForge AACG Platform","applicationCategory":"BusinessApplication","operatingSystem":"Web","audience":{{"@type":"Audience","audienceType":"{item['name']}"}},"offers":{{"@type":"Offer","price":"49","priceCurrency":"USD","priceValidUntil":"2026-12-31"}},"description":"AI-powered construction back office software for {item['name'].lower()}."}}
</script>
{CSS}
</head>
<body>
<nav class="topnav">
  <a href="../aacg-website.html" class="tn-logo">
    <div class="tn-hex">⚡</div>
    <div>
      <div class="tn-name">IronForge</div>
      <div class="tn-sub">AACG Platform</div>
    </div>
  </a>
  <div class="tn-btns">
    <a href="../aacg-website.html" class="tn-back">← All Trades</a>
    <a href="../{ADMIN}" class="btn-r" style="padding:8px 16px;font-size:13px">Login →</a>
  </div>
</nav>

<section class="hero">
  <div class="container">
    <div class="hero-tag">{item['emoji']} {item['name']}</div>
    <h1 class="hero-h1"><span class="hl">{item['headline'].split('.')[0]}</span>{'.' if '.' in item['headline'] else ''}<br>{'. '.join(item['headline'].split('.')[1:]) if '.' in item['headline'] else ''}</h1>
    <p class="hero-sub">{item['subhead']}</p>
    <div class="hero-pain"><strong>The real problem:</strong> {item['pain']}</div>
    <div class="hero-btns">
      <button class="btn-r" onclick="openSignup()">Start Free Trial — No Credit Card</button>
      <a href="tel:{PHONE}" class="btn-ghost">📞 {PHONE}</a>
    </div>
  </div>
</section>

<div class="container">
  <div class="stats-row">
    {stats_html}
  </div>
</div>

<section class="agents-section">
  <div class="container">
    <h2 class="sec-title">AI Agents Built for {item['name']}</h2>
    <p class="sec-sub">These agents activate the moment you sign up — running 24/7 on your account.</p>
    <div class="agents-grid">
      {agents_html}
    </div>
  </div>
</section>

<section class="how-section">
  <div class="container">
    <h2 class="sec-title">How IronForge Works</h2>
    <p class="sec-sub">From signup to full automation in under 15 minutes.</p>
    <div class="steps">
      <div class="step"><div class="step-num">1</div><div class="step-title">Sign Up Free</div><div class="step-desc">14-day trial, no credit card. Your dashboard activates instantly.</div></div>
      <div class="step"><div class="step-num">2</div><div class="step-title">Connect Your Jobs</div><div class="step-desc">Add your active projects in under 5 minutes. Import from QuickBooks or enter manually.</div></div>
      <div class="step"><div class="step-num">3</div><div class="step-title">Agents Go Live</div><div class="step-desc">Your 10 AI agents start monitoring, filing, and automating immediately.</div></div>
      <div class="step"><div class="step-num">4</div><div class="step-title">Get Paid Faster</div><div class="step-desc">Liens filed. Invoices sent. Compliance tracked. You focus on the work.</div></div>
    </div>
  </div>
</section>

<section class="testimonial">
  <div class="container">
    <div class="testi-card">
      <p class="testi-text">{testimonial_text}</p>
      <div class="testi-name">Mike R.</div>
      <div class="testi-role">{testimonial_name} · {item['name']}</div>
    </div>
  </div>
</section>

<section class="cta-section">
  <div class="container">
    <div class="cta-box">
      <h2 class="cta-title">Ready to Automate Your {item['name'].split()[0]} Business?</h2>
      <p class="cta-sub">Join contractors saving {item['stats'][0][0]} per year with IronForge. Start your free 14-day trial today — no credit card required.</p>
      <div class="cta-btns">
        <button class="btn-r" style="font-size:1rem;padding:16px 36px" onclick="openSignup()">Start Free Trial →</button>
        <a href="tel:{PHONE}" class="btn-ghost" style="font-size:1rem">📞 Talk to a Human</a>
      </div>
      <a href="tel:{PHONE}" class="cta-phone">{PHONE} · Mon–Sat 7AM–9PM EST</a>
    </div>
  </div>
</section>

<footer class="page-footer">
  <div class="pf-links">
    <a href="../aacg-website.html">Home</a>
    <a href="../aacg-website.html#agents">AI Agents</a>
    <a href="../aacg-website.html#pricing">Pricing</a>
    <a href="../{ADMIN}">Login</a>
    <a href="tel:{PHONE}">{PHONE}</a>
  </div>
  <p class="pf-copy">&copy; 2025 IronForge · AACG Platform · All rights reserved.</p>
</footer>

<!-- Signup Modal -->
<div id="suModal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.92);z-index:9900;align-items:center;justify-content:center;padding:24px;">
  <div style="background:#0d1835;border:1px solid rgba(255,58,45,.2);border-radius:18px;padding:36px;max-width:500px;width:100%;position:relative;">
    <button onclick="closeSu()" style="position:absolute;top:14px;right:18px;background:none;border:none;color:#7a8aaa;font-size:1.2rem;cursor:pointer;">✕</button>
    <h3 style="color:#ff3a2d;font-size:1.3rem;margin-bottom:6px;">Start Your Free Trial 🚀</h3>
    <p style="color:#7a8aaa;font-size:.85rem;margin-bottom:20px;">14 days free · No credit card · Cancel any time</p>
    <p style="background:rgba(0,255,136,.07);border:1px solid rgba(0,255,136,.2);border-radius:8px;padding:12px;font-size:.82rem;color:#e8edf5;margin-bottom:18px;">✓ <strong>How payments work:</strong> Free trial activates now. After 14 days you receive an invoice by email — pay by card or ACH. We never auto-charge.</p>
    <input id="su_name" type="text" placeholder="Your Name" style="width:100%;background:#080f24;border:1px solid rgba(255,58,45,.18);border-radius:8px;padding:10px 14px;color:#e8edf5;font-size:.9rem;margin-bottom:10px;outline:none;">
    <input id="su_email" type="email" placeholder="Work Email" style="width:100%;background:#080f24;border:1px solid rgba(255,58,45,.18);border-radius:8px;padding:10px 14px;color:#e8edf5;font-size:.9rem;margin-bottom:10px;outline:none;">
    <input id="su_phone" type="tel" placeholder="Phone Number" style="width:100%;background:#080f24;border:1px solid rgba(255,58,45,.18);border-radius:8px;padding:10px 14px;color:#e8edf5;font-size:.9rem;margin-bottom:18px;outline:none;">
    <button onclick="submitSu()" style="width:100%;background:linear-gradient(135deg,#ff3a2d,#cc2018);color:#fff;border:none;border-radius:8px;padding:14px;font-size:1rem;font-weight:800;cursor:pointer;">Start Free Trial →</button>
  </div>
</div>
<script>
function openSignup(){{document.getElementById('suModal').style.display='flex';}}
function closeSu(){{document.getElementById('suModal').style.display='none';}}
document.getElementById('suModal').addEventListener('click',function(e){{if(e.target===this)closeSu();}});
function submitSu(){{
  var n=document.getElementById('su_name').value.trim();
  var e=document.getElementById('su_email').value.trim();
  if(!n||!e){{alert('Please enter your name and email.');return;}}
  sessionStorage.setItem('aacg_plan','pro');
  sessionStorage.setItem('aacg_signup_name',n);
  sessionStorage.setItem('aacg_signup_email',e);
  sessionStorage.setItem('aacg_new_signup','1');
  window.location.href='../{ADMIN}?plan=pro&new=1&trade={slug}';
}}
</script>
</body>
</html>"""
  return html

# Build all trade pages
os.makedirs('/sessions/lucid-dreamy-ptolemy/mnt/AACG-Platform/trades', exist_ok=True)
os.makedirs('/sessions/lucid-dreamy-ptolemy/mnt/AACG-Platform/sectors', exist_ok=True)

count = 0
for t in TRADES:
  html = build_page(t, "trade")
  path = f"/sessions/lucid-dreamy-ptolemy/mnt/AACG-Platform/trades/{t['slug']}.html"
  open(path, 'w', encoding='utf-8').write(html)
  count += 1

for s in SECTORS:
  html = build_page(s, "sector")
  path = f"/sessions/lucid-dreamy-ptolemy/mnt/AACG-Platform/sectors/{s['slug']}.html"
  open(path, 'w', encoding='utf-8').write(html)
  count += 1

print(f"Built {count} SEO funnel pages")
