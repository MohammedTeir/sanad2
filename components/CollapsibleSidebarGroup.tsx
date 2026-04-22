import React, { useState } from 'react';
import { Link } from 'react-router-dom';

interface SidebarMenuItem {
  label: string;
  icon: React.ComponentType<any>;
  path: string;
}

interface CollapsibleSidebarGroupProps {
  title: string;
  icon: React.ComponentType<any>;
  items: SidebarMenuItem[];
  defaultExpanded?: boolean;
  locationPathname: string;
}

const CollapsibleSidebarGroup: React.FC<CollapsibleSidebarGroupProps> = ({
  title,
  icon: CategoryIcon,
  items,
  defaultExpanded = false,
  locationPathname,
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className="mb-2">
      {/* Category Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 py-2 rounded-xl text-gray-500 hover:bg-gray-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          <CategoryIcon className="w-4 h-4" />
          <span className="font-black text-xs uppercase tracking-wider">{title}</span>
        </div>
        <svg
          className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Menu Items */}
      {isExpanded && (
        <ul className="mt-1 space-y-1 pr-4">
          {items.map((item, idx) => (
            <li key={idx}>
              <Link
                to={item.path}
                onClick={() => setIsExpanded(false)}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
                  locationPathname === item.path
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-100'
                    : 'text-gray-500 hover:bg-emerald-50'
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default CollapsibleSidebarGroup;
