import { PageTransition } from "@/components/layout/Layout";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Search, Calendar, ChevronRight } from "lucide-react";
import { Link } from "wouter";

const CATEGORIES = ["All", "Montessori Method", "School Events", "Student Achievements", "Sports", "Parenting"];

const BLOG_POSTS = [
  {
    id: 1,
    title: "Understanding the Prepared Environment",
    category: "Montessori Method",
    date: "October 12, 2024",
    excerpt: "Why the physical space is considered the 'third teacher' in a Montessori classroom and how we design it at Tarepet.",
    imageColor: "bg-primary/20",
  },
  {
    id: 2,
    title: "Highlights from our Annual Inter-House Sports",
    category: "Sports",
    date: "November 5, 2024",
    excerpt: "A day of physical excellence, teamwork, and school spirit at the Murpiry stadium grounds.",
    imageColor: "bg-secondary/20",
  },
  {
    id: 3,
    title: "Tarepet Students Win State Math Olympiad",
    category: "Student Achievements",
    date: "November 18, 2024",
    excerpt: "Our senior secondary students demonstrated exceptional problem-solving skills at the recent Bayelsa State competition.",
    imageColor: "bg-muted-foreground/20",
  },
  {
    id: 4,
    title: "How to Foster Independence at Home",
    category: "Parenting",
    date: "December 2, 2024",
    excerpt: "Practical tips for parents to mirror the Montessori philosophy of independence within the household.",
    imageColor: "bg-primary/10",
  },
  {
    id: 5,
    title: "Cultural Day 2024: Celebrating Diversity",
    category: "School Events",
    date: "January 15, 2025",
    excerpt: "A vibrant showcase of attire, food, and traditions representing the diverse backgrounds of our student body.",
    imageColor: "bg-secondary/10",
  },
  {
    id: 6,
    title: "The Importance of Practical Life Activities",
    category: "Montessori Method",
    date: "February 3, 2025",
    excerpt: "Why sweeping, pouring, and buttoning are crucial developmental tasks for nursery students.",
    imageColor: "bg-primary/30",
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
      <section className="bg-muted py-16 md:py-24 border-b border-border">
        <div className="container mx-auto px-4 md:px-6">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-foreground mb-6">News & Insights</h1>
            <p className="text-lg text-muted-foreground mb-10">
              Stay updated with school events, educational insights, and the latest from the Tarepet community.
            </p>
            
            <div className="relative max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <Input 
                type="text"
                placeholder="Search articles..."
                className="pl-12 h-14 text-base bg-card border-border shadow-sm rounded-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
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
          {filteredPosts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredPosts.map(post => (
                <article key={post.id} className="bg-card rounded-2xl border border-border overflow-hidden flex flex-col group hover:shadow-xl transition-all hover:-translate-y-1">
                  <div className={`h-48 ${post.imageColor} relative overflow-hidden`}>
                     {/* Image Placeholder */}
                     <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/10 backdrop-blur-sm">
                       <span className="text-black/50 font-serif italic font-bold text-xl">Read Article</span>
                     </div>
                  </div>
                  <div className="p-6 flex-1 flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xs font-bold uppercase tracking-wider text-secondary">
                        {post.category}
                      </span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> {post.date}
                      </span>
                    </div>
                    <h2 className="text-xl font-serif font-bold text-foreground mb-3 leading-snug group-hover:text-primary transition-colors">
                      {post.title}
                    </h2>
                    <p className="text-muted-foreground text-sm leading-relaxed mb-6 flex-1">
                      {post.excerpt}
                    </p>
                    <Link href={`/blog/${post.id}`} className="inline-flex items-center text-sm font-bold text-foreground group-hover:text-primary transition-colors mt-auto">
                      Read full story <ChevronRight className="ml-1 w-4 h-4" />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-muted/50 rounded-2xl border border-dashed border-border">
              <h3 className="text-xl font-serif font-bold text-foreground mb-2">No articles found</h3>
              <p className="text-muted-foreground">Try adjusting your search or category filter.</p>
              <button 
                onClick={() => { setSearchQuery(""); setActiveCategory("All"); }}
                className="mt-6 text-primary font-medium hover:underline"
              >
                Clear all filters
              </button>
            </div>
          )}

        </div>
      </section>
    </PageTransition>
  );
}
