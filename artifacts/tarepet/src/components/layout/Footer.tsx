import { Link } from "wouter";
import { FooterBackgroundGradient, TextHoverEffect } from "@/components/ui/hover-footer";

export function Footer() {
  return (
    <footer className="bg-[#143e26] text-white relative overflow-hidden border-t border-white/10 mt-12 pt-8 pb-2">
      {/* Top text bar: Copyright on left, Privacy Policy & Terms of Service on right */}
      <div className="max-w-7xl mx-auto px-6 z-10 relative flex flex-col md:flex-row justify-between items-center text-xs md:text-sm text-white/80 gap-3 mb-4">
        <p className="text-center md:text-left font-sans">
          &copy; 2026 Tare Pet Montessori School. All rights reserved.
        </p>
        <div className="flex items-center space-x-6 font-sans">
          <Link href="/privacy" className="hover:text-white transition-colors">
            Privacy Policy
          </Link>
          <Link href="/terms" className="hover:text-white transition-colors">
            Terms of Service
          </Link>
        </div>
      </div>

      {/* Large Interactive Text Hover Effect spanning across footer bottom */}
      <div className="w-full flex justify-center items-center pointer-events-auto relative z-10 px-2">
        <TextHoverEffect text="TARE PET" className="w-full h-auto max-h-[300px]" />
      </div>

      <FooterBackgroundGradient />
    </footer>
  );
}
