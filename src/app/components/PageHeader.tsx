import React from "react";

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
}

export default function PageHeader({ title, description, icon }: PageHeaderProps) {
  return (
    <header className="relative overflow-hidden rounded-xl shadow-2xl mb-8 animate-fade-in">
      <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600 opacity-90" />
      <div className="relative flex flex-col md:flex-row items-center justify-between px-8 py-10 md:py-14">
        <div className="flex items-center gap-4">
          {icon && (
            <div className="flex-shrink-0">
              {icon}
            </div>
          )}
          <div>
            <h1 className="text-3xl md:text-5xl font-bold text-white drop-shadow-lg mb-2">{title}</h1>
            {description && <p className="text-blue-100 text-lg font-medium drop-shadow">{description}</p>}
          </div>
        </div>
      </div>
      {/* Dekoratif daireler */}
      <div className="absolute -top-32 -left-32 w-80 h-80 bg-white opacity-10 rounded-full" />
      <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-white opacity-10 rounded-full" />
    </header>
  );
} 