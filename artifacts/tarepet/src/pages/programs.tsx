import { PageTransition } from "@/components/layout/Layout";
import { Link } from "wouter";
import { motion } from "framer-motion";
import programsImg from "@assets/generated_images/programs.jpg";
import { BookOpen, Activity, Target, Palette, MoveRight, Sparkles, Building2, HeartHandshake, ShieldCheck, Award } from "lucide-react";

export default function Programs() {
  return (
    <PageTransition>
      {/* Header */}
      <section className="bg-gradient-to-br from-primary via-primary/95 to-primary/90 py-28 md:py-36 text-white relative overflow-hidden">
        <div className="absolute inset-0 glass-shimmer pointer-events-none opacity-25" />
        <div className="container mx-auto px-4 md:px-6 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-1 rounded-full glass-button text-white text-xs font-semibold uppercase tracking-wider mb-6"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Excellence in Learning</span>
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl md:text-6xl font-serif font-bold mb-6 tracking-tight"
          >
            Academic & School Programs
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg md:text-xl text-white/90 max-w-3xl mx-auto font-sans leading-relaxed"
          >
            A comprehensive educational pathway featuring Nursery, Primary, Junior & Senior Secondary, Boarding Facilities, and Special Needs Education.
          </motion.p>
        </div>
      </section>

      {/* Main Academics */}
      <section className="py-24 bg-background relative overflow-hidden">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col gap-24">
            
            {/* 1. Early Years / Nursery */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
              <motion.div 
                initial={{ opacity: 0, x: -70 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: false, margin: "-40px" }}
                transition={{ duration: 0.65 }}
                className="order-2 lg:order-1"
              >
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-secondary/15 text-secondary text-xs font-bold mb-6 uppercase tracking-wider">
                  Ages 2 - 5
                </div>
                <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-6">Nursery & Early Years</h2>
                <p className="text-muted-foreground text-lg mb-6 leading-relaxed">
                  Our Nursery program provides a rich, carefully prepared environment where children learn through exploration. Focus is placed on practical life skills, sensorial refinement, early language (phonics), and mathematics.
                </p>
                <ul className="space-y-4 mb-8">
                  <li className="flex gap-3 text-muted-foreground">
                    <Target className="w-6 h-6 text-primary shrink-0" />
                    <span>Development of independence and fine motor skills.</span>
                  </li>
                  <li className="flex gap-3 text-muted-foreground">
                    <Target className="w-6 h-6 text-primary shrink-0" />
                    <span>Sensorial materials to isolate and refine perception.</span>
                  </li>
                  <li className="flex gap-3 text-muted-foreground">
                    <Target className="w-6 h-6 text-primary shrink-0" />
                    <span>Foundation for reading, writing, and arithmetic.</span>
                  </li>
                </ul>
              </motion.div>
              <motion.div 
                initial={{ opacity: 0, x: 70 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: false, margin: "-40px" }}
                transition={{ duration: 0.65, delay: 0.15 }}
                className="order-1 lg:order-2 glass-card rounded-3xl aspect-[4/3] flex items-center justify-center p-8 text-center relative overflow-hidden border border-white/80 shadow-xl group"
              >
                <div className="relative z-10 text-secondary/40 group-hover:scale-105 transition-transform duration-500">
                  <BookOpen className="w-28 h-28 mx-auto mb-4 text-secondary" />
                  <span className="font-serif italic text-2xl text-foreground font-bold">Nursery Program</span>
                </div>
              </motion.div>
            </div>

            <hr className="border-border" />

            {/* 2. Primary */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
              <motion.div 
                initial={{ opacity: 0, x: -70 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: false, margin: "-40px" }}
                transition={{ duration: 0.65 }}
                className="glass-card rounded-3xl aspect-[4/3] flex items-center justify-center p-8 text-center relative overflow-hidden border border-white/80 shadow-xl group"
              >
                <div className="relative z-10 text-primary/40 group-hover:scale-105 transition-transform duration-500">
                  <Activity className="w-28 h-28 mx-auto mb-4 text-primary" />
                  <span className="font-serif italic text-2xl text-foreground font-bold">Primary Education</span>
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: 70 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: false, margin: "-40px" }}
                transition={{ duration: 0.65, delay: 0.15 }}
              >
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/15 text-primary text-xs font-bold mb-6 uppercase tracking-wider">
                  Ages 6 - 11
                </div>
                <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-6">Primary School</h2>
                <p className="text-muted-foreground text-lg mb-6 leading-relaxed">
                  As children enter the "second plane of development", they become reasoning explorers. Our primary curriculum integrates science, history, geography, language, and math into a cohesive whole, often called "Cosmic Education."
                </p>
                <ul className="space-y-4 mb-8">
                  <li className="flex gap-3 text-muted-foreground">
                    <Target className="w-6 h-6 text-primary shrink-0" />
                    <span>Project-based collaborative learning.</span>
                  </li>
                  <li className="flex gap-3 text-muted-foreground">
                    <Target className="w-6 h-6 text-primary shrink-0" />
                    <span>Strong emphasis on moral and character development.</span>
                  </li>
                  <li className="flex gap-3 text-muted-foreground">
                    <Target className="w-6 h-6 text-primary shrink-0" />
                    <span>Transitioning from concrete materials to abstract thinking.</span>
                  </li>
                </ul>
              </motion.div>
            </div>

            <hr className="border-border" />

            {/* 3. Secondary (Junior & Senior) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
              <motion.div 
                initial={{ opacity: 0, x: -70 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: false, margin: "-40px" }}
                transition={{ duration: 0.65 }}
                className="order-2 lg:order-1"
              >
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-secondary/15 text-secondary text-xs font-bold mb-6 uppercase tracking-wider">
                  Ages 11 - 17
                </div>
                <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-6">Junior & Senior Secondary</h2>
                <p className="text-muted-foreground text-lg mb-6 leading-relaxed">
                  Preparing young adults for higher education and life. We combine rigorous academic preparation (WAEC, NECO, JAMB) with real-world responsibilities, career pathways, and leadership opportunities.
                </p>
                <ul className="space-y-4 mb-8">
                  <li className="flex gap-3 text-muted-foreground">
                    <Target className="w-6 h-6 text-primary shrink-0" />
                    <span>Comprehensive STEM, Arts, and Commercial tracks.</span>
                  </li>
                  <li className="flex gap-3 text-muted-foreground">
                    <Target className="w-6 h-6 text-primary shrink-0" />
                    <span>Leadership, entrepreneurship, and technical skills.</span>
                  </li>
                  <li className="flex gap-3 text-muted-foreground">
                    <Target className="w-6 h-6 text-primary shrink-0" />
                    <span>Intensive exam preparation and career guidance.</span>
                  </li>
                </ul>
                <Link href="/admissions" className="inline-flex items-center text-primary font-bold hover:gap-3 transition-all group">
                  Apply for Secondary <MoveRight className="ml-2 w-5 h-5 group-hover:translate-x-1.5 transition-transform" />
                </Link>
              </motion.div>
              <motion.div 
                initial={{ opacity: 0, x: 70 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: false, margin: "-40px" }}
                transition={{ duration: 0.65, delay: 0.15 }}
                className="order-1 lg:order-2 rounded-3xl overflow-hidden shadow-2xl h-full min-h-[400px] border-8 border-white/60 group"
              >
                <img 
                  src={programsImg} 
                  alt="Secondary School Students in Classroom" 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
              </motion.div>
            </div>

            <hr className="border-border" />

            {/* 4. Boarding School */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
              <motion.div 
                initial={{ opacity: 0, x: -70 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: false, margin: "-40px" }}
                transition={{ duration: 0.65 }}
                className="glass-card rounded-3xl aspect-[4/3] flex items-center justify-center p-8 text-center relative overflow-hidden border border-white/80 shadow-xl group bg-gradient-to-br from-secondary/10 to-primary/5"
              >
                <div className="relative z-10 group-hover:scale-105 transition-transform duration-500">
                  <Building2 className="w-28 h-28 mx-auto mb-4 text-secondary" />
                  <span className="font-serif italic text-2xl text-foreground font-bold">Boarding House</span>
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: 70 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: false, margin: "-40px" }}
                transition={{ duration: 0.65, delay: 0.15 }}
              >
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-secondary/15 text-secondary text-xs font-bold mb-6 uppercase tracking-wider">
                  Full & Weekly Residence
                </div>
                <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-6">Boarding School</h2>
                <p className="text-muted-foreground text-lg mb-6 leading-relaxed">
                  Our modern boarding facility provides a safe, nurturing home-away-from-home for students. We foster discipline, fellowship, structured evening prep, and round-the-clock pastoral care.
                </p>
                <ul className="space-y-4 mb-8">
                  <li className="flex gap-3 text-muted-foreground">
                    <ShieldCheck className="w-6 h-6 text-primary shrink-0" />
                    <span>24/7 Security, medical oversight, and dedicated house parents.</span>
                  </li>
                  <li className="flex gap-3 text-muted-foreground">
                    <BookOpen className="w-6 h-6 text-primary shrink-0" />
                    <span>Structured evening study sessions and academic tutoring.</span>
                  </li>
                  <li className="flex gap-3 text-muted-foreground">
                    <Award className="w-6 h-6 text-primary shrink-0" />
                    <span>Nutritious balanced meals and weekend recreation activities.</span>
                  </li>
                </ul>
              </motion.div>
            </div>

            <hr className="border-border" />

            {/* 5. Special School & Inclusive Education */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
              <motion.div 
                initial={{ opacity: 0, x: -70 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: false, margin: "-40px" }}
                transition={{ duration: 0.65 }}
                className="order-2 lg:order-1"
              >
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/15 text-primary text-xs font-bold mb-6 uppercase tracking-wider">
                  Inclusive Learning
                </div>
                <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-6">Special School & Inclusive Program</h2>
                <p className="text-muted-foreground text-lg mb-6 leading-relaxed">
                  We believe every child possesses unique talents and deserves specialized attention. Our Special Education unit provides individualized learning plans, sensory integration, and dedicated Montessori specialists to ensure every learner thrives.
                </p>
                <ul className="space-y-4 mb-8">
                  <li className="flex gap-3 text-muted-foreground">
                    <HeartHandshake className="w-6 h-6 text-primary shrink-0" />
                    <span>Tailored Individualized Education Plans (IEPs).</span>
                  </li>
                  <li className="flex gap-3 text-muted-foreground">
                    <Target className="w-6 h-6 text-primary shrink-0" />
                    <span>Specialized Montessori sensory & developmental tools.</span>
                  </li>
                  <li className="flex gap-3 text-muted-foreground">
                    <Sparkles className="w-6 h-6 text-primary shrink-0" />
                    <span>Compassionate, certified special education educators.</span>
                  </li>
                </ul>
                <Link href="/contact" className="inline-flex items-center text-primary font-bold hover:gap-3 transition-all group">
                  Inquire About Special Education <MoveRight className="ml-2 w-5 h-5 group-hover:translate-x-1.5 transition-transform" />
                </Link>
              </motion.div>
              <motion.div 
                initial={{ opacity: 0, x: 70 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: false, margin: "-40px" }}
                transition={{ duration: 0.65, delay: 0.15 }}
                className="order-1 lg:order-2 glass-card rounded-3xl aspect-[4/3] flex items-center justify-center p-8 text-center relative overflow-hidden border border-white/80 shadow-xl group bg-gradient-to-br from-primary/10 to-secondary/10"
              >
                <div className="relative z-10 group-hover:scale-105 transition-transform duration-500">
                  <HeartHandshake className="w-28 h-28 mx-auto mb-4 text-primary" />
                  <span className="font-serif italic text-2xl text-foreground font-bold">Special School Program</span>
                </div>
              </motion.div>
            </div>

          </div>
        </div>
      </section>

      {/* Extracurriculars */}
      <section className="py-24 bg-muted/40 border-t border-border relative overflow-hidden">
        <div className="container mx-auto px-4 md:px-6">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto mb-16"
          >
            <h2 className="text-4xl font-serif font-bold text-foreground mb-6">Beyond the Classroom</h2>
            <p className="text-muted-foreground text-lg">Education at Tare Pet extends far beyond academics. We cultivate well-rounded individuals through diverse activities.</p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Palette, title: "Creative Arts", desc: "Painting, sculpture, and craft to express inner creativity." },
              { icon: Activity, title: "Sports & Athletics", desc: "Physical education, team sports, and athletic competitions." },
              { icon: BookOpen, title: "Literary & Debating", desc: "Public speaking, poetry, and debate clubs to build confidence." },
              { icon: Target, title: "STEM Club", desc: "Coding, robotics, and hands-on science experiments." }
            ].map((item, i) => (
              <motion.div 
                key={i} 
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: false, margin: "-40px" }}
                transition={{ duration: 0.6, delay: i * 0.12 }}
                whileHover={{ y: -6, scale: 1.03 }}
                className="p-8 glass-card rounded-2xl text-center border border-white/80 shadow-sm hover:shadow-xl transition-all group"
              >
                <div className="w-14 h-14 bg-white/90 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-md text-primary group-hover:scale-110 transition-transform">
                  <item.icon className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-3 group-hover:text-primary transition-colors">{item.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-secondary text-center text-white relative overflow-hidden">
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: false }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl font-serif font-bold mb-6">Ready to see our programs in action?</h2>
            <Link href="/contact" className="inline-flex items-center justify-center rounded-full text-base font-semibold glass-button text-white hover:bg-white/20 h-14 px-8 py-3 hover:scale-105 active:scale-95 transition-all">
              Schedule a Campus Tour
            </Link>
          </motion.div>
        </div>
      </section>
    </PageTransition>
  );
}

