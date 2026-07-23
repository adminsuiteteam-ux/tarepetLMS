import { PageTransition } from "@/components/layout/Layout";
import { Link } from "wouter";
import programsImg from "@assets/generated_images/programs.jpg";
import { BookOpen, Activity, Target, Palette, MoveRight } from "lucide-react";

export default function Programs() {
  return (
    <PageTransition>
      {/* Header */}
      <section className="bg-primary py-20 md:py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
        <div className="container mx-auto px-4 md:px-6 text-center relative z-10">
          <h1 className="text-4xl md:text-6xl font-serif font-bold mb-6 text-white">Academic Programs</h1>
          <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto">
            A comprehensive, continuous educational pathway from early childhood through secondary graduation.
          </p>
        </div>
      </section>

      {/* Main Academics */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col gap-24">
            
            {/* Early Years / Nursery */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
              <div className="order-2 lg:order-1">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/10 text-secondary text-sm font-bold mb-6 uppercase tracking-wider">
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
              </div>
              <div className="order-1 lg:order-2 bg-muted rounded-2xl aspect-[4/3] flex items-center justify-center p-8 text-center relative overflow-hidden">
                <div className="absolute inset-0 bg-secondary/5"></div>
                <div className="relative z-10 text-secondary/30">
                  <BookOpen className="w-32 h-32 mx-auto mb-4" />
                  <span className="font-serif italic text-xl">Early Years Learning</span>
                </div>
              </div>
            </div>

            <hr className="border-border" />

            {/* Primary */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
              <div className="bg-muted rounded-2xl aspect-[4/3] flex items-center justify-center p-8 text-center relative overflow-hidden">
                <div className="absolute inset-0 bg-primary/5"></div>
                <div className="relative z-10 text-primary/30">
                  <Activity className="w-32 h-32 mx-auto mb-4" />
                  <span className="font-serif italic text-xl">Primary Education</span>
                </div>
              </div>
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-bold mb-6 uppercase tracking-wider">
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
              </div>
            </div>

            <hr className="border-border" />

            {/* Secondary */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
              <div className="order-2 lg:order-1">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/10 text-secondary text-sm font-bold mb-6 uppercase tracking-wider">
                  Ages 11 - 17
                </div>
                <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-6">Junior & Senior Secondary</h2>
                <p className="text-muted-foreground text-lg mb-6 leading-relaxed">
                  Preparing young adults for higher education and life. We combine rigorous academic preparation (WAEC, NECO) with the Erdkinder philosophy — giving adolescents real-world responsibilities and leadership opportunities.
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
                    <span>Intensive exam preparation and career counseling.</span>
                  </li>
                </ul>
                <Link href="/admissions" className="inline-flex items-center text-primary font-bold hover:gap-2 transition-all">
                  Apply for Secondary <MoveRight className="ml-2 w-5 h-5" />
                </Link>
              </div>
              <div className="order-1 lg:order-2 rounded-2xl overflow-hidden shadow-2xl h-full min-h-[400px]">
                <img 
                  src={programsImg} 
                  alt="Secondary School Students in Classroom" 
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Extracurriculars */}
      <section className="py-24 bg-card border-t border-border">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl font-serif font-bold text-foreground mb-6">Beyond the Classroom</h2>
            <p className="text-muted-foreground text-lg">Education at Tarepet extends far beyond academics. We cultivate well-rounded individuals through diverse activities.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Palette, title: "Creative Arts", desc: "Painting, sculpture, and craft to express inner creativity." },
              { icon: Activity, title: "Sports & Athletics", desc: "Physical education, team sports, and athletic competitions." },
              { icon: BookOpen, title: "Literary & Debating", desc: "Public speaking, poetry, and debate clubs to build confidence." },
              { icon: Target, title: "STEM Club", desc: "Coding, robotics, and hands-on science experiments." }
            ].map((item, i) => (
              <div key={i} className="p-8 bg-muted rounded-xl text-center hover-elevate border border-transparent hover:border-border transition-colors">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm text-primary">
                  <item.icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-3">{item.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-secondary text-center text-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-serif font-bold mb-6">Ready to see our programs in action?</h2>
          <Link href="/contact" className="inline-flex items-center justify-center rounded-md text-base font-medium bg-white text-secondary hover:bg-white/90 h-12 px-8 py-2">
            Schedule a Campus Tour
          </Link>
        </div>
      </section>
    </PageTransition>
  );
}
