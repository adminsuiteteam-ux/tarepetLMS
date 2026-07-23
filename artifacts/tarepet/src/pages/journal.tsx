import { PageTransition } from "@/components/layout/Layout";
import { useState } from "react";
import { motion } from "framer-motion";
import { Calendar, User, ArrowRight } from "lucide-react";
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
    colorClass: "bg-primary/10",
  },
  {
    id: 2,
    title: "Building a Sustainable Garden",
    author: "Chukwuemeka Nduka",
    role: "JSS2 Student",
    date: "February 8, 2025",
    category: "Projects",
    excerpt: "Our class planted native Bayelsa vegetables behind the science lab. We measured soil pH, researched companion planting, and designed an irrigation plan. It's more than gardening—it's real science.",
    colorClass: "bg-secondary/10",
  },
  {
    id: 3,
    title: "When a Student Teaches the Teacher",
    author: "Mr. Tonye Davies",
    role: "Mathematics Coordinator",
    date: "February 5, 2025",
    category: "Staff Notes",
    excerpt: "A primary 5 student showed me a shortcut for multiplying two-digit numbers I'd never seen. These children are capable of extraordinary thinking when we give them space.",
    colorClass: "bg-muted",
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
  },
  {
    id: 6,
    title: "Learning to Ask for Help",
    author: "Daniel Perebo",
    role: "JSS1 Student",
    date: "January 25, 2025",
    category: "Reflections",
    excerpt: "I used to think asking questions meant I was slow. But here, teachers celebrate questions. Now I know asking is how you get smarter, not proof you're not smart enough.",
    colorClass: "bg-muted-foreground/10",
  },
  {
    id: 7,
    title: "The Montessori Materials Work",
    author: "Mrs. Blessing Igodo",
    role: "Nursery Coordinator",
    date: "January 20, 2025",
    category: "Staff Notes",
    excerpt: "A three-year-old spent forty minutes with the pink tower today. No interruptions, no distractions—just pure focus. This is what happens when we respect the child's natural rhythm.",
    colorClass: "bg-primary/15",
  },
  {
    id: 8,
    title: "Writing Our Community History",
    author: "Victory Okoko",
    role: "Primary 6 Student",
    date: "January 15, 2025",
    category: "Projects",
    excerpt: "Our group interviewed elders in Kpansia about life before the oil boom. We recorded stories, took photographs, and made a booklet. History isn't just textbooks anymore.",
    colorClass: "bg-secondary/15",
  },
  {
    id: 9,
    title: "First Day Jitters Turned Joy",
    author: "Ms. Ebitimi George",
    role: "Admissions Counselor",
    date: "January 10, 2025",
    category: "Classroom Life",
    excerpt: "A new nursery student arrived crying this morning. By afternoon, she was showing a friend how to water the plants. The prepared environment does the heavy lifting—we just guide.",
    colorClass: "bg-primary/10",
  },
  {
    id: 10,
    title: "Competing with Kindness",
    author: "Godspower Amaju",
    role: "SSS1 Student",
    date: "January 5, 2025",
    category: "Achievements",
    excerpt: "We won the inter-school debate, but what I'm proudest of is how we helped the opposing team fix their microphone before the round. Competition doesn't have to kill compassion.",
    colorClass: "bg-secondary/10",
  },
];

export default function Journal() {
  const [activeCategory, setActiveCategory] = useState("All");

  const filteredEntries = JOURNAL_ENTRIES.filter(entry => {
    return activeCategory === "All" || entry.category === activeCategory;
  });

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08
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
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-foreground mb-6">School Journal</h1>
            <p className="text-lg text-muted-foreground">
              A window into daily school life—reflections, discoveries, and moments from our students and staff. These are the real stories of learning at Tarepet.
            </p>
          </div>
        </div>
      </section>

      <section className="py-16 bg-background min-h-[50vh]">
        <div className="container mx-auto px-4 md:px-6">
          
          {/* Categories */}
          <div className="flex flex-wrap gap-3 mb-12">
            {CATEGORIES.map(category => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`px-5 py-2 rounded-full text-sm font-medium transition-colors ${
                  activeCategory === category 
                    ? "bg-primary text-white" 
                    : "bg-muted text-foreground hover:bg-muted-foreground/10"
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Grid */}
          <motion.div 
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {filteredEntries.map(entry => (
              <motion.article 
                key={entry.id} 
                variants={item}
                className="bg-card rounded-2xl border border-border overflow-hidden flex flex-col group hover:shadow-xl transition-all hover:-translate-y-1"
              >
                <div className={`h-32 ${entry.colorClass} relative overflow-hidden flex items-center justify-center`}>
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-black/5 backdrop-blur-[1px]"></div>
                </div>
                <div className="p-6 flex-1 flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-bold uppercase tracking-wider text-secondary">
                      {entry.category}
                    </span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> {entry.date}
                    </span>
                  </div>
                  <h2 className="text-xl font-serif font-bold text-foreground mb-3 leading-snug group-hover:text-primary transition-colors">
                    {entry.title}
                  </h2>
                  <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground">
                    <User className="w-4 h-4" />
                    <span className="font-medium text-foreground">{entry.author}</span>
                    <span>·</span>
                    <span>{entry.role}</span>
                  </div>
                  <p className="text-muted-foreground text-sm leading-relaxed mb-6 flex-1">
                    {entry.excerpt}
                  </p>
                  <Link 
                    href={`/journal/${entry.id}`} 
                    className="inline-flex items-center text-sm font-bold text-foreground group-hover:text-primary transition-colors mt-auto"
                  >
                    Continue reading <ArrowRight className="ml-1 w-4 h-4" />
                  </Link>
                </div>
              </motion.article>
            ))}
          </motion.div>

        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-16 bg-secondary text-white">
        <div className="container mx-auto px-4 md:px-6">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-serif font-bold mb-4">
              Share Your Story
            </h2>
            <p className="text-white/90 text-lg mb-8">
              Students and staff are invited to submit journal entries about their experiences, projects, and reflections. Your voice matters here.
            </p>
            <Link 
              href="/contact" 
              className="inline-flex items-center justify-center rounded-md text-base font-medium bg-white text-secondary hover:bg-white/90 h-14 px-8 py-3 transition-colors"
            >
              Submit Your Entry
            </Link>
          </div>
        </div>
      </section>
    </PageTransition>
  );
}
