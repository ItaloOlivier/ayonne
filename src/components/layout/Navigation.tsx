'use client'

import Link from 'next/link'
import { useState } from 'react'

interface NavItem {
  name: string
  href: string
  submenu?: { name: string; href: string }[]
}

const navItems: NavItem[] = [
  {
    name: 'BioHack: Anti-Aging Serums',
    href: '/collections/anti-aging-serums',
  },
  {
    name: 'Hydration Station: Moisturizers',
    href: '/collections/moisturizers',
  },
  {
    name: 'Squeaky Clean: Soaps & Cleansers',
    href: '/collections/cleansers',
  },
  {
    name: 'Sunday Self-Care Rituals',
    href: '/collections/self-care',
  },
  {
    name: 'Rise & Glow',
    href: '/collections/rise-and-glow',
  },
  {
    name: 'Knowledge Is Beauty: eBooks',
    href: '/collections/ebooks',
  },
  {
    name: 'Man up!',
    href: '/collections/mens',
  },
  {
    name: 'Save with Bundles',
    href: '/collections/bundles',
  },
]

interface NavigationProps {
  mobile?: boolean
  onClose?: () => void
}

export default function Navigation({ mobile, onClose }: NavigationProps) {
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null)

  if (mobile) {
    return (
      <nav className="py-4 px-4">
        <ul className="space-y-3">
          {navItems.map((item) => (
            <li key={item.name}>
              <Link
                href={item.href}
                className="block py-2 text-[#1C4444] hover:opacity-70 transition-opacity text-sm"
                onClick={onClose}
              >
                {item.name}
              </Link>
            </li>
          ))}
          <li className="pt-4 border-t border-[#1C4444]/10">
            <Link
              href="/collections/all"
              className="block py-2 text-[#1C4444] font-medium hover:opacity-70 transition-opacity text-sm"
              onClick={onClose}
            >
              Shop All
            </Link>
          </li>
        </ul>
      </nav>
    )
  }

  return (
    <nav className="flex justify-center">
      <ul className="flex flex-wrap justify-center gap-x-6 gap-y-2">
        {navItems.map((item) => (
          <li
            key={item.name}
            className="relative"
            onMouseEnter={() => setOpenSubmenu(item.name)}
            onMouseLeave={() => setOpenSubmenu(null)}
          >
            <Link
              href={item.href}
              className="text-[#1C4444] text-sm hover:underline underline-offset-4 transition-all whitespace-nowrap"
            >
              {item.name}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}
