import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: "default" | "success" | "warning" | "danger";
}

export function StatCard({ title, value, icon: Icon, trend, variant = "default" }: StatCardProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case "success":
        return "border-accent/20 bg-gradient-to-br from-accent/10 to-accent/5";
      case "warning":
        return "border-warning/20 bg-gradient-to-br from-warning/10 to-warning/5";
      case "danger":
        return "border-destructive/20 bg-gradient-to-br from-destructive/10 to-destructive/5";
      default:
        return "border-primary/20 bg-gradient-to-br from-primary/10 to-primary/5";
    }
  };

  const getIconStyles = () => {
    switch (variant) {
      case "success":
        return "text-accent bg-accent/20";
      case "warning":
        return "text-warning bg-warning/20";
      case "danger":
        return "text-destructive bg-destructive/20";
      default:
        return "text-primary bg-primary/20";
    }
  };

  return (
    <Card className={`hover-lift transition-smooth ${getVariantStyles()}`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold text-foreground">{value}</p>
            {trend && (
              <div className="flex items-center text-sm">
                <span
                  className={`font-medium ${
                    trend.isPositive ? "text-accent" : "text-destructive"
                  }`}
                >
                  {trend.isPositive ? "+" : ""}
                  {trend.value}%
                </span>
                <span className="text-muted-foreground ml-1">vs mois dernier</span>
              </div>
            )}
          </div>
          <div className={`p-3 rounded-full ${getIconStyles()}`}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}