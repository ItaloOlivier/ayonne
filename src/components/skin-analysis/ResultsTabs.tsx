'use client'

import { useState, ReactNode } from 'react'

interface Tab {
  id: string
  label: string
  icon?: ReactNode
}

interface ResultsTabsProps {
  tabs: Tab[]
  children: ReactNode[]
  defaultTab?: string
}

export default function ResultsTabs({ tabs, children, defaultTab }: ResultsTabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id || '')

  const activeIndex = tabs.findIndex(tab => tab.id === activeTab)

  return (
    <div>
      {/* Tab Headers */}
      <div className="flex border-b border-[#1C4444]/10 mb-8 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-6 py-3 text-sm font-medium tracking-wide transition-all relative whitespace-nowrap ${
              activeTab === tab.id
                ? 'text-[#1C4444]'
                : 'text-[#1C4444]/50 hover:text-[#1C4444]/70'
            }`}
            aria-selected={activeTab === tab.id}
            role="tab"
          >
            {tab.icon && (
              <span className={activeTab === tab.id ? 'text-[#D4AF37]' : ''}>
                {tab.icon}
              </span>
            )}
            {tab.label}
            {activeTab === tab.id && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#D4AF37]" />
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="animate-elegant-fade-in" role="tabpanel">
        {activeIndex >= 0 && activeIndex < children.length && children[activeIndex]}
      </div>
    </div>
  )
}
