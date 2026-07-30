import { PageTransition } from "@/components/layout/Layout";
import { motion } from "framer-motion";
import aboutImg from "@assets/school_building.jpg";
import vicePrincipalImg from "@assets/vice_principal.jpg";
import headMistressImg from "@assets/head_mistress.jpg";
import nurseryHeadImg from "@assets/nursery_head.jpg";
import proprietressImg from "@assets/proprietress.jpg";
import { CheckCircle, Award, Target, Eye, Sparkles } from "lucide-react";

export default function About() {
  return (
    <PageTransition>
      {/* Hero Header */}
      <section className="bg-gradient-to-br from-[#123922] via-[#0f2e1d] to-[#091f13] text-white pt-32 pb-24 md:pt-40 md:pb-32 relative overflow-hidden border-b border-white/10">
        {/* Background Image Layer */}
        <div className="absolute inset-0 z-0">
          <img
            src={aboutImg}
            alt="Tare Pet Campus"
            className="w-full h-full object-cover opacity-20 scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#123922]/90 via-[#0f2e1d]/85 to-[#091f13]/90 mix-blend-multiply" />
        </div>

        {/* Background Ambient Glow & Glass Shimmer */}
        <div className="absolute inset-0 glass-shimmer pointer-events-none opacity-20 z-0" />
        <div className="absolute top-10 right-10 w-96 h-96 bg-primary/25 rounded-full blur-3xl pointer-events-none animate-pulse" />
        <div className="absolute bottom-10 left-10 w-96 h-96 bg-secondary/35 rounded-full blur-3xl pointer-events-none animate-pulse" />

        <div className="container mx-auto px-4 md:px-6 text-center relative z-10 max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-button text-white text-xs font-semibold uppercase tracking-wider mb-6 shadow-lg border border-white/20"
          >
            <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
            <span>Discover Our Legacy</span>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-5xl md:text-6xl font-serif font-bold text-white mb-6 tracking-tight drop-shadow-md leading-[1.15]"
          >
            About Tare Pet <span className="text-primary italic font-light">Montessori School</span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg md:text-xl text-white/90 max-w-3xl mx-auto font-sans leading-relaxed font-normal mb-10"
          >
            A premier educational institution in Yenagoa, Bayelsa State — dedicated to shaping confident, independent, and ethical leaders through child-centered discovery and academic excellence.
          </motion.p>

          {/* Quick Highlight Pills Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-wrap items-center justify-center gap-3 md:gap-4 text-xs md:text-sm font-sans"
          >
            <span className="px-4 py-2 rounded-full glass-card bg-white/10 border border-white/20 text-white font-semibold shadow-sm">
              🏆 Established October 1, 2002
            </span>
            <span className="px-4 py-2 rounded-full glass-card bg-white/10 border border-white/20 text-white font-semibold shadow-sm">
              🌱 Montessori & Erdkinder Method
            </span>
            <span className="px-4 py-2 rounded-full glass-card bg-white/10 border border-white/20 text-white font-semibold shadow-sm">
              📍 47 Chief John Obi Str., Kpansia, Yenagoa
            </span>
          </motion.div>
        </div>
      </section>

      {/* Mission & Vision Cards — Left & Right Sliding */}
      <section className="py-24 bg-background relative overflow-hidden">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 max-w-5xl mx-auto">
            {/* Mission — Slide from Left */}
            <motion.div 
              initial={{ opacity: 0, x: -70 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
              whileHover={{ y: -8, scale: 1.02 }}
              className="glass-card p-10 rounded-3xl border border-white/80 border-t-4 border-t-primary shadow-lg hover:shadow-2xl transition-all duration-300 group"
            >
              <div className="w-14 h-14 bg-primary/15 rounded-2xl flex items-center justify-center mb-6 text-primary group-hover:scale-110 transition-transform">
                <Target className="w-7 h-7" />
              </div>
              <h2 className="text-3xl font-serif font-bold text-foreground mb-4 group-hover:text-primary transition-colors">Our Mission</h2>
              <p className="text-muted-foreground leading-relaxed text-lg mb-3">
                To enhance creativity, teamwork, leadership skills and love among students.
              </p>
              <span className="inline-block px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full font-mono">
                1 Corinthians 15:4-5
              </span>
            </motion.div>

            {/* Vision — Slide from Right */}
            <motion.div 
              initial={{ opacity: 0, x: 70 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.65, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
              whileHover={{ y: -8, scale: 1.02 }}
              className="glass-card p-10 rounded-3xl border border-white/80 border-t-4 border-t-secondary shadow-lg hover:shadow-2xl transition-all duration-300 group"
            >
              <div className="w-14 h-14 bg-secondary/15 rounded-2xl flex items-center justify-center mb-6 text-secondary group-hover:scale-110 transition-transform">
                <Eye className="w-7 h-7" />
              </div>
              <h2 className="text-3xl font-serif font-bold text-foreground mb-4 group-hover:text-secondary transition-colors">Our Vision</h2>
              <p className="text-muted-foreground leading-relaxed text-lg">
                To raise a generation of children who will love the Lord, walk in godly wisdom, and lead in academic and societal excellence.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Image & Philosophy */}
      <section className="py-24 bg-muted/40 relative overflow-hidden">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div 
              initial={{ opacity: 0, x: -70 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="rounded-3xl overflow-hidden shadow-2xl relative h-[500px] border-8 border-white/60 group"
            >
              <img 
                src={aboutImg} 
                alt="Tare Pet School Building Exterior" 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-primary/10 mix-blend-overlay" />
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 70 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.15 }}
            >
              <h2 className="text-xs font-bold tracking-widest text-primary uppercase mb-3 px-3 py-1 rounded-full bg-primary/10 inline-block">
                Our Approach
              </h2>
              <h3 className="text-4xl md:text-5xl font-serif font-bold text-foreground mb-8">The Montessori Philosophy</h3>
              
              <div className="space-y-6 text-lg text-muted-foreground leading-relaxed">
                <p>
                  At Tare Pet Montessori School, we believe that education is not merely about transmitting facts, but about nurturing the human spirit. We adhere closely to the principles laid down by Dr. Maria Montessori.
                </p>
                <p>
                  For our older students, we embrace the <strong>Erdkinder</strong> approach — translating to "children of the earth." This philosophy emphasizes connecting adolescents to society through practical work, commerce, and connection to nature.
                </p>
                <p>
                  We view the classroom as a prepared environment, and the teacher as a guide. Here, discipline comes from within, fostered by engaging work and deep respect for each individual.
                </p>
              </div>

              <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {['Respect for the Child', 'The Absorbent Mind', 'Sensitive Periods', 'The Prepared Environment'].map((point, i) => (
                  <motion.div 
                    key={i} 
                    whileHover={{ scale: 1.03 }}
                    className="flex items-center gap-3 p-3 rounded-xl glass-card border border-white/70"
                  >
                    <CheckCircle className="w-5 h-5 text-secondary shrink-0" />
                    <span className="font-medium text-foreground text-sm">{point}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* History */}
      <section className="py-24 bg-background border-y border-border relative overflow-hidden">
        <div className="container mx-auto px-4 md:px-6 text-center max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl font-serif font-bold text-foreground mb-8">Our History</h2>
            <p className="text-muted-foreground text-lg leading-relaxed mb-6">
              Founded on <strong>October 1, 2002</strong>, and located at 47 Chief John Obi Str., Nuxtin, Kpansia, Yenagoa, Tare Pet Montessori School was established with a bold mandate: to raise a generation of creative, disciplined, and God-fearing leaders in Bayelsa State.
            </p>
            <p className="text-muted-foreground text-lg leading-relaxed">
              Spanning over two decades of educational excellence, we offer complete academic continuity from Creche, Advance Nursery, Nursery 1 & 2, Basic 1-6 (Primary), up to Junior and Senior Secondary (JS1-SS3), residential boarding, and special needs education.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Leadership Team */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4 md:px-6">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto mb-16"
          >
            <h2 className="text-4xl font-serif font-bold text-foreground mb-6">School Management & Leadership</h2>
            <p className="text-muted-foreground text-lg">Guided by experienced educational leaders passionate about child development.</p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              { name: "Chief (Mrs) Victoria Ebunomiye Kpotoge", role: "Proprietress / Founder", initials: "VK", image: proprietressImg, imagePos: "center 20%" },
              { name: "Mrs. Chwerdu Erebeli", role: "School Administrator", initials: "CE" },
              { name: "Mr. Ofem Ekpa", role: "Principal", initials: "OE" },
              { name: "Mrs. Stella Nosa-Apohan", role: "Vice Principal", initials: "SN", image: vicePrincipalImg, imagePos: "center top" },
              { name: "Ms. Akidei Afayero", role: "Head Mistress", initials: "AA", image: headMistressImg, imagePos: "center top" },
              { name: "Mrs. Tina Mabu", role: "Nursery Head", initials: "TM", image: nurseryHeadImg, imagePos: "center top" }
            ].map((leader, i) => (
              <motion.div 
                key={i} 
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                whileHover={{ y: -8, scale: 1.02 }}
                className="glass-card rounded-2xl border border-white/80 overflow-hidden text-center shadow-md hover:shadow-2xl transition-all duration-300 flex flex-col group"
              >
                {leader.image ? (
                  <div className="h-72 overflow-hidden relative">
                    <img 
                      src={leader.image} 
                      alt={leader.name} 
                      style={{ objectPosition: leader.imagePos || "center top" }}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                  </div>
                ) : (
                  <div className="h-64 bg-gradient-to-br from-primary/15 via-secondary/15 to-primary/10 flex items-center justify-center">
                    <span className="text-4xl font-serif text-primary font-bold">{leader.initials}</span>
                  </div>
                )}
                <div className="p-6 flex-1 flex flex-col justify-center">
                  <h3 className="text-lg font-bold text-foreground mb-1 leading-snug">{leader.name}</h3>
                  <p className="text-primary font-semibold text-xs uppercase tracking-wider">{leader.role}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </PageTransition>
  );
}
