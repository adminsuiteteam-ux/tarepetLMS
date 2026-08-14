import { PageTransition } from "@/components/layout/Layout";
import { Link } from "wouter";
import { motion, useInView, animate } from "framer-motion";
import { useRef, useEffect, useState } from "react";
import { ArrowRight, BookOpen, Heart, Users, CheckCircle2, Quote, Sparkles, GraduationCap, Globe, Building2, HeartHandshake } from "lucide-react";
import heroImg from "@assets/classroom_hero.jpg";
import philosophyImg from "@assets/school_building.jpg";
import vibrantCampusImg from "@assets/vibrant_campus.jpg";
import { GlareCard } from "@/components/ui/glare-card";
import BackgroundNoiseEffect from "@/components/ui/background-snippets-noise-effect11";
import { StaggerTestimonials } from "@/components/ui/stagger-testimonials";

function Counter({ target, suffix = "", duration = 2 }: { target: number; suffix?: string; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: false, amount: 0.3 });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (isInView) {
      const controls = animate(0, target, {
        duration,
        ease: "easeOut",
        onUpdate(value) {
          setCount(Math.floor(value));
        },
      });
      return () => {
        controls.stop();
      };
    } else {
      setCount(0);
      return undefined;
    }
  }, [isInView, target, duration]);

  return <span ref={ref}>{count}{suffix}</span>;
}

export default function Home() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = true;
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.log("Video autoplay initialized with fallback:", err);
        });
      }
    }
  }, []);

  return (
    <PageTransition>
      {/* Hero Section with Background Image */}
      <section className="relative min-h-[95vh] flex items-center pt-28 md:pt-36 pb-20 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src={heroImg}
            alt="Tare Pet Montessori School Citadel of Praise Campus Building"
            className="w-full h-full object-cover object-center scale-105 opacity-95 brightness-100"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-black/20" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-black/25" />
        </div>
        
        <div className="container mx-auto px-4 md:px-6 relative z-10">
          <div className="max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full glass-button text-white text-xs md:text-sm font-semibold mb-6 shadow-xl"
            >
              <span className="w-2.5 h-2.5 rounded-full bg-primary animate-ping" />
              <span>Admissions open for 2025/2026</span>
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="text-5xl md:text-7xl font-serif font-bold text-white leading-[1.1] mb-6 tracking-tight"
            >
              Nurturing <span className="text-primary italic font-light hover:text-white transition-colors duration-300">Excellence</span> <br/>in Every Child.
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="text-lg md:text-xl text-white/90 mb-10 max-w-2xl font-sans leading-relaxed font-normal"
            >
              Tare Pet Montessori School provides a premium, holistic education in Yenagoa. Offering Nursery, Primary, Junior & Senior Secondary, Boarding, and Special Education.
            </motion.p>
            
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <Link 
                href="/sign-in" 
                className="inline-flex items-center justify-center rounded-full text-base font-semibold transition-all duration-300 bg-gradient-to-r from-primary to-primary/90 text-white hover:shadow-2xl hover:shadow-primary/40 hover:scale-105 active:scale-95 h-14 px-8 py-3 group"
              >
                Portal Login
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1.5 transition-transform duration-300" />
              </Link>
              <Link 
                href="/about" 
                className="inline-flex items-center justify-center rounded-full text-base font-semibold transition-all duration-300 glass-button text-white hover:bg-white/20 hover:scale-105 active:scale-95 h-14 px-8 py-3"
              >
                Discover Our Method
              </Link>
            </motion.div>
          </div>
        </div>
      </section>


      {/* Programs Preview section with 5 School Programs */}
      <section className="py-24 bg-background relative overflow-hidden">
        <div className="container mx-auto px-4 md:px-6">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto mb-16"
          >
            <h2 className="text-xs font-bold tracking-widest text-primary uppercase mb-3 px-3.5 py-1 rounded-full bg-primary/10 inline-block">
              Academic Journey
            </h2>
            <h3 className="text-4xl md:text-5xl font-serif font-bold text-foreground mb-6">Programs for Every Stage</h3>
            <p className="text-muted-foreground text-lg">Nursery, Primary, Junior & Senior Secondary, Boarding Facilities, and Special Education.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {/* Program 1: Nursery */}
            <motion.div 
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, margin: "-30px" }}
              transition={{ duration: 0.5 }}
              whileHover={{ y: -8, scale: 1.02 }}
              className="glass-card rounded-3xl p-6 border border-white/80 shadow-md hover:shadow-2xl hover:border-primary/40 group relative flex flex-col justify-between transition-all duration-500"
            >
              <div>
                <div className="w-12 h-12 bg-secondary/15 rounded-2xl flex items-center justify-center mb-5 text-secondary group-hover:bg-secondary group-hover:text-white transition-all duration-300 shadow-sm group-hover:scale-110">
                  <Heart className="w-6 h-6" />
                </div>
                <h4 className="text-xl font-serif font-bold mb-2 text-foreground group-hover:text-primary transition-colors">Nursery</h4>
                <p className="text-muted-foreground text-xs leading-relaxed mb-4">Early childhood Montessori learning fostering curiosity and independence.</p>
              </div>
              <Link href="/programs" className="inline-flex items-center text-xs text-primary font-bold hover:underline group-hover:translate-x-1 transition-transform">
                Learn More <ArrowRight className="ml-1 w-3.5 h-3.5" />
              </Link>
            </motion.div>

            {/* Program 2: Primary */}
            <motion.div 
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, margin: "-30px" }}
              transition={{ duration: 0.5, delay: 0.1 }}
              whileHover={{ y: -8, scale: 1.02 }}
              className="glass-card rounded-3xl p-6 border border-white/80 shadow-md hover:shadow-2xl hover:border-primary/40 group relative flex flex-col justify-between transition-all duration-500"
            >
              <div>
                <div className="w-12 h-12 bg-primary/15 rounded-2xl flex items-center justify-center mb-5 text-primary group-hover:bg-primary group-hover:text-white transition-all duration-300 shadow-sm group-hover:scale-110">
                  <BookOpen className="w-6 h-6" />
                </div>
                <h4 className="text-xl font-serif font-bold mb-2 text-foreground group-hover:text-primary transition-colors">Primary</h4>
                <p className="text-muted-foreground text-xs leading-relaxed mb-4">Structured cosmic education building critical reasoning and moral values.</p>
              </div>
              <Link href="/programs" className="inline-flex items-center text-xs text-primary font-bold hover:underline group-hover:translate-x-1 transition-transform">
                Learn More <ArrowRight className="ml-1 w-3.5 h-3.5" />
              </Link>
            </motion.div>

            {/* Program 3: Secondary */}
            <motion.div 
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, margin: "-30px" }}
              transition={{ duration: 0.5, delay: 0.2 }}
              whileHover={{ y: -8, scale: 1.02 }}
              className="glass-card rounded-3xl p-6 border border-white/80 shadow-md hover:shadow-2xl hover:border-primary/40 group relative flex flex-col justify-between transition-all duration-500"
            >
              <div>
                <div className="w-12 h-12 bg-secondary/15 rounded-2xl flex items-center justify-center mb-5 text-secondary group-hover:bg-secondary group-hover:text-white transition-all duration-300 shadow-sm group-hover:scale-110">
                  <Users className="w-6 h-6" />
                </div>
                <h4 className="text-xl font-serif font-bold mb-2 text-foreground group-hover:text-primary transition-colors">Secondary</h4>
                <p className="text-muted-foreground text-xs leading-relaxed mb-4">Junior & Senior Secondary excellence preparing students for WAEC/NECO/JAMB & leadership.</p>
              </div>
              <Link href="/programs" className="inline-flex items-center text-xs text-primary font-bold hover:underline group-hover:translate-x-1 transition-transform">
                Learn More <ArrowRight className="ml-1 w-3.5 h-3.5" />
              </Link>
            </motion.div>

            {/* Program 4: Boarding School */}
            <motion.div 
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, margin: "-30px" }}
              transition={{ duration: 0.5, delay: 0.3 }}
              whileHover={{ y: -8, scale: 1.02 }}
              className="glass-card rounded-3xl p-6 border border-white/80 shadow-md hover:shadow-2xl hover:border-primary/40 group relative flex flex-col justify-between transition-all duration-500"
            >
              <div>
                <div className="w-12 h-12 bg-primary/15 rounded-2xl flex items-center justify-center mb-5 text-primary group-hover:bg-primary group-hover:text-white transition-all duration-300 shadow-sm group-hover:scale-110">
                  <Building2 className="w-6 h-6" />
                </div>
                <h4 className="text-xl font-serif font-bold mb-2 text-foreground group-hover:text-primary transition-colors">Boarding</h4>
                <p className="text-muted-foreground text-xs leading-relaxed mb-4">Secure residential boarding facilities with 24/7 care and study sessions.</p>
              </div>
              <Link href="/programs" className="inline-flex items-center text-xs text-primary font-bold hover:underline group-hover:translate-x-1 transition-transform">
                Learn More <ArrowRight className="ml-1 w-3.5 h-3.5" />
              </Link>
            </motion.div>

            {/* Program 5: Special School */}
            <motion.div 
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, margin: "-30px" }}
              transition={{ duration: 0.5, delay: 0.4 }}
              whileHover={{ y: -8, scale: 1.02 }}
              className="glass-card rounded-3xl p-6 border border-white/80 shadow-md hover:shadow-2xl hover:border-primary/40 group relative flex flex-col justify-between transition-all duration-500"
            >
              <div>
                <div className="w-12 h-12 bg-secondary/15 rounded-2xl flex items-center justify-center mb-5 text-secondary group-hover:bg-secondary group-hover:text-white transition-all duration-300 shadow-sm group-hover:scale-110">
                  <HeartHandshake className="w-6 h-6" />
                </div>
                <h4 className="text-xl font-serif font-bold mb-2 text-foreground group-hover:text-primary transition-colors">Special Needs</h4>
                <p className="text-muted-foreground text-xs leading-relaxed mb-4">Dedicated inclusive special education unit tailored for individual growth.</p>
              </div>
              <Link href="/programs" className="inline-flex items-center text-xs text-primary font-bold hover:underline group-hover:translate-x-1 transition-transform">
                Learn More <ArrowRight className="ml-1 w-3.5 h-3.5" />
              </Link>
            </motion.div>

          </div>
        </div>
      </section>

      {/* School Highlights — GlareCard Section with Noise Background */}
      <section className="py-24 overflow-hidden relative bg-[#0b140d] text-white">
        <BackgroundNoiseEffect variant="dark" />
        <div className="container mx-auto px-4 md:px-6 relative z-10">
          <div className="text-center max-w-5xl mx-auto mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="flex flex-wrap items-center justify-center gap-3 md:gap-4 mb-6"
            >
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/25 border border-primary/50 text-white text-xs font-bold uppercase tracking-wider shadow-sm shrink-0">
                <Sparkles className="w-4 h-4 text-white" />
                <span>The Tare Pet Experience</span>
              </div>
              <h3 className="text-2xl sm:text-4xl md:text-5xl font-serif font-bold text-white tracking-tight drop-shadow-md">
                Where Excellence Meets Wonder
              </h3>
            </motion.div>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-white/90 text-lg font-medium leading-relaxed max-w-2xl mx-auto"
            >
              Hover over each card to experience our school's story come alive.
            </motion.p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-center justify-items-center max-w-6xl mx-auto">
            {/* Card 1 — Slide in from Left */}
            <motion.div
              initial={{ opacity: 0, x: -80 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: false, margin: "-50px" }}
              transition={{ duration: 0.7 }}
              className="w-full flex justify-center"
            >
              <GlareCard className="flex flex-col items-center justify-center gap-5 p-8">
                <div className="w-16 h-16 rounded-full flex items-center justify-center border" style={{ background: "rgba(196,30,58,0.3)", borderColor: "rgba(255,255,255,0.4)" }}>
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                <div className="text-center">
                  <p className="font-bold text-white text-xl font-serif mb-2">Award-Winning</p>
                  <p className="text-white/80 text-sm leading-relaxed">
                    Recognised as one of Bayelsa's leading Montessori institutions with over two decades of educational excellence.
                  </p>
                </div>
                <div className="text-xs font-bold tracking-widest uppercase text-white bg-primary/40 px-3 py-1 rounded-full border border-primary/50">Est. 2002 · Yenagoa</div>
              </GlareCard>
            </motion.div>

            {/* Card 2 — Slide in from Center/Bottom */}
            <motion.div
              initial={{ opacity: 0, y: 80 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, margin: "-50px" }}
              transition={{ duration: 0.7, delay: 0.15 }}
              className="w-full flex justify-center"
            >
              <GlareCard className="flex flex-col items-center justify-center relative overflow-hidden">
                <img
                  className="h-full w-full absolute inset-0 object-cover opacity-80"
                  src={vibrantCampusImg}
                  alt="Tare Pet Montessori Classroom with Students and Teacher"
                />
                <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(11,20,13,0.95) 0%, rgba(11,20,13,0.4) 50%, transparent 100%)" }} />
                <div className="relative z-10 absolute bottom-0 left-0 right-0 p-7">
                  <div className="w-8 h-1 rounded-full mb-3 bg-white" />
                  <p className="font-bold text-white text-lg font-serif mb-1">Vibrant Campus Life</p>
                  <p className="text-white/90 text-sm font-medium">
                    A safe, inspiring environment where every child thrives and every day is an adventure in learning.
                  </p>
                </div>
              </GlareCard>
            </motion.div>

            {/* Card 3 — Slide in from Right */}
            <motion.div
              initial={{ opacity: 0, x: 80 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: false, margin: "-50px" }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="w-full flex justify-center"
            >
              <GlareCard className="flex flex-col items-start justify-end py-8 px-7 gap-3">
                <div className="w-14 h-14 rounded-full flex items-center justify-center border mb-2" style={{ background: "rgba(45,122,70,0.4)", borderColor: "rgba(255,255,255,0.4)" }}>
                  <GraduationCap className="w-7 h-7 text-white" />
                </div>
                <p className="font-bold text-white text-xl font-serif">100% Transition Rate</p>
                <p className="font-normal text-sm text-white/80 leading-relaxed">
                  Every graduating student from Tare Pet transitions successfully to their chosen secondary school or university.
                </p>
                <Link href="/admissions" className="inline-flex items-center text-sm font-bold text-white hover:underline transition-colors group mt-1">
                  Apply Today <ArrowRight className="ml-1 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </GlareCard>
            </motion.div>
          </div>

          {/* High Visibility Auto Counting Stats Text (No Card Containers) */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 mt-16 pt-10 border-t border-white/15"
          >
            {[
              { target: 15, suffix: "+", label: "Years of Excellence" },
              { target: 500, suffix: "+", label: "Students Enrolled" },
              { target: 40, suffix: "+", label: "Qualified Educators" },
              { target: 100, suffix: "%", label: "Parent Satisfaction" },
            ].map((stat, i) => (
              <div key={i} className="text-center py-4">
                <p className="text-5xl md:text-6xl font-serif font-black text-white mb-2 tracking-tight drop-shadow-lg">
                  <Counter target={stat.target} suffix={stat.suffix} />
                </p>
                <p className="text-white/90 font-bold text-base md:text-lg tracking-wide">
                  {stat.label}
                </p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Why Montessori Section */}
      <section className="py-24 bg-secondary text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />

        <div className="container mx-auto px-4 md:px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -70 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
            >
              <h2 className="text-xs font-bold tracking-widest text-primary-foreground/80 uppercase mb-3 px-3 py-1 rounded-full bg-white/10 inline-block">
                The Tare Pet Difference
              </h2>
              <h3 className="text-4xl md:text-5xl font-serif font-bold mb-8">Why Choose Our Montessori Approach?</h3>
              
              <ul className="space-y-6">
                <li className="flex gap-4 group">
                  <CheckCircle2 className="w-6 h-6 text-primary shrink-0 mt-1 group-hover:scale-110 transition-transform" />
                  <div>
                    <h4 className="text-xl font-bold mb-2 group-hover:text-primary-foreground transition-colors">Child-Centered Learning</h4>
                    <p className="text-white/80 leading-relaxed">Our classrooms are designed to allow students to choose activities that match their interests and developmental needs.</p>
                  </div>
                </li>
                <li className="flex gap-4 group">
                  <CheckCircle2 className="w-6 h-6 text-primary shrink-0 mt-1 group-hover:scale-110 transition-transform" />
                  <div>
                    <h4 className="text-xl font-bold mb-2 group-hover:text-primary-foreground transition-colors">Hands-On Materials</h4>
                    <p className="text-white/80 leading-relaxed">We use specialized Montessori materials that make abstract concepts concrete and understandable.</p>
                  </div>
                </li>
                <li className="flex gap-4 group">
                  <CheckCircle2 className="w-6 h-6 text-primary shrink-0 mt-1 group-hover:scale-110 transition-transform" />
                  <div>
                    <h4 className="text-xl font-bold mb-2 group-hover:text-primary-foreground transition-colors">Uninterrupted Work Periods</h4>
                    <p className="text-white/80 leading-relaxed">Long blocks of time allow children to engage deeply with their work, building concentration and focus.</p>
                  </div>
                </li>
              </ul>

              <div className="mt-10">
                <Link href="/about" className="inline-flex items-center text-white font-semibold border-b-2 border-primary pb-1 hover:text-primary transition-colors group">
                  Learn more about our philosophy <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
                </Link>
              </div>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, x: 70 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="relative"
            >
              <div className="aspect-[4/5] rounded-3xl overflow-hidden border-8 border-white/10 shadow-2xl relative z-10 group">
                <img
                  src={philosophyImg}
                  alt="Students engaged in Montessori learning"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-primary/10 mix-blend-overlay z-10" />
              </div>
              <div className="absolute -bottom-8 -left-8 glass-card p-6 rounded-2xl shadow-2xl z-20 max-w-[260px] hidden md:block border border-white/80">
                <p className="font-serif italic text-foreground text-base leading-relaxed">"The greatest sign of success for a teacher is to be able to say, 'The children are now working as if I did not exist.'"</p>
                <p className="text-primary text-xs mt-3 font-bold uppercase tracking-wider">— Maria Montessori</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Parent Voices Section with Interactive Stagger Testimonials */}
      <section className="py-24 bg-muted/40 relative overflow-hidden">
        <div className="container mx-auto px-4 md:px-6">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto mb-10"
          >
            <h2 className="text-4xl font-serif font-bold text-foreground mb-4">Parent Voices</h2>
            <p className="text-muted-foreground text-lg">Hear from the families who have entrusted us with their children's education.</p>
          </motion.div>

          <StaggerTestimonials />
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-background text-center relative overflow-hidden border-t border-border">
        <div className="container mx-auto px-4 md:px-6">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl mx-auto glass-card p-12 rounded-3xl border border-white/80 shadow-2xl relative"
          >
            <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-24 h-24 bg-primary/10 rounded-full blur-xl pointer-events-none" />
            <h2 className="text-4xl md:text-5xl font-serif font-bold text-foreground mb-6">Begin Your Child's Journey</h2>
            <p className="text-muted-foreground text-lg mb-10 leading-relaxed">We invite you to visit our campus in Kpansia-Epie to see our Montessori classrooms in action.</p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link 
                href="/sign-in" 
                className="inline-flex items-center justify-center rounded-full text-base font-semibold bg-gradient-to-r from-primary to-primary/90 text-white hover:shadow-2xl hover:shadow-primary/30 hover:scale-105 h-14 px-8 py-3 active:scale-95 transition-all duration-300"
              >
                Portal Login
              </Link>
              <Link 
                href="/contact" 
                className="inline-flex items-center justify-center rounded-full text-base font-semibold glass-button text-foreground hover:bg-white hover:scale-105 h-14 px-8 py-3 active:scale-95 transition-all duration-300"
              >
                Schedule a Tour
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </PageTransition>
  );
}
