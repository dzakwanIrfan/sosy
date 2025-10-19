'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BreadcrumbItem {
  label: string;
  href?: string;
  isCurrentPage?: boolean;
}

const routeLabels: Record<string, string> = {
  dashboard: 'Dashboard',
  users: 'Users',
  wordpress: 'WordPress Users',
  active: 'Active Users', 
  events: 'Events & Venues',
  venues: 'Venues',
  analytics: 'Analytics',
  matching: 'Matching Success',
  admin: 'Administration',
  settings: 'Settings',
};

export function Breadcrumb() {
  const pathname = usePathname();
  
  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    const pathSegments = pathname.split('/').filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [];

    // Add home (dashboard)
    breadcrumbs.push({
      label: 'Dashboard',
      href: '/dashboard',
    });

    // Skip the first 'dashboard' segment and generate breadcrumbs
    let currentPath = '';
    pathSegments.slice(1).forEach((segment, index, arr) => {
      currentPath += `/${pathSegments[0]}/${segment}`;
      const isLast = index === arr.length - 1;
      
      breadcrumbs.push({
        label: routeLabels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1),
        href: isLast ? undefined : currentPath,
        isCurrentPage: isLast,
      });
    });

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  // Don't show breadcrumb on dashboard home
  if (pathname === '/dashboard') {
    return null;
  }

  return (
    <nav className="flex items-center space-x-1 text-sm text-gray-500 mb-6">
      {breadcrumbs.map((item, index) => (
        <div key={index} className="flex items-center">
          {index > 0 && <ChevronRight className="h-4 w-4 mx-2 text-gray-400" />}
          
          {item.href ? (
            <Link
              href={item.href}
              className="hover:text-gray-700 transition-colors flex items-center"
            >
              {index === 0 ? (
                <>
                  <Home className="h-4 w-4 mr-1" />
                  <span>{item.label}</span>
                </>
              ) : (
                item.label
              )}
            </Link>
          ) : (
            <span
              className={cn(
                'font-medium flex items-center',
                item.isCurrentPage ? 'text-gray-900' : 'text-gray-500'
              )}
            >
              {index === 0 && <Home className="h-4 w-4 mr-1" />}
              {item.label}
            </span>
          )}
        </div>
      ))}
    </nav>
  );
}