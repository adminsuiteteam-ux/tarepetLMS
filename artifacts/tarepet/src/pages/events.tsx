import { PageTransition } from "@/components/layout/Layout";
import { useState } from "react";
import { motion } from "framer-motion";
import { Calendar, Clock, MapPin, CheckCircle2 } from "lucide-react";

const UPCOMING_EVENTS = [
  {
    id: 1,
    title: "Annual Graduation Ceremony",
    date: "March 15, 2025",
    time: "10:00 AM",
    location: "School Auditorium, Kpansia",
    description: "Celebrating our graduating class of 2025. A formal ceremony honoring academic excellence and personal growth.",
    colorClass: "bg-primary/20",
  },
  {
    id: 2,
    title: "Inter-House Sports Day",
    date: "April 10, 2025",
    time: "8:00 AM - 4:00 PM",
    location: "Murpiry Sports Complex",
    description: "A full day of athletic competition, team spirit, and physical excellence across all age groups.",
    colorClass: "bg-secondary/20",
  },
  {
    id: 3,
    title: "Parent-Teacher Conference",
    date: "April 22, 2025",
    time: "2:00 PM - 6:00 PM",
    location: "Individual Classrooms",
    description: "Private meetings to discuss student progress, goals, and partnership between home and school.",
    colorClass: "bg-muted",
  },
  {
    id: 4,
    title: "Science & Technology Fair",
    date: "May 8, 2025",
    time: "9:00 AM - 3:00 PM",
    location: "School Grounds",
    description: "Students present research projects, experiments, and innovations. Open to the public.",
    colorClass: "bg-primary/15",
  },
  {
    id: 5,
    title: "Cultural Day Celebration",
    date: "May 20, 2025",
    time: "10:00 AM - 2:00 PM",
    location: "Main Hall",
    description: "A vibrant showcase of traditions, attire, food, and performances representing our diverse student body.",
    colorClass: "bg-secondary/15",
  },
  {
    id: 6,
    title: "End of Term Thanksgiving",
    date: "June 28, 2025",
    time: "11:00 AM",
    location: "School Chapel",
    description: "A moment of gratitude and reflection as we close the academic term.",
    colorClass: "bg-muted-foreground/15",
  },
  {
    id: 7,
    title: "Summer Reading Program",
    date: "July 7 - August 1, 2025",
    time: "9:00 AM - 12:00 PM",
    location: "School Library",
    description: "Four weeks of reading enrichment, book discussions, and literacy activities for continuing students.",
    colorClass: "bg-primary/10",
  },
  {
    id: 8,
    title: "New Academic Year Orientation",
    date: "September 5, 2025",
    time: "8:00 AM",
    location: "Assembly Ground",
    description: "Welcome ceremony for new and returning students as we begin the 2025/2026 academic year.",
    colorClass: "bg-secondary/10",
  },
];

const PAST_EVENTS = [
  {
    id: 9,
    title: "Christmas Carol Concert",
    date: "December 18, 2024",
    location: "School Auditorium",
    description: "A festive evening of music, choral performances, and holiday spirit with students and parents.",
    colorClass: "bg-primary/20",
  },
  {
    id: 10,
    title: "Mathematics Olympiad",
    date: "November 12, 2024",
    location: "Science Lab",
    description: "Our students competed in problem-solving challenges and brought home three medals.",
    colorClass: "bg-secondary/20",
  },
  {
    id: 11,
    title: "Founder's Day",
    date: "October 25, 2024",
    location: "School Grounds",
    description: "Celebrating the vision and legacy of Tarepet's founding with alumni, staff, and community members.",
    colorClass: "bg-muted",
  },
  {
    id: 12,
    title: "Open House Day",
    date: "September 14, 2024",
    location: "All Classrooms",
    description: "Prospective families toured the campus, met teachers, and experienced Montessori education firsthand.",
    colorClass: "bg-primary/15",
  },
  {
    id: 13,
    title: "West Africa Junior Science Olympiad",
    date: "August 8, 2024",
    location: "Port Harcourt",
    description: "Our team represented Bayelsa State and finished in the top five regionally.",
    colorClass: "bg-secondary/15",
  },
  {
    id: 14,
    title: "Graduation Ceremony Class of 2024",
    date: "July 20, 2024",
    location: "School Auditorium",
    description: "A proud moment as we sent our 2024 graduates into the world prepared and confident.",
    colorClass: "bg-muted-foreground/15",
  },
];

export default function Events() {
  const [activeTab, setActiveTab] = useState<"upcoming" | "past">("upcoming");

  const displayedEvents = activeTab === "upcoming" ? UPCOMING_EVENTS : PAST_EVENTS;

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.06
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <PageTransition>
      {/* Header */}
      <section className="bg-muted py-16 md:py-24 border-b border-border">
        <div className="container mx-auto px-4 md:px-6">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-foreground mb-6">Events & Activities</h1>
            <p className="text-lg text-muted-foreground">
              Join us for school celebrations, academic competitions, community gatherings, and memorable moments throughout the year.
            </p>
          </div>
        </div>
      </section>

      <section className="py-16 bg-background min-h-[50vh]">
        <div className="container mx-auto px-4 md:px-6">
          
          {/* Tabs */}
          <div className="flex gap-3 mb-12 border-b border-border">
            <button
              onClick={() => setActiveTab("upcoming")}
              className={`px-6 py-3 font-medium text-base transition-colors relative ${
                activeTab === "upcoming" 
                  ? "text-primary" 
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Upcoming Events
              {activeTab === "upcoming" && (
                <motion.div 
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                />
              )}
            </button>
            <button
              onClick={() => setActiveTab("past")}
              className={`px-6 py-3 font-medium text-base transition-colors relative ${
                activeTab === "past" 
                  ? "text-primary" 
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Past Events
              {activeTab === "past" && (
                <motion.div 
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                />
              )}
            </button>
          </div>

          {/* Calendar Notice */}
          {activeTab === "upcoming" && (
            <div className="mb-12 bg-secondary/5 border border-secondary/20 rounded-xl p-6 flex items-start gap-4">
              <Calendar className="w-6 h-6 text-secondary shrink-0 mt-1" />
              <div>
                <h3 className="font-bold text-foreground mb-1">Add to Your Calendar</h3>
                <p className="text-sm text-muted-foreground">
                  Mark these dates and check back regularly for updates. Registration details will be shared via parent portal and email.
                </p>
              </div>
            </div>
          )}

          {/* Grid */}
          <motion.div 
            variants={container}
            initial="hidden"
            animate="show"
            key={activeTab}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {displayedEvents.map(event => (
              <motion.article 
                key={event.id} 
                variants={item}
                className="bg-card rounded-2xl border border-border overflow-hidden flex flex-col group hover:shadow-xl transition-all hover:-translate-y-1"
              >
                <div className={`h-3 ${event.colorClass}`}></div>
                <div className="p-6 flex-1 flex flex-col">
                  <h2 className="text-xl font-serif font-bold text-foreground mb-4 leading-snug group-hover:text-primary transition-colors">
                    {event.title}
                  </h2>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4 text-primary" />
                      <span className="font-medium text-foreground">{event.date}</span>
                    </div>
                    {event.time && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="w-4 h-4 text-primary" />
                        <span>{event.time}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="w-4 h-4 text-primary" />
                      <span>{event.location}</span>
                    </div>
                  </div>

                  <p className="text-muted-foreground text-sm leading-relaxed mb-6 flex-1">
                    {event.description}
                  </p>

                  {activeTab === "upcoming" ? (
                    <button className="w-full bg-primary text-white hover:bg-primary/90 transition-colors rounded-md py-3 text-sm font-medium">
                      Register / Learn More
                    </button>
                  ) : (
                    <div className="flex items-center gap-2 text-sm font-medium text-secondary">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>View Gallery</span>
                    </div>
                  )}
                </div>
              </motion.article>
            ))}
          </motion.div>

        </div>
      </section>
    </PageTransition>
  );
}
