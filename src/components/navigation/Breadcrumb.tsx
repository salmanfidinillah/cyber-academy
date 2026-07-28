import React from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";

interface BreadcrumbItem {
  label: string;
  route?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  onNavigate?: (route: string) => void;
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({ items, onNavigate }) => {
  const navigate = useNavigate();

  const handleClick = (route: string) => {
    if (onNavigate) {
      onNavigate(route);
    } else {
      navigate(route);
    }
  };

  return (
    <nav className="flex items-center space-x-2 text-sm font-bold text-gray-600 mb-4" aria-label="Breadcrumb">
      {items.map((item, index) => (
        <React.Fragment key={index}>
          {index > 0 && <ChevronRight className="w-4 h-4 text-gray-400" />}
          {item.route ? (
            <button
              onClick={() => handleClick(item.route!)}
              className="hover:text-black transition-colors cursor-pointer"
            >
              {item.label}
            </button>
          ) : (
            <span className="text-black">{item.label}</span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};
