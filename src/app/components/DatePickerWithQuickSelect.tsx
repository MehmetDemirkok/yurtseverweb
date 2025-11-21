"use client";

import { useState, useRef, useEffect } from 'react';
import { Calendar } from 'lucide-react';

interface DatePickerWithQuickSelectProps {
  value: string;
  onChange: (value: string) => void;
  label: string;
  minDate?: string;
  maxDate?: string;
  required?: boolean;
  className?: string;
}

export default function DatePickerWithQuickSelect({
  value,
  onChange,
  label,
  minDate,
  maxDate,
  required = false,
  className = "",
}: DatePickerWithQuickSelectProps) {
  const [showQuickSelect, setShowQuickSelect] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowQuickSelect(false);
        setShowCalendar(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getQuickDateOptions = () => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);
    const nextMonth = new Date(today);
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    return [
      { label: 'Bugün', value: formatDate(today), date: today },
      { label: 'Yarın', value: formatDate(tomorrow), date: tomorrow },
      { label: '1 Hafta Sonra', value: formatDate(nextWeek), date: nextWeek },
      { label: '1 Ay Sonra', value: formatDate(nextMonth), date: nextMonth },
    ];
  };

  const handleQuickSelect = (dateValue: string) => {
    onChange(dateValue);
    setShowQuickSelect(false);
  };

  const displayValue = value ? new Date(value).toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }) : '';

  return (
    <div ref={containerRef} className="relative">
      <label className="block text-xs font-medium text-gray-700 mb-1">{label}</label>
      <div className="relative">
        <input
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          min={minDate}
          max={maxDate}
          required={required}
          className={`w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm ${className}`}
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              setShowQuickSelect(!showQuickSelect);
            }}
            className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
            title="Hızlı Seçim"
          >
            <Calendar className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Hızlı Seçim Dropdown */}
      {showQuickSelect && (
        <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="p-2">
            <div className="text-xs font-semibold text-gray-500 mb-2 px-2">Hızlı Seçim</div>
            {getQuickDateOptions().map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleQuickSelect(option.value)}
                className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 rounded-md transition-colors flex items-center justify-between"
              >
                <span className="text-gray-700">{option.label}</span>
                <span className="text-xs text-gray-500">
                  {option.date.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' })}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

