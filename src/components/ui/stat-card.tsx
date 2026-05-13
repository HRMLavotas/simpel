/**
 * StatCard Component
 * Reusable statistics card with gradient background
 */

import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  color?: "blue" | "green" | "yellow" | "red" | "purple" | "orange" | "indigo" | "cyan";
  className?: string;
}

const colorClasses = {
  blue: {
    border: "border-blue-200 dark:border-blue-800",
    gradient: "from-blue-50 to-white dark:from-blue-950 dark:to-background",
    text: "text-blue-600 dark:text-blue-400",
    iconBg: "bg-blue-100 dark:bg-blue-900/50",
  },
  green: {
    border: "border-green-200 dark:border-green-800",
    gradient: "from-green-50 to-white dark:from-green-950 dark:to-background",
    text: "text-green-600 dark:text-green-400",
    iconBg: "bg-green-100 dark:bg-green-900/50",
  },
  yellow: {
    border: "border-yellow-200 dark:border-yellow-800",
    gradient: "from-yellow-50 to-white dark:from-yellow-950 dark:to-background",
    text: "text-yellow-600 dark:text-yellow-400",
    iconBg: "bg-yellow-100 dark:bg-yellow-900/50",
  },
  red: {
    border: "border-red-200 dark:border-red-800",
    gradient: "from-red-50 to-white dark:from-red-950 dark:to-background",
    text: "text-red-600 dark:text-red-400",
    iconBg: "bg-red-100 dark:bg-red-900/50",
  },
  purple: {
    border: "border-purple-200 dark:border-purple-800",
    gradient: "from-purple-50 to-white dark:from-purple-950 dark:to-background",
    text: "text-purple-600 dark:text-purple-400",
    iconBg: "bg-purple-100 dark:bg-purple-900/50",
  },
  orange: {
    border: "border-orange-200 dark:border-orange-800",
    gradient: "from-orange-50 to-white dark:from-orange-950 dark:to-background",
    text: "text-orange-600 dark:text-orange-400",
    iconBg: "bg-orange-100 dark:bg-orange-900/50",
  },
  indigo: {
    border: "border-indigo-200 dark:border-indigo-800",
    gradient: "from-indigo-50 to-white dark:from-indigo-950 dark:to-background",
    text: "text-indigo-600 dark:text-indigo-400",
    iconBg: "bg-indigo-100 dark:bg-indigo-900/50",
  },
  cyan: {
    border: "border-cyan-200 dark:border-cyan-800",
    gradient: "from-cyan-50 to-white dark:from-cyan-950 dark:to-background",
    text: "text-cyan-600 dark:text-cyan-400",
    iconBg: "bg-cyan-100 dark:bg-cyan-900/50",
  },
};

export function StatCard({
  label,
  value,
  icon: Icon,
  color = "blue",
  className = "",
}: StatCardProps) {
  const colors = colorClasses[color];

  return (
    <Card className={`${colors.border} bg-gradient-to-br ${colors.gradient} ${className}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground">{label}</p>
            <p className={`text-2xl font-bold ${colors.text} mt-1`}>
              {value}
            </p>
          </div>
          <div className={`p-2.5 ${colors.iconBg} rounded-lg`}>
            <Icon className={`h-5 w-5 ${colors.text}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
