'use client'

import Link from 'next/link'

interface NavItem {
  name: string
  href: string
}

const navItems: NavItem[] = [
  {
    name: 'BioHack',
    href: '/collections/anti-aging-serums',
  },
  {
    name: 'Hydration Station',
    href: '/collections/moisturizers',
  },
  {
    name: 'Squeaky Clean',
    href: '/collections/cleansers',
  },
  {
    name: 'Self-Care',
    href: '/collections/self-care',
  },
  {
    name: 'Rise & Glow',
    href: '/collections/rise-and-glow',
  },
  {
    name: 'eBooks',
    href: '/collections/ebooks',
  },
  {
    name: 'Man up!',
    href: '/collections/mens',
  },
  {
    name: 'Bundles',
    href: '/collections/bundles',
  },
]

interface NavigationProps {
  mobile?: boolean
  onClose?: () => void
}

export default function Navigation({ mobile, onClose }: NavigationProps) {
  if (mobile) {
    return (
      <nav className="py-4 px-4">
        <ul className="space-y-1">
          {navItems.map((item) => (
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
    <nav className="flex">
      <ul className="flex items-center gap-x-4 xl:gap-x-5">
        {navItems.map((item) => (
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
