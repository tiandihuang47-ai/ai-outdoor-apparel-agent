'use client';

import { useState, useRef, useEffect } from 'react';
import AnimatedButton from './ui/AnimatedButton';

interface UserMenuProps {
  email: string | null;
  onLoginClick: () => void;
  onLogout: () => void;
}

export default function UserMenu({ email, onLoginClick, onLogout }: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } finally {
      onLogout();
      setOpen(false);
    }
  };

  if (!email) {
    return (
      <AnimatedButton
        variant="secondary"
        className="px-4 py-2 text-sm"
        onClick={onLoginClick}
      >
        🔐 登录
      </AnimatedButton>
    );
  }

  const displayName = email.split('@')[0] || email;

  return (
    <div className="relative" ref={containerRef}>
      <AnimatedButton
        variant="secondary"
        className="px-4 py-2 text-sm"
        onClick={() => setOpen((prev) => !prev)}
      >
        👤 {displayName}
      </AnimatedButton>

      {open && (
        <div className="absolute right-0 mt-2 w-56 rounded-xl glass p-2 z-50">
          <div className="px-3 py-2 text-sm text-slate-300 border-b border-slate-700/50 mb-1 truncate">
            {email}
          </div>
          <button
            onClick={handleLogout}
            className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-white rounded-lg transition-colors"
          >
            退出登录
          </button>
        </div>
      )}
    </div>
  );
}
