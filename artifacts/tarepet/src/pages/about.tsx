import { PageTransition } from "@/components/layout/Layout";
import { Link } from "wouter";
import aboutImg from "@assets/generated_images/about.jpg";
import { CheckCircle } from "lucide-react";

export default function About() {
  return (
    <PageTransition>
      {/* Hero */}
      <section className="bg-secondary text-white py-20 md:py-32">
        <div className="container mx-auto px-4 md:px-6 text-center">
          <h1 className="text-4xl md:text-6xl font-serif font-bold mb-6">About Tarepet</h1>
          <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto">
            A premium educational institution dedicated to shaping confident, independent, and socially responsible leaders in Bayelsa State.
          </p>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-20 md:py-24 bg-background">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-5xl mx-auto">
            <div className="bg-card p-10 rounded-2xl shadow-sm border border-border border-t-4 border-t-primary">
              <h2 className="text-3xl font-serif font-bold text-foreground mb-6">Our Mission</h2>
              <p className="text-muted-foreground leading-relaxed text-lg">
                To provide a holistic, child-centered education that empowers students to discover their innate potential, cultivate a lifelong passion for learning, and develop the character needed to thrive in a dynamic world.
              </p>
            </div>
            <div className="bg-card p-10 rounded-2xl shadow-sm border border-border border-t-4 border-t-secondary">
              <h2 className="text-3xl font-serif font-bold text-foreground mb-6">Our Vision</h2>
              <p className="text-muted-foreground leading-relaxed text-lg">
                To be the foremost institution of academic excellence and character development in West Africa, raising a generation of thinkers, creators, and leaders grounded in the Montessori philosophy.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Image & Philosophy */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="rounded-2xl overflow-hidden shadow-2xl relative h-[500px]">
              <img 
                src={aboutImg} 
                alt="Tarepet School Building Exterior" 
                className="w-full h-full object-cover"
              />
            </div>
            
            <div>
              <h2 className="text-sm font-bold tracking-widest text-primary uppercase mb-3">Our Approach</h2>
              <h3 className="text-4xl md:text-5xl font-serif font-bold text-foreground mb-8">The Montessori Philosophy</h3>
              
              <div className="space-y-6 text-lg text-muted-foreground">
                <p>
                  At Tarepet Montessori School, we believe that education is not merely about transmitting facts, but about nurturing the human spirit. We adhere closely to the principles laid down by Dr. Maria Montessori.
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
                  <div key={i} className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-secondary" />
                    <span className="font-medium text-foreground">{point}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* History */}
      <section className="py-24 bg-card border-y border-border">
        <div className="container mx-auto px-4 md:px-6 text-center max-w-4xl">
          <h2 className="text-4xl font-serif font-bold text-foreground mb-8">Our History</h2>
          <p className="text-muted-foreground text-lg leading-relaxed mb-6">
            Located strategically at Kpansia-Epje, Yenagoa (Murpiry L. & Sec. Sch.), Tarepet Montessori School was established with a bold mandate: to redefine the standard of early childhood and secondary education in Bayelsa State.
          </p>
          <p className="text-muted-foreground text-lg leading-relaxed">
            From our modest beginnings, we have grown into a premier institution, recognized for our uncompromising academic standards, our dedicated staff, and the remarkable character of our alumni. We remain anchored to our roots while constantly innovating for the future.
          </p>
        </div>
      </section>

      {/* Leadership Team (Placeholders) */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl font-serif font-bold text-foreground mb-6">Our Leadership</h2>
            <p className="text-muted-foreground text-lg">Guided by experienced educators passionate about child development.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              { name: "Mrs. Taripreye E.", role: "Proprietress / Founder", initials: "TE" },
              { name: "Mr. Ayebatari D.", role: "Head of School", initials: "AD" },
              { name: "Dr. (Mrs) Preye K.", role: "Montessori Directress", initials: "PK" }
            ].map((leader, i) => (
              <div key={i} className="bg-card rounded-xl border border-border overflow-hidden text-center hover-elevate">
                <div className="h-48 bg-muted flex items-center justify-center">
                  <span className="text-5xl font-serif text-muted-foreground/30">{leader.initials}</span>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-foreground mb-1">{leader.name}</h3>
                  <p className="text-primary font-medium">{leader.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </PageTransition>
  );
}
