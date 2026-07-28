import { PageTransition } from "@/components/layout/Layout";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Search, Calendar, ChevronRight, Sparkles } from "lucide-react";
import { Link } from "wouter";
import { motion } from "framer-motion";

const CATEGORIES = ["All", "Montessori Method", "School Events", "Student Achievements", "Sports", "Parenting"];

const BLOG_POSTS = [
  {
    id: 1,
    title: "Understanding the Prepared Environment",
    category: "Montessori Method",
    date: "October 12, 2024",
    excerpt: "Why the physical space is considered the 'third teacher' in a Montessori classroom and how we design it at Tare Pet.",
    imageColor: "bg-primary/20",
    side: -70,
  },
  {
    id: 2,
    title: "Highlights from our Annual Inter-House Sports",
    category: "Sports",
    date: "November 5, 2024",
    excerpt: "A day of physical excellence, teamwork, and school spirit at the Murpiry stadium grounds.",
    imageColor: "bg-secondary/20",
    side: 0,
  },
  {
    id: 3,
    title: "Tare Pet Students Win State Math Olympiad",
    category: "Student Achievements",
    date: "November 18, 2024",
    excerpt: "Our senior secondary students demonstrated exceptional problem-solving skills at the recent Bayelsa State competition.",
    imageColor: "bg-primary/15",
    side: 70,
  },
  {
    id: 4,
    title: "How to Foster Independence at Home",
    category: "Parenting",
    date: "December 2, 2024",
    excerpt: "Practical tips for parents to mirror the Montessori philosophy of independence within the household.",
    imageColor: "bg-secondary/15",
    side: -70,
  },
  {
    id: 5,
    title: "Cultural Day 2024: Celebrating Diversity",
    category: "School Events",
    date: "January 15, 2025",
    excerpt: "A vibrant showcase of attire, food, and traditions representing the diverse backgrounds of our student body.",
    imageColor: "bg-primary/25",
    side: 0,
  },
  {
    id: 6,
    title: "The Importance of Practical Life Activities",
    category: "Montessori Method",
    date: "February 3, 2025",
    excerpt: "Why sweeping, pouring, and buttoning are crucial developmental tasks for nursery students.",
    imageColor: "bg-secondary/25",
    side: 70,
  }
];

export default function Blog() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredPosts = BLOG_POSTS.filter(post => {
    const matchesCategory = activeCategory === "All" || post.category === activeCategory;
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          post.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <PageTransition>
      {/* Header */}
      <section className="bg-gradient-to-br from-primary via-primary/95 to-primary/90 py-28 md:py-36 text-white relative overflow-hidden">
        <div className="absolute inset-0 glass-shimmer pointer-events-none opacity-25" />
        <div className="container mx-auto px-4 md:px-6 relative z-10">
          <div className="max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-1 rounded-full glass-button text-white text-xs font-semibold uppercase tracking-wider mb-6"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Insights & Updates</span>
            </motion.div>
            <motion.h1 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl md:text-6xl font-serif font-bold text-white mb-6 tracking-tight"
            >
              News & Articles
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg md:text-xl text-white/90 font-sans leading-relaxed"
            >
              Stay updated with school events, educational insights, and the latest from the Tare Pet community.
            </motion.p>
          </div>
        </div>
      </section>

      <section className="py-24 bg-background relative overflow-hidden">
        <div className="container mx-auto px-4 md:px-6">
          
          {/* Controls: Search & Filter */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-16">
            <div className="flex flex-wrap gap-2.5 w-full md:w-auto">
              {CATEGORIES.map(category => (
                <button
                  key={category}
                  onClick={() => setActiveCategory(category)}
                  className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${
                    activeCategory === category 
                      ? "bg-gradient-to-r from-primary to-primary/90 text-white shadow-lg shadow-primary/20 scale-105" 
                      : "glass-button text-foreground hover:bg-white"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>

            <div className="relative w-full md:w-72">
              <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input 
                type="text" 
                placeholder="Search articles..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-11 bg-white/80 border-white/80 rounded-full h-11 focus:ring-primary shadow-sm"
              />
            </div>
          </div>

          {/* Posts Grid with Left/Right Sliding Animations */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredPosts.map((post, idx) => (
              <motion.article 
                key={post.id} 
                initial={{ opacity: 0, x: post.side, y: post.side === 0 ? 50 : 0 }}
                whileInView={{ opacity: 1, x: 0, y: 0 }}
                viewport={{ once: false, margin: "-40px" }}
                transition={{ duration: 0.65, delay: idx * 0.1 }}
                whileHover={{ y: -8, scale: 1.02 }}
                className="glass-card rounded-3xl border border-white/80 overflow-hidden flex flex-col group shadow-md hover:shadow-2xl transition-all duration-300"
              >
                <div className={`h-40 ${post.imageColor} relative overflow-hidden flex items-center justify-center p-6`}>
                  <span className="font-serif italic text-lg text-foreground/40 font-bold">{post.category}</span>
                </div>
                <div className="p-8 flex-1 flex flex-col">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{post.date}</span>
                  </div>
                  <h2 className="text-xl font-serif font-bold text-foreground mb-3 leading-snug group-hover:text-primary transition-colors">
                    {post.title}
                  </h2>
                  <p className="text-muted-foreground text-sm leading-relaxed mb-6 flex-1">
                    {post.excerpt}
                  </p>
                  <Link href={`/blog/${post.id}`} className="inline-flex items-center text-sm font-bold text-primary group-hover:translate-x-1.5 transition-transform mt-auto">
                    Read Article <ChevronRight className="ml-1.5 w-4 h-4" />
                  </Link>
                </div>
              </motion.article>
            ))}
          </div>

        </div>
      </section>
    </PageTransition>
  );
}
