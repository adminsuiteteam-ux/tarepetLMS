import { PageTransition } from "@/components/layout/Layout";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowRight, BookOpen, Heart, Users, CheckCircle2, Quote } from "lucide-react";
import heroImg from "@assets/generated_images/hero.jpg";

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
              <Link href="/admissions" className="inline-flex items-center justify-center rounded-md text-base font-medium transition-colors bg-primary text-white hover:bg-primary/90 h-14 px-8 py-3 group shadow-xl">
                Apply Now
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
                <div className="absolute inset-0 bg-primary/20 mix-blend-overlay z-10"></div>
                {/* Fallback pattern while waiting for specific image or if we want a geometric placeholder here */}
                <div className="w-full h-full bg-card/10 flex items-center justify-center p-12">
                  <div className="text-white/20">
                     <BookOpen className="w-full h-full max-w-[200px]" strokeWidth={1} />
                  </div>
                </div>
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
            <p className="text-muted-foreground text-lg">Hear from the families who have trusted us with their children's education.</p>
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
              <Link href="/admissions" className="inline-flex items-center justify-center rounded-md text-base font-medium bg-primary text-white hover:bg-primary/90 h-14 px-8 py-3">
                Start Admission Process
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
