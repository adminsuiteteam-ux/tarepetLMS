import React, { useState, useEffect } from 'react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://tarepet-backend-4iw6.onrender.com/api/v1';

export function DisclaimerCookieModal() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Check if disclaimer & cookie consent has already been acknowledged
    const storedConsent = localStorage.getItem('tarepet_cookie_consent');
    if (!storedConsent) {
      // Short delay for smooth entrance
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    // Allows reopening from Footer ("Cookie & Disclaimer Settings")
    const handleOpen = () => {
      setIsOpen(true);
    };

    window.addEventListener('tarepet_open_cookie_modal', handleOpen);
    return () => window.removeEventListener('tarepet_open_cookie_modal', handleOpen);
  }, []);

  const handleClose = async () => {
    const payload = {
      consent_status: 'ALL',
      necessary: true,
      analytics: true,
      functional: true,
      security: true,
      disclaimer_acknowledged: true,
      timestamp: Date.now(),
    };

    // 1. Immediately store in localStorage so disclaimer dismisses without friction
    try {
      localStorage.setItem('tarepet_cookie_consent', JSON.stringify(payload));
    } catch {}

    setIsOpen(false);

    // 2. Persist to Django backend
    try {
      await fetch(`${API_BASE}/communication/cookies/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
    } catch (e) {
      console.warn('Backend cookie consent sync deferred:', e);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="w-full max-w-[620px] bg-white dark:bg-[#1a1f2c] text-[#222] dark:text-[#e2e8f0] rounded-lg shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-800 animate-in zoom-in-95 duration-150 font-serif"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="pt-6 pb-4 px-6 text-center border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#e00] tracking-wider uppercase flex items-center justify-center gap-2">
            DISCLAIMER 🔔
          </h2>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-7 space-y-4 text-[13.5px] sm:text-[14.5px] leading-relaxed text-[#2d3748] dark:text-[#cbd5e1] font-serif">
          <p>
            It has come to our notice that there have been instances where account numbers of individuals are being
            given to prospective and returning students to make school fees and other payments. The public is, by this
            notice, informed that <strong className="text-[#e00] font-bold">PAYMENT OF FEES TO THE ACCOUNTS OF ANY INDIVIDUAL OR STAFF OF THE SCHOOL IS HIGHLY PROHIBITED.</strong>
          </p>

          <p>
            All payments must be made through the School Portal at <a href="https://tarepetmontessorischool.com" className="text-blue-600 dark:text-blue-400 hover:underline">https://tarepetmontessorischool.com</a>. Any payment being
            made directly to the bank must be into a designated School Account Number.
          </p>

          <p>
            The School Management will not take responsibility for any payment that is not made through the portal or directly
            into a bank, using the School’s Account details. This Disclaimer is effective From September 2026.
          </p>

          <div className="pt-2 font-bold text-[#1a202c] dark:text-white leading-snug">
            SIGNED<br />
            MGT
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-5 pt-2 flex justify-end">
          <button
            onClick={handleClose}
            className="bg-[#d9534f] hover:bg-[#c9302c] active:bg-[#ac2925] text-white px-6 py-2 rounded text-sm font-sans font-medium transition shadow-sm cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
