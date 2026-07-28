import { PageTransition } from "@/components/layout/Layout";
import { useState } from "react";
import { motion } from "framer-motion";
import { Calendar, User, ArrowRight, Sparkles } from "lucide-react";
import { Link } from "wouter";

const CATEGORIES = ["All", "Classroom Life", "Projects", "Reflections", "Staff Notes", "Achievements"];

const JOURNAL_ENTRIES = [
  {
    id: 1,
    title: "The Joy of Practical Life",
    author: "Ms. Amaka Obi",
    role: "Class Teacher",
    date: "February 10, 2025",
    category: "Classroom Life",
    excerpt: "Watching the nursery children pour water from pitcher to glass with such intense concentration reminds me why we do this work. Independence blooms in the smallest moments.",
    colorClass: "bg-primary/15",
    side: -70,
  },
  {
    id: 2,
    title: "Building a Sustainable Garden",
    author: "Chukwuemeka Nduka",
    role: "JSS2 Student",
    date: "February 8, 2025",
    category: "Projects",
    excerpt: "Our class planted native Bayelsa vegetables behind the science lab. We measured soil pH, researched companion planting, and designed an irrigation plan. It's more than gardening—it's real science.",
    colorClass: "bg-secondary/15",
    side: 0,
  },
  {
    id: 3,
    title: "When a Student Teaches the Teacher",
    author: "Mr. Tonye Davies",
    role: "Mathematics Coordinator",
    date: "February 5, 2025",
    category: "Staff Notes",
    excerpt: "A primary 5 student showed me a shortcut for multiplying two-digit numbers I'd never seen. These children are capable of extraordinary thinking when we give them space.",
    colorClass: "bg-primary/10",
    side: 70,
  },
  {
    id: 4,
    title: "Understanding Fractions Through Cooking",
    author: "Faith Ibiene",
    role: "Primary 4 Student",
    date: "February 1, 2025",
    category: "Reflections",
    excerpt: "We made chin-chin in class today and had to halve the recipe. Suddenly fractions made sense! Why didn't anyone tell me cooking was just math you can eat?",
    colorClass: "bg-primary/20",
    side: -70,
  },
  {
    id: 5,
    title: "Our Science Fair Success",
    author: "Ms. Preye Eke",
    role: "Science Teacher",
    date: "January 28, 2025",
    category: "Achievements",
    excerpt: "Three of our students won medals at the regional fair with their water filtration project. They designed it, tested it, and presented it with confidence. I just pointed them toward resources.",
    colorClass: "bg-secondary/20",
    side: 0,
  },
  {
    id: 6,
    title: "Learning to Ask for Help",
    author: "Daniel Perebo",
    role: "JSS1 Student",
    date: "January 25, 2025",
    category: "Reflections",
    excerpt: "I used to think asking questions meant I was slow. But here, teachers celebrate questions. Now I know asking is how you get smarter, not proof you're not smart enough.",
    colorClass: "bg-secondary/10",
    side: 70,
  },
];

export default function Journal() {
  const [activeCategory, setActiveCategory] = useState("All");

  const filteredEntries = activeCategory === "All"
    ? JOURNAL_ENTRIES
    : JOURNAL_ENTRIES.filter(e => e.category === activeCategory);

  return (
    <PageTransition>
      {/* Header */}
      <section className="bg-gradient-to-br from-secondary via-secondary/95 to-secondary/90 py-28 md:py-36 text-white relative overflow-hidden">
        <div className="absolute inset-0 glass-shimmer pointer-events-none opacity-20" />
        <div className="container mx-auto px-4 md:px-6 relative z-10">
          <div className="max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-1 rounded-full glass-button text-white text-xs font-semibold uppercase tracking-wider mb-6"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Stories of Learning</span>
            </motion.div>
            <motion.h1 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl md:text-6xl font-serif font-bold text-white mb-6 tracking-tight"
            >
              School Journal
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg md:text-xl text-white/90 font-sans leading-relaxed"
            >
              A window into daily school life—reflections, discoveries, and moments from our students and staff. These are the real stories of learning at Tare Pet.
            </motion.p>
          </div>
        </div>
      </section>

      <section className="py-24 bg-background min-h-[50vh] relative overflow-hidden">
        <div className="container mx-auto px-4 md:px-6">
          
          {/* Categories */}
          <div className="flex flex-wrap gap-3 mb-14">
            {CATEGORIES.map(category => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${
                  activeCategory === category 
                    ? "bg-gradient-to-r from-primary to-primary/90 text-white shadow-lg shadow-primary/20 scale-105" 
                    : "glass-button text-foreground hover:bg-white"
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Grid with Left/Right Sliding Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredEntries.map((entry, idx) => (
              <motion.article 
                key={entry.id} 
                initial={{ opacity: 0, x: entry.side, y: entry.side === 0 ? 50 : 0 }}
                whileInView={{ opacity: 1, x: 0, y: 0 }}
                viewport={{ once: false, margin: "-40px" }}
                transition={{ duration: 0.65, delay: idx * 0.1 }}
                whileHover={{ y: -8, scale: 1.02 }}
                className="glass-card rounded-3xl border border-white/80 overflow-hidden flex flex-col group shadow-md hover:shadow-2xl transition-all duration-300"
              >
                <div className={`h-36 ${entry.colorClass} relative overflow-hidden flex items-center justify-center`}>
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-black/5 backdrop-blur-[1px]" />
                </div>
                <div className="p-8 flex-1 flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-bold uppercase tracking-wider text-secondary bg-secondary/10 px-3 py-1 rounded-full">
                      {entry.category}
                    </span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" /> {entry.date}
                    </span>
                  </div>
                  <h2 className="text-xl font-serif font-bold text-foreground mb-3 leading-snug group-hover:text-primary transition-colors">
                    {entry.title}
                  </h2>
                  <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground">
                    <User className="w-4 h-4" />
                    <span className="font-semibold text-foreground">{entry.author}</span>
                    <span>·</span>
                    <span>{entry.role}</span>
                  </div>
                  <p className="text-muted-foreground text-sm leading-relaxed mb-6 flex-1">
                    {entry.excerpt}
                  </p>
                  <Link 
                    href={`/journal/${entry.id}`} 
                    className="inline-flex items-center text-sm font-bold text-primary group-hover:translate-x-1.5 transition-all mt-auto"
                  >
                    Continue reading <ArrowRight className="ml-1.5 w-4 h-4" />
                  </Link>
                </div>
              </motion.article>
            ))}
          </div>

        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-20 bg-secondary text-white text-center relative overflow-hidden">
        <div className="container mx-auto px-4 md:px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: false }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl mx-auto"
          >
            <h2 className="text-3xl md:text-4xl font-serif font-bold mb-4">
              Share Your Story
            </h2>
            <p className="text-white/90 text-lg mb-8 leading-relaxed">
              Students and staff are invited to submit journal entries about their experiences, projects, and reflections. Your voice matters here.
            </p>
            <Link 
              href="/contact" 
              className="inline-flex items-center justify-center rounded-full text-base font-semibold glass-button text-white hover:bg-white/20 h-14 px-8 py-3 hover:scale-105 active:scale-95 transition-all"
            >
              Submit Your Entry
            </Link>
          </motion.div>
        </div>
      </section>
    </PageTransition>
  );
}
