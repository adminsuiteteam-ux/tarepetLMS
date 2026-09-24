import { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowRight, 
  ChevronLeft, 
  ChevronRight, 
  Pause, 
  Play, 
  Sparkles, 
  GraduationCap, 
  Laptop, 
  ShieldCheck, 
  CheckCircle2 
} from "lucide-react";

import classroomHeroImg from "@assets/classroom_hero.jpg";
import admissionsHeroImg from "@assets/admissions_hero.jpg";
import programsHeroImg from "@assets/programs_hero.jpg";
import vibrantCampusImg from "@assets/vibrant_campus.jpg";

interface SlideData {
  id: number;
  badge: string;
  badgeIcon: React.ElementType;
  title: string;
  titleHighlight: string;
  subtitle: string;
  primaryBtn: { text: string; href: string };
  secondaryBtn: { text: string; href: string };
  tags: string[];
  image: string;
  imageAlt: string;
}

const slides: SlideData[] = [
  {
    id: 1,
    badge: "Citadel of Praise • Yenagoa, Bayelsa State",
    badgeIcon: Sparkles,
    title: "Nurturing",
    titleHighlight: "Excellence in Every Child",
    subtitle: "Tare Pet Montessori School provides a premium, holistic educational foundation in Yenagoa. Offering Creche, Nursery, Primary, Junior & Senior Secondary, Boarding, and Special Education.",
    primaryBtn: { text: "Student Portal", href: "/sign-in" },
    secondaryBtn: { text: "Discover Our Method", href: "/about" },
    tags: ["Montessori Foundation", "Character & Morals", "Dedicated Educators"],
    image: classroomHeroImg,
    imageAlt: "Students learning in modern Montessori classroom at Tare Pet",
  },
  {
    id: 2,
    badge: "Admissions Ongoing • 2026/2027 Academic Session",
    badgeIcon: GraduationCap,
    title: "Give Your Child a",
    titleHighlight: "World-Class Head Start",
    subtitle: "Enroll your child today in an inspiring learning environment where curiosity, intellectual rigor, and leadership are cultivated from their earliest formative years.",
    primaryBtn: { text: "Apply for Admission", href: "/admissions" },
    secondaryBtn: { text: "Schedule a Campus Tour", href: "/contact" },
    tags: ["Creche to Secondary", "Individualized Attention", "Proven Academic Track Record"],
    image: admissionsHeroImg,
    imageAlt: "Admissions open at Tare Pet Montessori School campus",
  },
  {
    id: 3,
    badge: "Digital Learning & Modern STEM Hub",
    badgeIcon: Laptop,
    title: "Empowering with Modern",
    titleHighlight: "CBT & ICT Facilities",
    subtitle: "Equipped with state-of-the-art computer laboratories, continuous computer-based testing (CBT), and hands-on science labs to prepare students for national and global excellence.",
    primaryBtn: { text: "Explore Academic Programs", href: "/programs" },
    secondaryBtn: { text: "View Student Portal", href: "/sign-in" },
    tags: ["WAEC & JAMB CBT Ready", "High-Speed ICT Labs", "STEM & Digital Skills"],
    image: programsHeroImg,
    imageAlt: "Students practicing computer and science skills in ICT lab",
  },
  {
    id: 4,
    badge: "Safe Boarding & Vibrant Campus",
    badgeIcon: ShieldCheck,
    title: "A Secure, Serene &",
    titleHighlight: "Thriving Community",
    subtitle: "Modern boarding hostels, round-the-clock security, loving pastoral care, spacious sports amenities, and rich extracurricular clubs where every learner flourishes.",
    primaryBtn: { text: "Explore Campus Life", href: "/about" },
    secondaryBtn: { text: "Contact Bursary & Admin", href: "/contact" },
    tags: ["24/7 Monitored Campus", "Sports & Creative Arts", "Loving Pastoral Care"],
    image: vibrantCampusImg,
    imageAlt: "Vibrant campus activities and facilities at Tare Pet Montessori",
  },
];

const AUTOPLAY_INTERVAL = 6500; // 6.5 seconds

export function HeroCarousel() {
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [direction, setDirection] = useState(1);
  const touchStartX = useRef<number | null>(null);

  const nextSlide = useCallback(() => {
    setDirection(1);
    setCurrent((prev) => (prev + 1) % slides.length);
  }, []);

  const prevSlide = useCallback(() => {
    setDirection(-1);
    setCurrent((prev) => (prev - 1 + slides.length) % slides.length);
  }, []);

  const goToSlide = (index: number) => {
    setDirection(index > current ? 1 : -1);
    setCurrent(index);
  };

  // Autoplay effect
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(nextSlide, AUTOPLAY_INTERVAL);
    return () => clearInterval(interval);
  }, [isPaused, nextSlide]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") prevSlide();
      if (e.key === "ArrowRight") nextSlide();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [nextSlide, prevSlide]);

  // Touch swipe support
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX;
    if (diff > 50) {
      nextSlide();
    } else if (diff < -50) {
      prevSlide();
    }
    touchStartX.current = null;
  };

  const activeSlide = slides[current];
  const BadgeIcon = activeSlide.badgeIcon;

  return (
    <section 
      className="relative min-h-[92vh] lg:min-h-[96vh] flex items-center pt-28 md:pt-36 pb-20 overflow-hidden select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      aria-label="Tare Pet Montessori School Hero Showcase"
    >
      {/* Background Slides with AnimatePresence */}
      <div className="absolute inset-0 z-0">
        <AnimatePresence initial={false} mode="sync">
          <motion.div
            key={activeSlide.id}
            initial={{ opacity: 0, scale: 1.08 }}
            animate={{ opacity: 1, scale: 1.0 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0 w-full h-full"
          >
            <img
              src={activeSlide.image}
              alt={activeSlide.imageAlt}
              className="w-full h-full object-cover object-center"
            />
            {/* Multi-layered cinematic gradients for optimal legibility */}
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-slate-950/60 to-slate-950/30" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-slate-950/40" />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Slide Content */}
      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <div className="max-w-3xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSlide.id}
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.55, ease: "easeOut" }}
              className="space-y-6"
            >
              {/* Category / Campus Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-xs sm:text-sm font-medium shadow-lg">
                <BadgeIcon className="w-4 h-4 text-primary animate-pulse" />
                <span>{activeSlide.badge}</span>
              </div>

              {/* Slide Headline */}
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-serif font-bold text-white leading-[1.1] tracking-tight drop-shadow-md">
                {activeSlide.title}{" "}
                <span className="text-primary italic font-light hover:text-white transition-colors duration-300 block sm:inline">
                  {activeSlide.titleHighlight}
                </span>
              </h1>

              {/* Subtitle / Description */}
              <p className="text-base sm:text-lg md:text-xl text-white/90 max-w-2xl font-sans leading-relaxed font-normal drop-shadow">
                {activeSlide.subtitle}
              </p>

              {/* Key Highlights / Tags */}
              <div className="flex flex-wrap gap-2.5 pt-1">
                {activeSlide.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/40 backdrop-blur-sm border border-white/15 text-white/90 text-xs sm:text-sm font-medium"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                    {tag}
                  </span>
                ))}
              </div>

              {/* Call-to-Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 pt-3">
                <Link
                  href={activeSlide.primaryBtn.href}
                  className="inline-flex items-center justify-center rounded-full text-base font-semibold transition-all duration-300 bg-gradient-to-r from-primary to-primary/90 text-white hover:shadow-2xl hover:shadow-primary/40 hover:scale-105 active:scale-95 h-13 sm:h-14 px-8 py-3 group"
                >
                  {activeSlide.primaryBtn.text}
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1.5 transition-transform duration-300" />
                </Link>
                <Link
                  href={activeSlide.secondaryBtn.href}
                  className="inline-flex items-center justify-center rounded-full text-base font-semibold transition-all duration-300 glass-button text-white hover:bg-white/20 hover:scale-105 active:scale-95 h-13 sm:h-14 px-8 py-3"
                >
                  {activeSlide.secondaryBtn.text}
                </Link>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Navigation Arrows (Prev / Next) */}
      <div className="absolute inset-y-0 left-0 right-0 z-20 flex items-center justify-between px-2 sm:px-6 pointer-events-none">
        <button
          onClick={prevSlide}
          aria-label="Previous slide"
          className="pointer-events-auto w-11 h-11 sm:w-13 sm:h-13 rounded-full bg-black/30 hover:bg-black/60 backdrop-blur-md border border-white/20 text-white flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 hover:border-primary cursor-pointer shadow-lg"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <button
          onClick={nextSlide}
          aria-label="Next slide"
          className="pointer-events-auto w-11 h-11 sm:w-13 sm:h-13 rounded-full bg-black/30 hover:bg-black/60 backdrop-blur-md border border-white/20 text-white flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 hover:border-primary cursor-pointer shadow-lg"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>

      {/* Bottom Carousel Controls: Indicators & Play/Pause */}
      <div className="absolute bottom-6 sm:bottom-8 left-0 right-0 z-20 flex items-center justify-between px-4 md:px-8 max-w-7xl mx-auto">
        {/* Slide Indicators */}
        <div className="flex items-center gap-2 sm:gap-3 bg-black/30 backdrop-blur-md px-4 py-2 rounded-full border border-white/15">
          {slides.map((slide, index) => {
            const isActive = index === current;
            return (
              <button
                key={slide.id}
                onClick={() => goToSlide(index)}
                aria-label={`Go to slide ${index + 1}: ${slide.title}`}
                className="group relative py-1 focus:outline-none cursor-pointer"
              >
                <div
                  className={`h-2 rounded-full transition-all duration-400 ${
                    isActive 
                      ? "w-8 sm:w-10 bg-primary shadow-sm shadow-primary/60" 
                      : "w-2.5 sm:w-3 bg-white/40 group-hover:bg-white/70"
                  }`}
                />
              </button>
            );
          })}
          <span className="text-white/60 text-xs font-mono pl-1">
            0{current + 1} / 0{slides.length}
          </span>
        </div>

        {/* Autoplay Pause / Play Toggle */}
        <button
          onClick={() => setIsPaused((prev) => !prev)}
          aria-label={isPaused ? "Play slideshow" : "Pause slideshow"}
          className="bg-black/30 hover:bg-black/60 backdrop-blur-md border border-white/15 text-white/80 hover:text-white p-2.5 rounded-full transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer flex items-center gap-1.5 text-xs font-medium"
        >
          {isPaused ? (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              <span className="hidden sm:inline">Play</span>
            </>
          ) : (
            <>
              <Pause className="w-3.5 h-3.5 fill-current" />
              <span className="hidden sm:inline">Pause</span>
            </>
          )}
        </button>
      </div>
    </section>
  );
}
