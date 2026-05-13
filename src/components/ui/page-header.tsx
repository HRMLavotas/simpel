/**
 * PageHeader Component
 * Reusable gradient header for pages
 */

import { LucideIcon } from "lucide-react";
import { ReactNode } from "react";

interface PageHeaderProps {
  icon: LucideIcon;
  title: string;
  description: string;
  gradient?: "blue" | "green" | "purple" | "orange" | "red" | "indigo" | "cyan";
  children?: ReactNode;
}

const gradientClasses = {
  blue: "from-blue-600 via-blue-500 to-blue-400",
  green: "from-green-600 via-green-500 to-green-400",
  purple: "from-purple-600 via-purple-500 to-purple-400",
  orange: "from-orange-600 via-orange-500 to-orange-400",
  red: "from-red-600 via-red-500 to-red-400",
  indigo: "from-indigo-600 via-indigo-500 to-indigo-400",
  cyan: "from-cyan-600 via-cyan-500 to-cyan-400",
};

export function PageHeader({
  icon: Icon,
  title,
  description,
  gradient = "blue",
  children,
}: PageHeaderProps) {
  return (
    <div
      className={`relative overflow-hidden rounded-xl bg-gradient-to-br ${gradientClasses[gradient]} p-4 md:p-5 text-white shadow-lg mb-6`}
    >
      {/* Background decorations */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -translate-y-24 translate-x-24 blur-3xl" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-12 -translate-x-12 blur-2xl" />
      
      {/* Content */}
      <div className="relative flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm flex-shrink-0">
            <Icon className="h-6 w-6 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl md:text-2xl font-bold text-white truncate">{title}</h1>
            <p className="text-white/90 text-xs md:text-sm">{description}</p>
          </div>
        </div>
        
        {/* Action buttons area */}
        {children && (
          <div className="flex-shrink-0">
            {children}
          </div>
        )}
      </div>
    </div>
  );
}
