'use client'

import Link from 'next/link'

interface NavItem {
  name: string
  href: string
}

// Row 1 - Main collections
const navItemsRow1: NavItem[] = [
  {
    name: 'Biohack: Anti-Aging Serums',
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
]

// Row 2 - Additional collections
const navItemsRow2: NavItem[] = [
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

const allNavItems = [...navItemsRow1, ...navItemsRow2]

interface NavigationProps {
  mobile?: boolean
  onClose?: () => void
}

export default function Navigation({ mobile, onClose }: NavigationProps) {
  if (mobile) {
    return (
      <nav className="py-4 px-4">
        <ul className="space-y-1">
          {allNavItems.map((item) => (
            <li key={item.name}>
              <Link
                href={item.href}
                className="block py-3 text-[#1C4444] hover:opacity-70 transition-opacity text-sm uppercase tracking-wider font-normal"
                onClick={onClose}
              >
                {item.name}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    )
  }

  return (
    <nav className="py-3">
      {/* Row 1 */}
      <ul className="flex items-center justify-center gap-x-6 xl:gap-x-8 mb-2">
        {navItemsRow1.map((item) => (
          <li key={item.name}>
            <Link
              href={item.href}
              className="text-[#1C4444] text-[13px] uppercase tracking-wide font-normal hover:underline underline-offset-4 transition-all whitespace-nowrap"
            >
              {item.name}
            </Link>
          </li>
        ))}
      </ul>
      {/* Row 2 */}
      <ul className="flex items-center justify-center gap-x-6 xl:gap-x-8">
        {navItemsRow2.map((item) => (
          <li key={item.name}>
            <Link
              href={item.href}
              className="text-[#1C4444] text-[13px] uppercase tracking-wide font-normal hover:underline underline-offset-4 transition-all whitespace-nowrap"
            >
              {item.name}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}
