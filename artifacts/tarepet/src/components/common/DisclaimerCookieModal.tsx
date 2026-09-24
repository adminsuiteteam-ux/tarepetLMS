import React, { useState, useEffect } from 'react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://tarepet-backend-4iw6.onrender.com/api/v1';

export function DisclaimerCookieModal() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    // Check if disclaimer & cookie consent has already been acknowledged
    const storedConsent = localStorage.getItem('tarepet_cookie_consent');
    if (!storedConsent) {
      // Short delay for smooth entrance
      timer = setTimeout(() => {
        setIsOpen(true);
      }, 500);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
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
            It has come to the notice of the Management of <strong className="font-semibold text-foreground">Tare Pet Montessori School</strong> that fraudulent individuals and unauthorized agents are circulating personal account numbers to unsuspecting parents and guardians for school fees, admission forms, uniforms, and other levies.
          </p>

          <p>
            The general public, parents, and prospective guardians are hereby strongly advised that <strong className="text-[#e00] font-bold">PAYMENT OF SCHOOL FEES OR ANY LEVY INTO THE PERSONAL BANK ACCOUNT OF ANY INDIVIDUAL, AGENT, OR STAFF MEMBER IS STRICTLY PROHIBITED.</strong>
          </p>

          <p>
            All legitimate school payments, registrations, and fee clearances must be conducted directly at the <strong className="font-semibold">School Bursary Office on campus</strong> or paid strictly into the school's verified corporate bank accounts issued officially by the Bursary.
          </p>

          <p>
            Tare Pet Montessori School will not be held liable or responsible for any financial loss incurred through payments made to unauthorized personal accounts, private individuals, or third-party intermediaries.
          </p>

          <div className="pt-2 font-bold text-[#1a202c] dark:text-white leading-snug">
            SIGNED<br />
            MANAGEMENT
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
