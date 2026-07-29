import { PageTransition } from "@/components/layout/Layout";
import { motion } from "framer-motion";
import { Calendar, Clock, MapPin, Sparkles } from "lucide-react";
import { Link } from "wouter";

const UPCOMING_EVENTS = [
  {
    id: 1,
    title: "Annual Graduation Ceremony",
    date: "March 15, 2025",
    time: "10:00 AM",
    location: "School Auditorium, Kpansia",
    description: "Celebrating our graduating class of 2025. A formal ceremony honoring academic excellence and personal growth.",
    colorClass: "bg-primary/20",
    side: -70,
  },
  {
    id: 2,
    title: "Inter-House Sports Day",
    date: "April 10, 2025",
    time: "8:00 AM - 4:00 PM",
    location: "Murpiry Sports Complex",
    description: "A full day of athletic competition, team spirit, and physical excellence across all age groups.",
    colorClass: "bg-secondary/20",
    side: 0,
  },
  {
    id: 3,
    title: "Parent-Teacher Conference",
    date: "April 22, 2025",
    time: "2:00 PM - 6:00 PM",
    location: "Individual Classrooms",
    description: "Private meetings to discuss student progress, goals, and partnership between home and school.",
    colorClass: "bg-primary/15",
    side: 70,
  },
  {
    id: 4,
    title: "Science & Technology Fair",
    date: "May 8, 2025",
    time: "9:00 AM - 3:00 PM",
    location: "School Grounds",
    description: "Students present research projects, experiments, and innovations. Open to the public.",
    colorClass: "bg-secondary/15",
    side: -70,
  },
  {
    id: 5,
    title: "Cultural Day Celebration",
    date: "May 20, 2025",
    time: "10:00 AM - 2:00 PM",
    location: "Main Hall",
    description: "A vibrant showcase of traditions, attire, food, and performances representing our diverse student body.",
    colorClass: "bg-primary/20",
    side: 0,
  },
  {
    id: 6,
    title: "End of Term Thanksgiving",
    date: "June 28, 2025",
    time: "11:00 AM",
    location: "School Chapel",
    description: "A moment of gratitude and reflection as we close the academic term.",
    colorClass: "bg-secondary/20",
    side: 70,
  },
];

export default function Events() {
  return (
    <PageTransition>
      {/* Hero Header */}
      <section className="bg-gradient-to-br from-[#8b152b] via-primary/95 to-[#123922] text-white pt-32 pb-24 md:pt-40 md:pb-32 relative overflow-hidden border-b border-white/10">
        {/* Background Image Layer */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1511578314322-379afb476865?q=80&w=2000&auto=format&fit=crop"
            alt="School Events & Celebrations"
            className="w-full h-full object-cover opacity-20 scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#8b152b]/92 via-primary/90 to-[#123922]/92 mix-blend-multiply" />
        </div>

        {/* Background Ambient Glow & Glass Shimmer */}
        <div className="absolute inset-0 glass-shimmer pointer-events-none opacity-20 z-0" />
        <div className="absolute top-10 left-10 w-96 h-96 bg-primary/30 rounded-full blur-3xl pointer-events-none animate-pulse" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-secondary/35 rounded-full blur-3xl pointer-events-none animate-pulse" />

        <div className="container mx-auto px-4 md:px-6 text-center relative z-10 max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-button text-white text-xs font-semibold uppercase tracking-wider mb-6 shadow-lg border border-white/20"
          >
            <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
            <span>School Calendar & Celebrations</span>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-5xl md:text-6xl font-serif font-bold text-white mb-6 tracking-tight drop-shadow-md leading-[1.15]"
          >
            Upcoming Events & <span className="text-white/90 italic font-light">Campus Gatherings</span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg md:text-xl text-white/90 max-w-3xl mx-auto font-sans leading-relaxed font-normal"
          >
            Join us for upcoming academic, sports competitions, science fairs, cultural celebrations, and parent-teacher conferences at Tare Pet Montessori School.
          </motion.p>
        </div>
      </section>

      {/* Events Grid */}
      <section className="py-24 bg-background relative overflow-hidden">
        <div className="container mx-auto px-4 md:px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto mb-16"
          >
            <h2 className="text-4xl font-serif font-bold text-foreground mb-4">Upcoming Gatherings</h2>
            <p className="text-muted-foreground text-lg">Mark your calendar and participate in our vibrant school life.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {UPCOMING_EVENTS.map((event, idx) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, x: event.side, y: event.side === 0 ? 50 : 0 }}
                whileInView={{ opacity: 1, x: 0, y: 0 }}
                viewport={{ once: false, margin: "-40px" }}
                transition={{ duration: 0.65, delay: idx * 0.1 }}
                whileHover={{ y: -8, scale: 1.02 }}
                className="glass-card rounded-3xl border border-white/80 overflow-hidden flex flex-col group shadow-md hover:shadow-2xl transition-all duration-300"
              >
                <div className={`h-32 ${event.colorClass} p-6 flex flex-col justify-between relative`}>
                  <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-white/80 text-foreground self-start shadow-sm">
                    Upcoming
                  </span>
                  <h3 className="font-serif font-bold text-2xl text-foreground group-hover:text-primary transition-colors leading-tight">
                    {event.title}
                  </h3>
                </div>

                <div className="p-8 flex-1 flex flex-col">
                  <div className="space-y-3 mb-6 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2.5">
                      <Calendar className="w-4 h-4 text-primary" />
                      <span className="font-semibold text-foreground">{event.date}</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <Clock className="w-4 h-4 text-secondary" />
                      <span>{event.time}</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <MapPin className="w-4 h-4 text-primary" />
                      <span>{event.location}</span>
                    </div>
                  </div>

                  <p className="text-muted-foreground text-sm leading-relaxed mb-6 flex-1">
                    {event.description}
                  </p>

                  <Link
                    href="/contact"
                    className="inline-flex items-center justify-center rounded-full py-2.5 px-5 text-xs font-bold uppercase tracking-wider text-white bg-gradient-to-r from-primary to-primary/90 shadow-md hover:scale-105 active:scale-95 transition-all mt-auto"
                  >
                    RSVP / Inquire
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </PageTransition>
  );
}
