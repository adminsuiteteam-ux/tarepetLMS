import { Link, useLocation } from "wouter";
import { Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import tarepetLogo from "@assets/tarepet__1784835204178.png";
import { Button } from "@/components/ui/button";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/programs", label: "Programs" },
  { href: "/admissions", label: "Admissions" },
  { href: "/journal", label: "Journal" },
  { href: "/events", label: "Events" },
  { href: "/contact", label: "Contact" },
];

export function Navbar() {
  const [location] = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu on navigation
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location]);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? "bg-white/95 backdrop-blur-md shadow-sm py-3" : "bg-white py-5"
      }`}
    >
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <img 
              src={tarepetLogo} 
              alt="Tarepet Montessori School Logo" 
              className="w-12 h-12 md:w-14 md:h-14 object-contain transition-transform group-hover:scale-105"
            />
            <div className="flex flex-col">
              <span className="font-serif font-bold text-2xl md:text-[28px] text-primary leading-none tracking-tight">
                Tarepet
              </span>
              <span className="font-sans text-[11px] md:text-[13px] uppercase tracking-[0.15em] text-secondary font-medium mt-1">
                montessori school
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <ul className="flex items-center gap-6">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <Link 
                    href={link.href}
                    className={`font-sans text-sm font-medium transition-colors hover:text-primary ${
                      location === link.href ? "text-primary" : "text-foreground/80"
                    }`}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
            <Link 
              href="/sign-in" 
              className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-primary text-primary hover:bg-primary/5 h-10 px-6 py-2"
            >
              Sign In
            </Link>
            <Link 
              href="/admissions" 
              className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-6 py-2 shadow-sm"
            >
              Admissions
            </Link>
          </nav>

          {/* Mobile Menu Toggle */}
          <button 
            className="md:hidden p-2 text-foreground"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation — slides in from the left */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="md:hidden fixed inset-0 bg-black/40 z-40"
              onClick={() => setMobileMenuOpen(false)}
            />

            {/* Drawer */}
            <motion.div
              key="drawer"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "tween", duration: 0.3, ease: "easeInOut" }}
              className="md:hidden fixed top-0 left-0 bottom-0 w-72 bg-white z-50 flex flex-col shadow-2xl"
            >
              {/* Drawer header */}
              <div className="flex items-center justify-between px-5 py-5 border-b border-border">
                <Link href="/" className="flex items-center gap-2" onClick={() => setMobileMenuOpen(false)}>
                  <img src={tarepetLogo} alt="Tarepet Logo" className="w-9 h-9 object-contain" />
                  <div className="flex flex-col">
                    <span className="font-serif font-bold text-lg text-primary leading-none">Tarepet</span>
                    <span className="font-sans text-[10px] uppercase tracking-[0.12em] text-secondary font-medium mt-0.5">montessori school</span>
                  </div>
                </Link>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 rounded-md text-foreground/60 hover:text-foreground hover:bg-muted transition-colors"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Nav links */}
              <nav className="flex-1 overflow-y-auto px-4 py-6">
                <ul className="flex flex-col gap-1">
                  {NAV_LINKS.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className={`flex items-center px-3 py-3 rounded-lg font-sans text-base font-medium transition-colors ${
                          location === link.href
                            ? "bg-primary/10 text-primary"
                            : "text-foreground hover:bg-muted hover:text-primary"
                        }`}
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>

              {/* Bottom CTAs */}
              <div className="px-4 pb-6 pt-3 border-t border-border flex flex-col gap-3">
                <Link
                  href="/sign-in"
                  className="flex w-full items-center justify-center rounded-md text-sm font-medium border border-primary text-primary hover:bg-primary/5 h-11 px-6 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/admissions"
                  className="flex w-full items-center justify-center rounded-md text-sm font-medium bg-primary text-white hover:bg-primary/90 h-11 px-6 transition-colors shadow-sm"
                >
                  Admissions
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}
