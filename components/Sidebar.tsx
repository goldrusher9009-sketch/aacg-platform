// components/Sidebar.tsx
'use client';

import Link from 'next/link';
import { useState } from 'react';
import { BarChart3, FileText, Image, Settings, Menu, X } from 'lucide-react';

export function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    {
      icon: BarChart3,
      label: 'Dashboard',
      href: '/',
    },
    {
      icon: FileText,
      label: 'Mechanics Liens',
      href: '/mechanics-liens',
    },
    {
      icon: Image,
      label: 'Photo Analysis',
      href: '/photo-analysis',
    },
    {
      icon: Settings,
      label: 'Settings',
      href: '/settings',
    },
  ];

  return (
    <>
      {/* Mobile Toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-40 p-2 md:hidden bg-white dark:bg-slate-900 rounded-lg border border-border shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-screen w-64 bg-white dark:bg-slate-900 border-r border-border transform transition-transform duration-300 z-30 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 md:relative md:w-64 shadow-lg md:shadow-none`}
      >
        {/* Header */}
        <div className="p-6 border-b border-border">
          <h1 className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            AACG
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Platform v1.0.2</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group"
                onClick={() => setIsOpen(false)}
              >
                <Icon
                  size={20}
                  className="text-muted-foreground group-hover:text-foreground transition-colors"
                />
                <span className="flex-1">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-border space-y-2">
          <div className="text-xs text-muted-foreground">
            <p>Status: <span className="text-green-600 dark:text-green-400 font-semibold">Operational</span></p>
            <p className="mt-2">Last updated: {new Date().toLocaleDateString()}</p>
          </div>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
