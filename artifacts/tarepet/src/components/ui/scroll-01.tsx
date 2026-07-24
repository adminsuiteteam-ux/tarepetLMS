import {
  motion,
  useScroll,
  useMotionValueEvent,
} from "framer-motion";
import { useRef, useState } from "react";

export type Scroll01Item = {
  title: string;
  description: string;
  media: string;
};

export interface Scroll01Props {
  badge?: string;
  heading?: string;
  subheading?: string;
  items: Scroll01Item[];
}

export function Scroll01({
  badge,
  heading,
  subheading,
  items,
}: Readonly<Scroll01Props>) {
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    const raw = v * items.length;
    const index = Math.min(Math.floor(raw), items.length - 1);
    setActiveIndex(Math.max(0, index));
  });

  return (
    <>
      {/* ── Mobile: simple stacked view ── */}
      <div className="space-y-12 md:hidden py-12 px-4">
        {(badge || heading || subheading) && (
          <div className="text-center max-w-3xl mx-auto mb-8">
            {badge && (
              <p className="text-sm font-bold tracking-widest text-primary uppercase mb-2">
                {badge}
              </p>
            )}
            {heading && (
              <h2 className="text-3xl font-serif font-bold text-foreground mb-3">
                {heading}
              </h2>
            )}
            {subheading && (
              <p className="text-muted-foreground text-base">{subheading}</p>
            )}
          </div>
        )}

        {items.map((item, index) => (
          <article
            key={`mobile-${item.title}-${index}`}
            className="flex flex-col items-start space-y-4 bg-card p-6 rounded-2xl border border-border shadow-sm"
          >
            <div className="space-y-2">
              <h3 className="text-xl font-serif font-bold text-foreground">
                {item.title}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {item.description}
              </p>
            </div>
            <img
              src={item.media}
              alt={item.title}
              className="h-64 w-full rounded-xl object-cover"
            />
          </article>
        ))}
      </div>

      {/* ── Desktop: Pinned viewport section ── */}
      <div
        ref={containerRef}
        className="hidden md:block relative"
        style={{ height: `${items.length * 100}vh` }}
      >
        {/* Sticky full-height viewport container */}
        <div className="sticky top-0 h-screen overflow-hidden flex flex-col justify-between py-8 container mx-auto px-6">
          {/* Integrated Header at top of pinned screen */}
          {(badge || heading || subheading) && (
            <div className="text-center max-w-3xl mx-auto shrink-0 pt-2">
              {badge && (
                <p className="text-sm font-bold tracking-widest text-primary uppercase mb-2">
                  {badge}
                </p>
              )}
              {heading && (
                <h2 className="text-4xl font-serif font-bold text-foreground mb-2">
                  {heading}
                </h2>
              )}
              {subheading && (
                <p className="text-muted-foreground text-base max-w-2xl mx-auto">
                  {subheading}
                </p>
              )}
            </div>
          )}

          {/* Main Stage Grid (Left: Image, Right: Card Quote) */}
          <div className="grow grid grid-cols-2 gap-12 items-center my-auto min-h-0">
            {/* Left: Crossfading Image Panel */}
            <div className="relative h-full max-h-[52vh] overflow-hidden rounded-2xl shadow-xl border border-border/50">
              {items.map((item, index) => (
                <motion.img
                  key={`img-${index}`}
                  src={item.media}
                  alt={item.title}
                  className="absolute inset-0 h-full w-full object-cover"
                  initial={{ opacity: index === 0 ? 1 : 0 }}
                  animate={{ opacity: activeIndex === index ? 1 : 0 }}
                  transition={{ duration: 0.5, ease: "easeInOut" }}
                />
              ))}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background:
                    "linear-gradient(to top, rgba(196,30,58,0.2) 0%, transparent 60%)",
                }}
              />
              <div className="absolute top-4 left-4 bg-slate-950/75 backdrop-blur-md text-white text-xs font-bold px-3 py-1.5 rounded-full border border-white/10">
                Card {activeIndex + 1} of {items.length}
              </div>
            </div>

            {/* Right: Crossfading Testimonial Content */}
            <div className="relative h-full max-h-[52vh] flex flex-col justify-center overflow-hidden pr-6">
              {items.map((item, index) => (
                <motion.div
                  key={`text-${index}`}
                  className="absolute inset-0 flex flex-col justify-center pr-8"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{
                    opacity: activeIndex === index ? 1 : 0,
                    y: activeIndex === index ? 0 : 20,
                    pointerEvents: activeIndex === index ? "auto" : "none",
                  }}
                  transition={{ duration: 0.45, ease: "easeOut" }}
                >
                  <div
                    className="w-12 h-1 rounded-full mb-5"
                    style={{ background: "#C41E3A" }}
                  />
                  <h3 className="text-2xl lg:text-3xl font-serif font-bold text-foreground mb-4 leading-snug">
                    {item.title}
                  </h3>
                  <p className="text-muted-foreground text-base lg:text-lg leading-relaxed">
                    {item.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Bottom Bar Progress */}
          <div className="shrink-0 flex items-center justify-between pt-4 border-t border-border/40 pb-2">
            <div className="flex items-center gap-2">
              {items.map((_, index) => (
                <div
                  key={`bar-${index}`}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    activeIndex === index
                      ? "w-10 bg-primary"
                      : "w-3 bg-muted-foreground/30"
                  }`}
                />
              ))}
            </div>

            <div className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
              Scroll down to view cards ({activeIndex + 1} / {items.length})
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Scroll01;
