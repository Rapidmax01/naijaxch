'use client';

import { usePathname } from 'next/navigation';
import { NAV } from './nav';

function isActive(pathname: string, href: string): boolean {
  if (href === '/') return pathname === '/' || pathname.startsWith('/stocks');
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SiteNav() {
  const pathname = usePathname() ?? '/';
  return (
    <nav className="site-nav" aria-label="Primary">
      {NAV.map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <a
            key={item.href}
            href={item.href}
            className={`site-nav__link${active ? ' is-active' : ''}`}
            aria-current={active ? 'page' : undefined}
          >
            {item.label}
          </a>
        );
      })}
    </nav>
  );
}
