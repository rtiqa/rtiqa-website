import React, { useState } from 'react';
import { usePlatformAuth } from '../../context/PlatformAuthContext';

interface GoogleAuthButtonProps {
  label?: string;
  onSuccess?: () => void;
  disabled?: boolean;
}

export const GoogleAuthButton: React.FC<GoogleAuthButtonProps> = ({
  label = 'المتابعة باستخدام Google',
  onSuccess,
  disabled = false,
}) => {
  const { startGoogleOAuthPopup } = usePlatformAuth();
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  const handleClick = async () => {
    if (disabled || isPopupOpen) return;
    setIsPopupOpen(true);
    try {
      await startGoogleOAuthPopup();
      onSuccess?.();
    } catch {
      // Handled in context
    } finally {
      setIsPopupOpen(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled || isPopupOpen}
      className="w-full py-2.5 px-4 rounded-xl bg-slate-950 hover:bg-slate-900 border border-slate-700 hover:border-slate-600 text-slate-200 text-xs font-semibold flex items-center justify-center gap-2.5 transition shadow-sm disabled:opacity-50"
    >
      <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
        <path
          fill="#4285F4"
          d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
        />
        <path
          fill="#34A853"
          d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.35 24 12 24z"
        />
        <path
          fill="#FBBC05"
          d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.16 0 9.94 0 12s.45 3.84 1.25 5.42l4.03-3.15z"
        />
        <path
          fill="#EA4335"
          d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
        />
      </svg>
      <span>{isPopupOpen ? 'جارٍ الاتصال بحساب Google...' : label}</span>
    </button>
  );
};
