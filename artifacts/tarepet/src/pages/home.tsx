import { PageTransition } from "@/components/layout/Layout";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { useRef, useEffect } from "react";
import { ArrowRight, BookOpen, Heart, Users, CheckCircle2, Quote, Sparkles, GraduationCap, Globe } from "lucide-react";
import heroImg from "@assets/generated_images/hero.jpg";
import philosophyImg from "@assets/generated_images/programs.jpg";
import { GlareCard } from "@/components/ui/glare-card";
import BackgroundNoiseEffect from "@/components/ui/background-snippets-noise-effect11";

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
      {/* Hero Section with Video Background — Full coverage from top-0 (No white space) */}
      <section className="relative min-h-[95vh] flex items-center pt-28 md:pt-36 pb-20 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <video
            ref={videoRef}
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            poster={heroImg}
            className="w-full h-full object-cover scale-105"
          >
            <source
              src="https://assets.mixkit.co/videos/preview/mixkit-children-in-a-classroom-setting-42774-large.mp4"
              type="video/mp4"
            />
            <source
              src="https://cdn.coverr.co/videos/coverr-children-playing-and-learning-5536/1080p.mp4"
              type="video/mp4"
            />
          </video>
          <div className="absolute inset-0 bg-gradient-to-r from-secondary/95 via-secondary/80 to-secondary/50 mix-blend-multiply" />
          <div className="absolute inset-0 bg-black/45 backdrop-blur-[2px]" />
        </div>

        {/* Ambient Floating Glass Spheres */}
        <div className="absolute top-20 right-10 w-96 h-96 bg-primary/25 rounded-full blur-3xl pointer-events-none animate-pulse" />
        <div className="absolute bottom-10 left-10 w-96 h-96 bg-secondary/35 rounded-full blur-3xl pointer-events-none animate-pulse" />
        
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
              Tare Pet Montessori School provides a premium, holistic education in Yenagoa. We empower students to discover their potential through guided independence and rich academics.
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

      {/* Motto / Philosophy Banner */}
      <section className="bg-gradient-to-r from-primary via-primary/95 to-primary/90 py-12 relative overflow-hidden shadow-inner">
        <div className="absolute inset-0 glass-shimmer pointer-events-none opacity-20" />
        <div className="container mx-auto px-4 md:px-6 relative z-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false }}
              transition={{ duration: 0.6 }}
              className="text-3xl md:text-4xl font-serif text-white text-center md:text-left"
            >
              "Not to Knowledge <span className="italic font-light">is Power."</span>
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="text-white/90 max-w-xl text-center md:text-right text-lg font-sans"
            >
              Our guiding principle emphasizes that true power comes not just from holding knowledge, but from seeking it actively and applying it thoughtfully.
            </motion.p>
          </div>
        </div>
      </section>

      {/* Programs Preview with Alternating Left & Right Slide-In Cards */}
      <section className="py-24 bg-background relative overflow-hidden">
        <div className="container mx-auto px-4 md:px-6">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto mb-16"
          >
            <h2 className="text-xs font-bold tracking-widest text-primary uppercase mb-3 px-3.5 py-1 rounded-full bg-primary/10 inline-block">
              Academic Journey
            </h2>
            <h3 className="text-4xl md:text-5xl font-serif font-bold text-foreground mb-6">Programs for Every Stage</h3>
            <p className="text-muted-foreground text-lg">From their first steps to secondary school graduation, we provide a seamless, enriching educational pathway.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Program 1 — Slide in from Left */}
            <motion.div 
              initial={{ opacity: 0, x: -70 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: false, margin: "-50px" }}
              transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
              whileHover={{ y: -8, scale: 1.02 }}
              className="glass-card rounded-3xl p-8 border border-white/80 shadow-md hover:shadow-2xl hover:border-primary/40 group relative overflow-hidden transition-all duration-500"
            >
              <div className="w-14 h-14 bg-secondary/15 rounded-2xl flex items-center justify-center mb-6 text-secondary group-hover:bg-secondary group-hover:text-white transition-all duration-300 shadow-sm group-hover:scale-110">
                <Heart className="w-7 h-7" />
              </div>
              <h4 className="text-2xl font-serif font-bold mb-3 text-foreground group-hover:text-primary transition-colors">Nursery</h4>
              <p className="text-muted-foreground mb-6 line-clamp-3 leading-relaxed">A nurturing environment where our youngest learners build a foundation of curiosity, independence, and basic skills through the Montessori method.</p>
              <Link href="/programs" className="inline-flex items-center text-primary font-semibold hover:underline group-hover:translate-x-1.5 transition-transform duration-300">
                Explore Nursery <ArrowRight className="ml-1.5 w-4 h-4" />
              </Link>
            </motion.div>

            {/* Program 2 — Slide in from Bottom/Float Up */}
            <motion.div 
              initial={{ opacity: 0, y: 70 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, margin: "-50px" }}
              transition={{ duration: 0.65, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              whileHover={{ y: -8, scale: 1.02 }}
              className="glass-card rounded-3xl p-8 border border-white/80 shadow-md hover:shadow-2xl hover:border-primary/40 group relative overflow-hidden transition-all duration-500"
            >
              <div className="w-14 h-14 bg-primary/15 rounded-2xl flex items-center justify-center mb-6 text-primary group-hover:bg-primary group-hover:text-white transition-all duration-300 shadow-sm group-hover:scale-110">
                <BookOpen className="w-7 h-7" />
              </div>
              <h4 className="text-2xl font-serif font-bold mb-3 text-foreground group-hover:text-primary transition-colors">Primary</h4>
              <p className="text-muted-foreground mb-6 line-clamp-3 leading-relaxed">Fostering critical thinking and a deeper understanding of the world. Students engage in structured learning while maintaining their creative freedom.</p>
              <Link href="/programs" className="inline-flex items-center text-primary font-semibold hover:underline group-hover:translate-x-1.5 transition-transform duration-300">
                Explore Primary <ArrowRight className="ml-1.5 w-4 h-4" />
              </Link>
            </motion.div>

            {/* Program 3 — Slide in from Right */}
            <motion.div 
              initial={{ opacity: 0, x: 70 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: false, margin: "-50px" }}
              transition={{ duration: 0.65, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              whileHover={{ y: -8, scale: 1.02 }}
              className="glass-card rounded-3xl p-8 border border-white/80 shadow-md hover:shadow-2xl hover:border-primary/40 group relative overflow-hidden transition-all duration-500"
            >
              <div className="w-14 h-14 bg-secondary/15 rounded-2xl flex items-center justify-center mb-6 text-secondary group-hover:bg-secondary group-hover:text-white transition-all duration-300 shadow-sm group-hover:scale-110">
                <Users className="w-7 h-7" />
              </div>
              <h4 className="text-2xl font-serif font-bold mb-3 text-foreground group-hover:text-primary transition-colors">Secondary</h4>
              <p className="text-muted-foreground mb-6 line-clamp-3 leading-relaxed">Junior and Senior Secondary programs designed to prepare students for leadership, academic excellence, and success in higher education.</p>
              <Link href="/programs" className="inline-flex items-center text-primary font-semibold hover:underline group-hover:translate-x-1.5 transition-transform duration-300">
                Explore Secondary <ArrowRight className="ml-1.5 w-4 h-4" />
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* School Highlights — GlareCard Section with Noise Background */}
      <section className="py-24 overflow-hidden relative">
        <BackgroundNoiseEffect variant="dark" />
        <div className="container mx-auto px-4 md:px-6 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false }}
              transition={{ duration: 0.5 }}
              className="text-xs font-bold tracking-widest uppercase mb-3"
              style={{ color: "#e57a8a" }}
            >
              The Tare Pet Experience
            </motion.p>
            <motion.h3
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-4xl md:text-5xl font-serif font-bold text-white mb-6"
            >
              Where Excellence Meets Wonder
            </motion.h3>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-slate-300 text-lg"
            >
              Hover over each card to experience our school's story come alive.
            </motion.p>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-center gap-10 flex-wrap">
            {/* Card 1 — Slide in from Left */}
            <motion.div
              initial={{ opacity: 0, x: -80 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: false, margin: "-50px" }}
              transition={{ duration: 0.7 }}
            >
              <GlareCard className="flex flex-col items-center justify-center gap-5 p-8">
                <div className="w-16 h-16 rounded-full flex items-center justify-center border" style={{ background: "rgba(196,30,58,0.2)", borderColor: "rgba(196,30,58,0.4)" }}>
                  <Sparkles className="w-8 h-8" style={{ color: "#e57a8a" }} />
                </div>
                <div className="text-center">
                  <p className="font-bold text-white text-xl font-serif mb-2">Award-Winning</p>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    Recognised as one of Bayelsa's leading Montessori institutions with over a decade of educational excellence.
                  </p>
                </div>
                <div className="text-xs font-bold tracking-widest uppercase" style={{ color: "#e57a8a" }}>Est. 2010 · Yenagoa</div>
              </GlareCard>
            </motion.div>

            {/* Card 2 — Slide in from Center/Bottom */}
            <motion.div
              initial={{ opacity: 0, y: 80 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, margin: "-50px" }}
              transition={{ duration: 0.7, delay: 0.15 }}
            >
              <GlareCard className="flex flex-col items-center justify-center relative overflow-hidden">
                <img
                  className="h-full w-full absolute inset-0 object-cover opacity-80"
                  src="https://images.unsplash.com/photo-1580582932707-520aed937b7b?q=80&w=2832&auto=format&fit=crop"
                  alt="Students in Montessori classroom"
                />
                <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(15,26,18,0.95) 0%, rgba(15,26,18,0.4) 50%, transparent 100%)" }} />
                <div className="relative z-10 absolute bottom-0 left-0 right-0 p-7">
                  <div className="w-8 h-1 rounded-full mb-3" style={{ background: "#C41E3A" }} />
                  <p className="font-bold text-white text-lg font-serif mb-1">Vibrant Campus Life</p>
                  <p className="text-slate-300 text-sm">
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
            >
              <GlareCard className="flex flex-col items-start justify-end py-8 px-7 gap-3">
                <div className="w-14 h-14 rounded-full flex items-center justify-center border mb-2" style={{ background: "rgba(45,122,70,0.2)", borderColor: "rgba(45,122,70,0.4)" }}>
                  <GraduationCap className="w-7 h-7" style={{ color: "#6bcf8f" }} />
                </div>
                <p className="font-bold text-white text-xl font-serif">100% Transition Rate</p>
                <p className="font-normal text-sm text-slate-300 leading-relaxed">
                  Every graduating student from Tare Pet transitions successfully to their chosen secondary school or university.
                </p>
                <Link href="/admissions" className="inline-flex items-center text-sm font-semibold transition-colors group mt-1" style={{ color: "#6bcf8f" }}>
                  Apply Today <ArrowRight className="ml-1 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </GlareCard>
            </motion.div>
          </div>

          {/* Stats row */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-20 pt-16"
            style={{ borderTop: "1px solid rgba(255,255,255,0.1)" }}
          >
            {[
              { value: "15+", label: "Years of Excellence", icon: <Globe className="w-5 h-5" />, color: "#e57a8a" },
              { value: "500+", label: "Students Enrolled", icon: <Users className="w-5 h-5" />, color: "#6bcf8f" },
              { value: "40+", label: "Qualified Educators", icon: <GraduationCap className="w-5 h-5" />, color: "#e57a8a" },
              { value: "100%", label: "Parent Satisfaction", icon: <Heart className="w-5 h-5" />, color: "#6bcf8f" },
            ].map((stat, i) => (
              <div key={i} className="text-center group">
                <div className="flex items-center justify-center gap-2 mb-2 transition-transform duration-300 group-hover:scale-125" style={{ color: stat.color }}>
                  {stat.icon}
                </div>
                <p className="text-4xl font-serif font-bold text-white mb-1 group-hover:text-primary transition-colors">{stat.value}</p>
                <p className="text-slate-400 text-sm">{stat.label}</p>
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
              viewport={{ once: false }}
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
              viewport={{ once: false }}
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

      {/* Testimonials with Alternating Left & Right Slide-In */}
      <section className="py-24 bg-muted/40 relative overflow-hidden">
        <div className="container mx-auto px-4 md:px-6">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto mb-16"
          >
            <h2 className="text-4xl font-serif font-bold text-foreground mb-6">Parent Voices</h2>
            <p className="text-muted-foreground text-lg">Hear from the families who have entrusted us with their children's education.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { quote: "The transformation in my daughter's confidence since joining Tare Pet is remarkable. She doesn't just memorize; she truly understands.", author: "Mrs. Oweikeme", role: "Primary Parent", side: -70 },
              { quote: "Finding a true Montessori school in Yenagoa was a blessing. The teachers are incredibly dedicated and the environment is just beautiful.", author: "Mr. Amadi", role: "Nursery Parent", side: 0 },
              { quote: "My son transitioned to the secondary section flawlessly. The leadership skills they teach are exactly what teenagers need today.", author: "Dr. Ebi", role: "Secondary Parent", side: 70 }
            ].map((test, i) => (
              <motion.div 
                key={i} 
                initial={{ opacity: 0, x: test.side, y: test.side === 0 ? 50 : 0 }}
                whileInView={{ opacity: 1, x: 0, y: 0 }}
                viewport={{ once: false, margin: "-40px" }}
                transition={{ duration: 0.65, delay: i * 0.15 }}
                whileHover={{ y: -6, scale: 1.02 }}
                className="glass-card p-8 rounded-2xl shadow-sm hover:shadow-xl relative border border-white/80 group transition-all duration-300"
              >
                <Quote className="absolute top-6 right-6 w-10 h-10 text-primary/15 group-hover:text-primary/30 transition-colors" />
                <div className="flex gap-1 mb-6 text-primary">
                  {[1,2,3,4,5].map(star => (
                    <svg key={star} className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-muted-foreground italic mb-6 leading-relaxed">"{test.quote}"</p>
                <div>
                  <p className="font-bold text-foreground group-hover:text-primary transition-colors">{test.author}</p>
                  <p className="text-xs text-primary font-semibold uppercase tracking-wider mt-0.5">{test.role}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-background text-center relative overflow-hidden border-t border-border">
        <div className="container mx-auto px-4 md:px-6">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: false }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl mx-auto glass-card p-12 rounded-3xl border border-white/80 shadow-2xl relative"
          >
            <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-24 h-24 bg-primary/10 rounded-full blur-xl pointer-events-none" />
            <h2 className="text-4xl md:text-5xl font-serif font-bold text-foreground mb-6">Begin Your Child's Journey</h2>
            <p className="text-muted-foreground text-lg mb-10 leading-relaxed">We invite you to visit our campus in Kpansia-Epje to see our Montessori classrooms in action.</p>
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
