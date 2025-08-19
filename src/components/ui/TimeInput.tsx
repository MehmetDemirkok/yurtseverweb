import React, { useEffect, useMemo, useRef, useState } from 'react';

interface TimeInputProps {
  value: string;
  onChange: (value: string) => void;
  stepMinutes?: number; // dropdown adımı (dk)
  start?: string; // 'HH:mm'
  end?: string;   // 'HH:mm'
  id?: string;
  name?: string;
  className?: string;
  disabled?: boolean;
  placeholder?: string;
}

function parseToMinutes(hhmm: string): number | null {
  if (!hhmm) return null;
  const parts = hhmm.split(':');
  if (parts.length !== 2) return null;
  const hours = Number(parts[0]);
  const minutes = Number(parts[1]);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
  return hours * 60 + minutes;
}

function minutesToHHMM(total: number): string {
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

const TimeInput: React.FC<TimeInputProps> = ({
  value,
  onChange,
  stepMinutes = 15,
  start = '00:00',
  end = '23:45',
  id,
  name,
  className,
  disabled,
  placeholder
}) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const options = useMemo(() => {
    const startMin = parseToMinutes(start) ?? 0;
    const endMin = parseToMinutes(end) ?? (23 * 60 + 45);
    const list: string[] = [];
    for (let t = startMin; t <= endMin; t += stepMinutes) {
      list.push(minutesToHHMM(t));
    }
    return list;
  }, [start, end, stepMinutes]);

  useEffect(() => {
    function onDocMouseDown(e: MouseEvent) {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onDocMouseDown);
    return () => document.removeEventListener('mousedown', onDocMouseDown);
  }, []);

  const handleSelect = (val: string) => {
    onChange(val);
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <input
        type="time"
        id={id}
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setOpen(true)}
        onClick={() => setOpen(true)}
        className={className}
        disabled={disabled}
        placeholder={placeholder}
      />

      {open && (
        <div className="absolute z-50 mt-2 w-full max-h-64 overflow-auto rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg">
          <ul className="py-1 text-sm">
            {options.map((opt) => (
              <li key={opt}>
                <button
                  type="button"
                  onClick={() => handleSelect(opt)}
                  className={`w-full text-left px-3 py-2 hover:bg-purple-50 dark:hover:bg-gray-700 ${
                    value === opt ? 'bg-purple-100 dark:bg-gray-700 font-semibold' : ''
                  }`}
                >
                  {opt}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default TimeInput;


