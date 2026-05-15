"use client";

import React, { useState } from 'react';

interface CalendarPickerProps {
  onDateSelect: (date: string) => void;
  selectedDate: string;
}

export default function CalendarPicker({ onDateSelect, selectedDate }: CalendarPickerProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const renderDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysCount = daysInMonth(year, month);
    const startDay = firstDayOfMonth(year, month);
    const days = [];

    // Empty slots for previous month days
    for (let i = 0; i < startDay; i++) {
      days.push(<div key={`empty-${i}`} className="p-2"></div>);
    }

    // Actual days
    for (let d = 1; d <= daysCount; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const isSelected = selectedDate === dateStr;
      const isToday = new Date().toISOString().split('T')[0] === dateStr;
      const isPast = new Date(year, month, d) < new Date(new Date().setHours(0,0,0,0));

      days.push(
        <button
          key={d}
          disabled={isPast}
          onClick={() => onDateSelect(dateStr)}
          className={`p-2 rounded-xl text-sm font-medium transition-all duration-200 
            ${isSelected 
              ? 'bg-accent-cyan text-black shadow-[0_0_15px_rgba(6,182,212,0.4)]' 
              : isPast 
                ? 'text-slate-700 cursor-not-allowed' 
                : 'text-slate-300 hover:bg-white/10 hover:text-accent-cyan'}
            ${isToday && !isSelected ? 'border border-accent-cyan/30' : ''}
          `}
        >
          {d}
        </button>
      );
    }

    return days;
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 select-none">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold uppercase tracking-widest italic">
          {months[currentDate.getMonth()]} <span className="text-accent-cyan">{currentDate.getFullYear()}</span>
        </h3>
        <div className="flex gap-2">
          <button 
            onClick={handlePrevMonth}
            className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button 
            onClick={handleNextMonth}
            className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center mb-2">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => (
          <div key={d} className="text-[10px] font-bold text-slate-500 uppercase">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {renderDays()}
      </div>

      {selectedDate && (
        <div className="mt-6 pt-4 border-t border-white/5 text-center">
          <p className="text-[10px] text-slate-500 uppercase tracking-widest">
            Selected: <span className="text-accent-cyan">{selectedDate}</span>
          </p>
        </div>
      )}
    </div>
  );
}
