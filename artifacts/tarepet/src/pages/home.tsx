import { PageTransition } from "@/components/layout/Layout";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowRight, BookOpen, Heart, Users, CheckCircle2, Quote, Sparkles, GraduationCap, Globe } from "lucide-react";
import heroImg from "@assets/generated_images/hero.jpg";
import philosophyImg from "@assets/generated_images/programs.jpg";
import { GlareCard } from "@/components/ui/glare-card";

export default function Home() {
  return (
    <PageTransition>
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center pt-10 pb-20">
        <div className="absolute inset-0 z-0">
          <img 
            src={heroImg} 
            alt="Students in outdoor Montessori learning session" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-secondary/95 via-secondary/80 to-secondary/40 mix-blend-multiply"></div>
          <div className="absolute inset-0 bg-black/30"></div>
        </div>
        
        <div className="container mx-auto px-4 md:px-6 relative z-10">
          <div className="max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/90 text-white text-sm font-medium mb-6 backdrop-blur-sm"
            >
              <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
              Admissions now open for 2025/2026
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="text-5xl md:text-7xl font-serif font-bold text-white leading-tight mb-6"
            >
              Nurturing <span className="text-primary italic">Excellence</span> <br/>in Every Child.
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="text-lg md:text-xl text-white/90 mb-10 max-w-2xl font-sans leading-relaxed"
            >
              Tarepet Montessori School provides a premium, holistic education in Yenagoa. We empower students to discover their potential through guided independence and rich academics.
            </motion.p>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <Link href="/sign-in" className="inline-flex items-center justify-center rounded-md text-base font-medium transition-colors bg-primary text-white hover:bg-primary/90 h-14 px-8 py-3 group shadow-xl">
                Portal Login
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link href="/about" className="inline-flex items-center justify-center rounded-md text-base font-medium transition-colors bg-white text-secondary hover:bg-white/90 h-14 px-8 py-3">
                Discover Our Method
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Motto / Philosophy Banner */}
      <section className="bg-primary py-12">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <h2 className="text-3xl md:text-4xl font-serif text-white text-center md:text-left">
              "Not to Knowledge <span className="italic font-light">is Power."</span>
            </h2>
            <p className="text-white/90 max-w-xl text-center md:text-right text-lg font-sans">
              Our guiding principle emphasizes that true power comes not just from holding knowledge, but from seeking it actively and applying it thoughtfully.
            </p>
          </div>
        </div>
      </section>

      {/* Programs Preview */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-sm font-bold tracking-widest text-primary uppercase mb-3">Academic Journey</h2>
            <h3 className="text-4xl md:text-5xl font-serif font-bold text-foreground mb-6">Programs for Every Stage</h3>
            <p className="text-muted-foreground text-lg">From their first steps to secondary school graduation, we provide a seamless, enriching educational pathway.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Program 1 */}
            <motion.div 
              whileHover={{ y: -5 }}
              className="bg-card rounded-xl p-8 border border-border shadow-sm hover:shadow-xl transition-all group"
            >
              <div className="w-14 h-14 bg-secondary/10 rounded-full flex items-center justify-center mb-6 text-secondary group-hover:bg-secondary group-hover:text-white transition-colors">
                <Heart className="w-7 h-7" />
              </div>
              <h4 className="text-2xl font-serif font-bold mb-3">Nursery</h4>
              <p className="text-muted-foreground mb-6 line-clamp-3">A nurturing environment where our youngest learners build a foundation of curiosity, independence, and basic skills through the Montessori method.</p>
              <Link href="/programs" className="inline-flex items-center text-primary font-medium hover:underline">
                Explore Nursery <ArrowRight className="ml-1 w-4 h-4" />
              </Link>
            </motion.div>

            {/* Program 2 */}
            <motion.div 
              whileHover={{ y: -5 }}
              className="bg-card rounded-xl p-8 border border-border shadow-sm hover:shadow-xl transition-all group"
            >
              <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mb-6 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                <BookOpen className="w-7 h-7" />
              </div>
              <h4 className="text-2xl font-serif font-bold mb-3">Primary</h4>
              <p className="text-muted-foreground mb-6 line-clamp-3">Fostering critical thinking and a deeper understanding of the world. Students engage in structured learning while maintaining their creative freedom.</p>
              <Link href="/programs" className="inline-flex items-center text-primary font-medium hover:underline">
                Explore Primary <ArrowRight className="ml-1 w-4 h-4" />
              </Link>
            </motion.div>

            {/* Program 3 */}
            <motion.div 
              whileHover={{ y: -5 }}
              className="bg-card rounded-xl p-8 border border-border shadow-sm hover:shadow-xl transition-all group"
            >
              <div className="w-14 h-14 bg-secondary/10 rounded-full flex items-center justify-center mb-6 text-secondary group-hover:bg-secondary group-hover:text-white transition-colors">
                <Users className="w-7 h-7" />
              </div>
              <h4 className="text-2xl font-serif font-bold mb-3">Secondary</h4>
              <p className="text-muted-foreground mb-6 line-clamp-3">Junior and Senior Secondary programs designed to prepare students for leadership, academic excellence, and success in higher education.</p>
              <Link href="/programs" className="inline-flex items-center text-primary font-medium hover:underline">
                Explore Secondary <ArrowRight className="ml-1 w-4 h-4" />
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* School Highlights — GlareCard Section */}
      <section className="py-24 overflow-hidden relative" style={{ background: "linear-gradient(135deg, #0f1a12 0%, #1a0a08 50%, #0f1a12 100%)" }}>
        {/* Background glow using brand crimson + green */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl opacity-20" style={{ background: "radial-gradient(circle, #C41E3A 0%, transparent 70%)" }} />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full blur-3xl opacity-15" style={{ background: "radial-gradient(circle, #2D7A46 0%, transparent 70%)" }} />
        </div>
        <div className="container mx-auto px-4 md:px-6 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-sm font-bold tracking-widest uppercase mb-3"
              style={{ color: "#e57a8a" }}
            >
              The Tarepet Experience
            </motion.p>
            <motion.h3
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-4xl md:text-5xl font-serif font-bold text-white mb-6"
            >
              Where Excellence Meets Wonder
            </motion.h3>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-slate-300 text-lg"
            >
              Hover over each card to experience our school's story come alive.
            </motion.p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="flex flex-col md:flex-row items-center justify-center gap-10 flex-wrap"
          >
            {/* Card 1 — School Identity (Crimson accent) */}
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

            {/* Card 2 — Campus Life with image */}
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

            {/* Card 3 — Achievement (Green accent) */}
            <GlareCard className="flex flex-col items-start justify-end py-8 px-7 gap-3">
              <div className="w-14 h-14 rounded-full flex items-center justify-center border mb-2" style={{ background: "rgba(45,122,70,0.2)", borderColor: "rgba(45,122,70,0.4)" }}>
                <GraduationCap className="w-7 h-7" style={{ color: "#6bcf8f" }} />
              </div>
              <p className="font-bold text-white text-xl font-serif">100% Transition Rate</p>
              <p className="font-normal text-sm text-slate-300 leading-relaxed">
                Every graduating student from Tarepet transitions successfully to their chosen secondary school or university — a testament to our rigorous preparation.
              </p>
              <Link href="/admissions" className="inline-flex items-center text-sm font-semibold transition-colors group mt-1" style={{ color: "#6bcf8f" }}>
                Apply Today <ArrowRight className="ml-1 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </GlareCard>
          </motion.div>

          {/* Stats row */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
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
                <div className="flex items-center justify-center gap-2 mb-2 transition-opacity" style={{ color: stat.color }}>
                  {stat.icon}
                </div>
                <p className="text-4xl font-serif font-bold text-white mb-1">{stat.value}</p>
                <p className="text-slate-500 text-sm">{stat.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Why Montessori Section */}
      <section className="py-24 bg-secondary text-white relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>

        <div className="container mx-auto px-4 md:px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-sm font-bold tracking-widest text-primary-foreground/80 uppercase mb-3">The Tarepet Difference</h2>
              <h3 className="text-4xl md:text-5xl font-serif font-bold mb-8">Why Choose Our Montessori Approach?</h3>
              
              <ul className="space-y-6">
                <li className="flex gap-4">
                  <CheckCircle2 className="w-6 h-6 text-primary shrink-0 mt-1" />
                  <div>
                    <h4 className="text-xl font-bold mb-2">Child-Centered Learning</h4>
                    <p className="text-white/80">Our classrooms are designed to allow students to choose activities that match their interests and developmental needs.</p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <CheckCircle2 className="w-6 h-6 text-primary shrink-0 mt-1" />
                  <div>
                    <h4 className="text-xl font-bold mb-2">Hands-On Materials</h4>
                    <p className="text-white/80">We use specialized Montessori materials that make abstract concepts concrete and understandable.</p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <CheckCircle2 className="w-6 h-6 text-primary shrink-0 mt-1" />
                  <div>
                    <h4 className="text-xl font-bold mb-2">Uninterrupted Work Periods</h4>
                    <p className="text-white/80">Long blocks of time allow children to engage deeply with their work, building concentration and focus.</p>
                  </div>
                </li>
              </ul>

              <div className="mt-10">
                <Link href="/about" className="inline-flex items-center text-white font-medium border-b-2 border-primary pb-1 hover:text-primary transition-colors">
                  Learn more about our philosophy
                </Link>
              </div>
            </div>
            
            <div className="relative">
              <div className="aspect-[4/5] rounded-2xl overflow-hidden border-8 border-white/10 shadow-2xl relative z-10">
                <img
                  src={philosophyImg}
                  alt="Students engaged in Montessori learning"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-primary/10 mix-blend-overlay z-10"></div>
              </div>
              <div className="absolute -bottom-8 -left-8 bg-primary p-8 rounded-xl shadow-xl z-20 max-w-[250px] hidden md:block">
                <p className="font-serif italic text-white text-lg">"The greatest sign of success for a teacher is to be able to say, 'The children are now working as if I did not exist.'"</p>
                <p className="text-white/70 text-sm mt-4 font-bold">— Maria Montessori</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-muted/50">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl font-serif font-bold text-foreground mb-6">Parent Voices</h2>
            <p className="text-muted-foreground text-lg">Hear from the families who have entrusted us with their children's education.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { quote: "The transformation in my daughter's confidence since joining Tarepet is remarkable. She doesn't just memorize; she truly understands.", author: "Mrs. Oweikeme", role: "Primary Parent" },
              { quote: "Finding a true Montessori school in Yenagoa was a blessing. The teachers are incredibly dedicated and the environment is just beautiful.", author: "Mr. Amadi", role: "Nursery Parent" },
              { quote: "My son transitioned to the secondary section flawlessly. The leadership skills they teach are exactly what teenagers need today.", author: "Dr. Ebi", role: "Secondary Parent" }
            ].map((test, i) => (
              <div key={i} className="bg-card p-8 rounded-xl shadow-sm relative">
                <Quote className="absolute top-6 right-6 w-10 h-10 text-primary/10" />
                <div className="flex gap-1 mb-6 text-primary">
                  {[1,2,3,4,5].map(star => (
                    <svg key={star} className="w-5 h-5 fill-current" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-muted-foreground italic mb-6 leading-relaxed">"{test.quote}"</p>
                <div>
                  <p className="font-bold text-foreground">{test.author}</p>
                  <p className="text-sm text-primary">{test.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-card border-t border-border text-center">
        <div className="container mx-auto px-4 md:px-6">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-serif font-bold text-foreground mb-6">Begin Your Child's Journey</h2>
            <p className="text-muted-foreground text-lg mb-10">We invite you to visit our campus in Kpansia-Epje to see our Montessori classrooms in action.</p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link href="/sign-in" className="inline-flex items-center justify-center rounded-md text-base font-medium bg-primary text-white hover:bg-primary/90 h-14 px-8 py-3">
                Portal Login
              </Link>
              <Link href="/contact" className="inline-flex items-center justify-center rounded-md text-base font-medium border border-border bg-white text-foreground hover:bg-muted h-14 px-8 py-3">
                Schedule a Tour
              </Link>
            </div>
          </div>
        </div>
      </section>
    </PageTransition>
  );
}
