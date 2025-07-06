"use client";

import { useState, useRef, useEffect } from 'react';

interface BulkActionsMenuProps {
  selectedCount: number;
  onBulkDelete: () => void;
  onBulkEdit?: () => void;
  onBulkExport?: () => void;
  onBulkStatusChange?: (status: string) => void;
  availableStatuses?: { value: string; label: string }[];
  customActions?: { label: string; onClick: () => void; icon?: React.ReactNode; color?: string }[];
}

export default function BulkActionsMenu({
  selectedCount,
  onBulkDelete,
  onBulkEdit,
  onBulkExport,
  onBulkStatusChange,
  availableStatuses = [],
  customActions = []
}: BulkActionsMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setShowStatusMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (selectedCount === 0) return null;

  return (
    <div className="relative" ref={menuRef}>
      {/* Ana Toplu İşlem Butonu */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-lg shadow-lg transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
        <span>Toplu İşlemler ({selectedCount})</span>
        <svg className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menü */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 animate-fade-in">
          {/* Menü Başlığı */}
          <div className="px-4 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200 rounded-t-xl">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div>
                <div className="font-semibold text-gray-800">Toplu İşlemler</div>
                <div className="text-sm text-gray-600">{selectedCount} kayıt seçildi</div>
              </div>
            </div>
          </div>

          {/* Menü İçeriği */}
          <div className="py-2">
            {/* Toplu Düzenle */}
            {onBulkEdit && (
              <button
                onClick={() => {
                  onBulkEdit();
                  setIsOpen(false);
                }}
                className="w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors duration-150 flex items-center gap-3 group"
              >
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
                <div>
                  <div className="font-medium text-gray-800">Toplu Düzenle</div>
                  <div className="text-sm text-gray-500">Seçili kayıtları düzenle</div>
                </div>
              </button>
            )}

            {/* Durum Değiştirme */}
            {onBulkStatusChange && availableStatuses.length > 0 && (
              <div className="relative">
                <button
                  onClick={() => setShowStatusMenu(!showStatusMenu)}
                  className="w-full px-4 py-3 text-left hover:bg-green-50 transition-colors duration-150 flex items-center gap-3 group"
                >
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors">
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-medium text-gray-800">Durum Değiştir</div>
                    <div className="text-sm text-gray-500">Seçili kayıtların durumunu güncelle</div>
                  </div>
                  <svg className={`w-4 h-4 ml-auto transition-transform duration-200 ${showStatusMenu ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Alt Durum Menüsü */}
                {showStatusMenu && (
                  <div className="ml-4 mt-1 bg-gray-50 rounded-lg border border-gray-200">
                    {availableStatuses.map((status) => (
                      <button
                        key={status.value}
                        onClick={() => {
                          onBulkStatusChange(status.value);
                          setShowStatusMenu(false);
                          setIsOpen(false);
                        }}
                        className="w-full px-4 py-2 text-left hover:bg-gray-100 transition-colors duration-150 text-sm"
                      >
                        {status.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Toplu Dışa Aktar */}
            {onBulkExport && (
              <button
                onClick={() => {
                  onBulkExport();
                  setIsOpen(false);
                }}
                className="w-full px-4 py-3 text-left hover:bg-purple-50 transition-colors duration-150 flex items-center gap-3 group"
              >
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                  <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <div className="font-medium text-gray-800">Dışa Aktar</div>
                  <div className="text-sm text-gray-500">Seçili kayıtları Excel'e aktar</div>
                </div>
              </button>
            )}

            {/* Özel İşlemler */}
            {customActions.map((action, index) => (
              <button
                key={index}
                onClick={() => {
                  action.onClick();
                  setIsOpen(false);
                }}
                className={`w-full px-4 py-3 text-left transition-colors duration-150 flex items-center gap-3 group ${
                  action.color === 'red' ? 'hover:bg-red-50' : 'hover:bg-gray-50'
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                  action.color === 'red' 
                    ? 'bg-red-100 group-hover:bg-red-200' 
                    : 'bg-gray-100 group-hover:bg-gray-200'
                }`}>
                  {action.icon || (
                    <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                </div>
                <div>
                  <div className="font-medium text-gray-800">{action.label}</div>
                </div>
              </button>
            ))}

            {/* Ayırıcı */}
            <div className="border-t border-gray-200 my-2"></div>

            {/* Toplu Sil */}
            <button
              onClick={() => {
                onBulkDelete();
                setIsOpen(false);
              }}
              className="w-full px-4 py-3 text-left hover:bg-red-50 transition-colors duration-150 flex items-center gap-3 group"
            >
              <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center group-hover:bg-red-200 transition-colors">
                <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <div>
                <div className="font-medium text-red-700">Toplu Sil</div>
                <div className="text-sm text-red-500">Seçili kayıtları kalıcı olarak sil</div>
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 