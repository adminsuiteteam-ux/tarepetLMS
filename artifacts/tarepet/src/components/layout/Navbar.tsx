import { Link, useLocation } from "wouter";
import { ArrowRight, Sparkles, LogIn, X } from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import tarepetLogo from "@assets/tarepet__1784835204178.png";

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
  const [hoveredPath, setHoveredPath] = useState<string | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [mobileMenuOpen]);

  return (
    <header className="fixed top-3 left-3 right-3 md:left-1/2 md:-translate-x-1/2 md:w-[94%] md:max-w-6xl z-[100] transition-all duration-300">
      <div
        className={`w-full rounded-full transition-all duration-500 ${
          isScrolled
            ? "glass-pill bg-white/90 shadow-2xl py-2 px-3.5 md:px-6 border-white/90"
            : "glass-pill bg-white/75 shadow-lg py-2.5 px-4 md:px-6 border-white/70"
        }`}
      >
        <div className="flex items-center justify-between">
          {/* Logo with Glass Hover Glow & Brand Name "Tare Pet" */}
          <Link href="/" className="flex items-center gap-2.5 md:gap-3 group">
            <div className="relative flex items-center justify-center">
              <div className="absolute inset-0 bg-primary/20 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <img
                src={tarepetLogo}
                alt="Tare Pet Montessori School Logo"
                className="w-9 h-9 md:w-12 md:h-12 object-contain relative z-10 transition-transform duration-300 group-hover:scale-105"
              />
            </div>
            <div className="flex flex-col">
              <span className="font-serif font-bold text-xl md:text-2xl text-primary leading-none tracking-tight">
                Tare Pet
              </span>
              <span className="font-sans text-[9px] md:text-[11px] uppercase tracking-[0.18em] text-secondary font-semibold mt-0.5">
                montessori school
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            <ul className="flex items-center gap-1 bg-white/40 p-1.5 rounded-full border border-white/50 backdrop-blur-md">
              {NAV_LINKS.map((link) => {
                const isActive = location === link.href;
                return (
                  <li key={link.href} className="relative">
                    <Link
                      href={link.href}
                      onMouseEnter={() => setHoveredPath(link.href)}
                      onMouseLeave={() => setHoveredPath(null)}
                      className={`relative z-10 px-4 py-2 rounded-full font-sans text-xs font-semibold tracking-wide transition-colors duration-300 flex items-center gap-1 ${
                        isActive
                          ? "text-primary font-bold"
                          : "text-foreground/80 hover:text-foreground"
                      }`}
                    >
                      {link.label}
                    </Link>

                    {/* Active Link Glass Pill */}
                    {isActive && (
                      <motion.div
                        layoutId="activePill"
                        className="absolute inset-0 bg-white/90 border border-primary/20 rounded-full shadow-sm -z-0"
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      />
                    )}

                    {/* Hover Link Glass Glow */}
                    {hoveredPath === link.href && !isActive && (
                      <motion.div
                        layoutId="hoverPill"
                        className="absolute inset-0 bg-white/50 rounded-full -z-0"
                        transition={{ type: "spring", stiffness: 350, damping: 25 }}
                      />
                    )}
                  </li>
                );
              })}
            </ul>

            <Link
              href="/sign-in"
              className="ml-3 relative group inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white bg-gradient-to-r from-primary via-primary/95 to-primary/90 shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 transition-all duration-300 hover:scale-105 active:scale-95"
            >
              <LogIn className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
              <span>Portal Login</span>
              <span className="absolute inset-0 rounded-full border border-white/30 pointer-events-none" />
            </Link>
          </nav>

          {/* Animated Hamburger Button for Mobile */}
          <button
            className="md:hidden relative z-[110] w-10 h-10 rounded-full bg-white/85 backdrop-blur-md border border-white/90 shadow-md flex items-center justify-center focus:outline-none hover:bg-white transition-all active:scale-95"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <div className="w-4.5 h-3.5 flex flex-col justify-between items-center relative">
              <motion.span
                animate={mobileMenuOpen ? { rotate: 45, y: 6 } : { rotate: 0, y: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="w-4.5 h-0.5 bg-foreground rounded-full transform origin-center"
              />
              <motion.span
                animate={mobileMenuOpen ? { opacity: 0, x: -10 } : { opacity: 1, x: 0 }}
                transition={{ duration: 0.2 }}
                className="w-4.5 h-0.5 bg-primary rounded-full"
              />
              <motion.span
                animate={mobileMenuOpen ? { rotate: -45, y: -8 } : { rotate: 0, y: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="w-4.5 h-0.5 bg-foreground rounded-full transform origin-center"
              />
            </div>
          </button>
        </div>
      </div>

      {/* Full-Screen Glass Overlay Mobile Navigation */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            key="mobile-overlay"
            initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
            animate={{ opacity: 1, backdropFilter: "blur(28px)" }}
            exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
            transition={{ duration: 0.35, ease: "easeInOut" }}
            className="fixed inset-0 top-0 left-0 w-screen h-screen z-[105] glass-overlay flex flex-col justify-between p-6 pt-6 md:hidden overflow-y-auto"
          >
            {/* Ambient Background Glass Glow Spheres */}
            <div className="absolute top-10 right-10 w-72 h-72 rounded-full bg-primary/15 blur-3xl pointer-events-none animate-pulse" />
            <div className="absolute bottom-10 left-10 w-72 h-72 rounded-full bg-secondary/15 blur-3xl pointer-events-none animate-pulse" />

            {/* Mobile Overlay Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/40 relative z-10">
              <Link href="/" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2.5">
                <img src={tarepetLogo} alt="Tare Pet Logo" className="w-9 h-9 object-contain" />
                <div className="flex flex-col">
                  <span className="font-serif font-bold text-xl text-primary leading-none">Tare Pet</span>
                  <span className="font-sans text-[9px] uppercase tracking-[0.16em] text-secondary font-semibold mt-0.5">
                    montessori school
                  </span>
                </div>
              </Link>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="w-9 h-9 rounded-full bg-white/80 backdrop-blur-md border border-white/80 flex items-center justify-center text-foreground/70 hover:text-foreground active:scale-95 transition-all"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Nav links with staggered text animations */}
            <nav className="my-auto py-6 relative z-10">
              <motion.ul
                initial="closed"
                animate="open"
                exit="closed"
                variants={{
                  open: {
                    transition: { staggerChildren: 0.07, delayChildren: 0.1 },
                  },
                  closed: {
                    transition: { staggerChildren: 0.04, staggerDirection: -1 },
                  },
                }}
                className="flex flex-col gap-2.5"
              >
                {NAV_LINKS.map((link, idx) => {
                  const isActive = location === link.href;
                  return (
                    <motion.li
                      key={link.href}
                      variants={{
                        open: {
                          opacity: 1,
                          y: 0,
                          rotateX: 0,
                          transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] },
                        },
                        closed: {
                          opacity: 0,
                          y: 30,
                          rotateX: 20,
                          transition: { duration: 0.25 },
                        },
                      }}
                    >
                      <Link
                        href={link.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`group flex items-center justify-between p-3.5 rounded-2xl transition-all duration-300 ${
                          isActive
                            ? "bg-white/90 border border-primary/30 shadow-md shadow-primary/5 text-primary font-bold"
                            : "hover:bg-white/60 text-foreground/85 hover:text-foreground"
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <span className="font-sans text-xs font-bold tracking-widest text-primary/60">
                            0{idx + 1}
                          </span>
                          <span className="font-serif text-2xl font-bold tracking-tight transition-transform duration-300 group-hover:translate-x-1">
                            {link.label}
                          </span>
                        </div>
                        <ArrowRight className="w-5 h-5 text-primary/40 group-hover:text-primary group-hover:translate-x-1.5 transition-all duration-300" />
                      </Link>
                    </motion.li>
                  );
                })}
              </motion.ul>
            </nav>

            {/* Bottom Actions inside Overlay */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 15 }}
              transition={{ delay: 0.35, duration: 0.3 }}
              className="pt-4 border-t border-white/40 flex flex-col gap-3 relative z-10"
            >
              <Link
                href="/sign-in"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-center gap-2 rounded-full py-3.5 px-6 font-sans text-sm font-bold uppercase tracking-wider text-white bg-gradient-to-r from-primary to-primary/90 shadow-xl shadow-primary/25 active:scale-95 transition-transform"
              >
                <LogIn className="w-4 h-4" />
                <span>Portal Login</span>
              </Link>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
