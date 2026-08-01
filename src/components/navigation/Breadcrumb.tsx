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
    <nav className="mb-4 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1.5 text-sm font-bold text-gray-600" aria-label="Breadcrumb">
      {items.map((item, index) => (
        <React.Fragment key={index}>
          {index > 0 && <ChevronRight className="h-4 w-4 shrink-0 text-gray-400" />}
          {item.route ? (
            <button
              onClick={() => handleClick(item.route!)}
              className="min-w-0 break-words text-left transition-colors hover:text-black cursor-pointer"
            >
              {item.label}
            </button>
          ) : (
            <span className="min-w-0 break-words text-black">{item.label}</span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};
