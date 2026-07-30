import { PageTransition } from "@/components/layout/Layout";
import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Sparkles, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  ZoomIn, 
  Play, 
  Filter, 
  Search, 
  Camera, 
  Calendar, 
  Tag, 
  ArrowRight,
  Heart,
  Grid,
  Maximize2
} from "lucide-react";
import { Link } from "wouter";

// Import available images from assets
import classroomHero from "@assets/classroom_hero.jpg";
import vibrantCampus from "@assets/vibrant_campus.jpg";
import admissionsHero from "@assets/admissions_hero.jpg";
import eventsHero from "@assets/events_hero.jpg";
import programsHero from "@assets/programs_hero.jpg";
import schoolBuilding from "@assets/school_building.jpg";
import journalHero from "@assets/journal_hero.jpg";

interface GalleryItem {
  id: number;
  title: string;
  category: string;
  date: string;
  description: string;
  image: string;
  type: "photo" | "video";
  featured?: boolean;
  aspect?: "tall" | "wide" | "square";
  likes: number;
}

const CATEGORIES = [
  "All",
  "Classroom Life",
  "Events & Culture",
  "Science & Projects",
  "Sports & Play",
  "Arts & Crafts",
  "Campus Views",
];

const GALLERY_ITEMS: GalleryItem[] = [
  {
    id: 1,
    title: "Practical Life Pouring Exercises",
    category: "Classroom Life",
    date: "February 12, 2025",
    description: "Nursery pupils mastering fine motor skills and concentration through Montessori practical life activities.",
    image: classroomHero,
    type: "photo",
    featured: true,
    aspect: "wide",
    likes: 42,
  },
  {
    id: 2,
    title: "Annual Cultural & Heritage Day",
    category: "Events & Culture",
    date: "February 04, 2025",
    description: "Students showcasing traditional Bayelsa and Nigerian attire, folk dances, and cultural storytelling.",
    image: eventsHero,
    type: "photo",
    featured: true,
    aspect: "tall",
    likes: 89,
  },
  {
    id: 3,
    title: "Botany & Sustainable Garden Project",
    category: "Science & Projects",
    date: "January 28, 2025",
    description: "Primary and secondary students tending to native plants while studying irrigation and plant biology.",
    image: vibrantCampus,
    type: "photo",
    aspect: "square",
    likes: 56,
  },
  {
    id: 4,
    title: "Hands-on Montessori Math Beads",
    category: "Classroom Life",
    date: "January 20, 2025",
    description: "Exploring place value, golden beads, and mathematical operations through concrete physical materials.",
    image: programsHero,
    type: "photo",
    aspect: "wide",
    likes: 37,
  },
  {
    id: 5,
    title: "Inter-House Sports & Field Festival",
    category: "Sports & Play",
    date: "January 15, 2025",
    description: "Energetic sprint races, relay games, and physical agility activities promoting sportsmanship.",
    image: admissionsHero,
    type: "photo",
    aspect: "square",
    likes: 64,
  },
  {
    id: 6,
    title: "Aerial View of Main School Complex",
    category: "Campus Views",
    date: "January 10, 2025",
    description: "Our serene, green, and secure campus located in Kpansia, Yenagoa, Bayelsa State.",
    image: schoolBuilding,
    type: "photo",
    featured: true,
    aspect: "wide",
    likes: 95,
  },
  {
    id: 7,
    title: "Creative Arts & Expression Exhibition",
    category: "Arts & Crafts",
    date: "December 18, 2024",
    description: "Students presenting original watercolor paintings, clay sculptures, and recycled art installations.",
    image: journalHero,
    type: "photo",
    aspect: "tall",
    likes: 51,
  },
  {
    id: 8,
    title: "Science Fair Water Filtration Demo",
    category: "Science & Projects",
    date: "December 10, 2024",
    description: "Award-winning water purification prototype created by our JSS student science team.",
    image: classroomHero,
    type: "video",
    aspect: "square",
    likes: 78,
  },
  {
    id: 9,
    title: "Reading Nook & Campus Library",
    category: "Classroom Life",
    date: "November 25, 2024",
    description: "Children discovering literature in our cozy, curated library reading corners.",
    image: journalHero,
    type: "photo",
    aspect: "wide",
    likes: 43,
  },
];

export default function Gallery() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [likedItems, setLikedItems] = useState<Record<number, boolean>>({});

  // Filter gallery items based on category and search query
  const filteredItems = useMemo(() => {
    return GALLERY_ITEMS.filter((item) => {
      const matchesCategory = activeCategory === "All" || item.category === activeCategory;
      const matchesSearch =
        searchQuery.trim() === "" ||
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, searchQuery]);

  // Handle keyboard navigation for Lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedImageIndex === null) return;
      if (e.key === "Escape") {
        setSelectedImageIndex(null);
      } else if (e.key === "ArrowLeft") {
        setSelectedImageIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : filteredItems.length - 1));
      } else if (e.key === "ArrowRight") {
        setSelectedImageIndex((prev) => (prev !== null && prev < filteredItems.length - 1 ? prev + 1 : 0));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedImageIndex, filteredItems.length]);

  const toggleLike = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setLikedItems((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const selectedItem = selectedImageIndex !== null ? filteredItems[selectedImageIndex] : null;

  return (
    <PageTransition>
      {/* Hero Header Section */}
      <section className="bg-slate-950 text-white pt-32 pb-24 md:pt-40 md:pb-32 relative overflow-hidden border-b border-white/10">
        {/* Hero Background Image & Gradient */}
        <div className="absolute inset-0 z-0">
          <img
            src={vibrantCampus}
            alt="Tare Pet Montessori School Campus Gallery"
            className="w-full h-full object-cover object-center opacity-90 scale-105 brightness-95"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-black/30" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-slate-950/40 to-black/50" />
        </div>

        {/* Ambient Glow Orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[120px] pointer-events-none animate-pulse" />
        <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-secondary/20 rounded-full blur-[120px] pointer-events-none" />

        <div className="container mx-auto px-4 md:px-6 text-center relative z-10 max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-button text-white text-xs font-semibold uppercase tracking-wider mb-6 shadow-lg border border-white/20"
          >
            <Camera className="w-3.5 h-3.5 text-yellow-400" />
            <span>Capturing Moments of Growth & Joy</span>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-5xl md:text-6xl font-serif font-bold text-white mb-6 tracking-tight drop-shadow-md leading-[1.15]"
          >
            Tare Pet <span className="text-primary italic font-light">School Gallery</span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg md:text-xl text-white/90 max-w-3xl mx-auto font-sans leading-relaxed font-normal mb-8"
          >
            Explore life at Tare Pet Montessori School — from interactive classroom discoveries and cultural festivals to scientific explorations and sports achievements.
          </motion.p>

          {/* Quick Stats Strip */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto pt-4 border-t border-white/15"
          >
            <div className="p-3 rounded-2xl glass-card text-center">
              <span className="block text-2xl md:text-3xl font-serif font-bold text-primary">500+</span>
              <span className="text-xs text-white/80 uppercase tracking-wider font-medium">Memories</span>
            </div>
            <div className="p-3 rounded-2xl glass-card text-center">
              <span className="block text-2xl md:text-3xl font-serif font-bold text-secondary-foreground">25+</span>
              <span className="text-xs text-white/80 uppercase tracking-wider font-medium">Annual Events</span>
            </div>
            <div className="p-3 rounded-2xl glass-card text-center">
              <span className="block text-2xl md:text-3xl font-serif font-bold text-primary">6</span>
              <span className="text-xs text-white/80 uppercase tracking-wider font-medium">Categories</span>
            </div>
            <div className="p-3 rounded-2xl glass-card text-center">
              <span className="block text-2xl md:text-3xl font-serif font-bold text-yellow-400">100%</span>
              <span className="text-xs text-white/80 uppercase tracking-wider font-medium">Student Joy</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Gallery Showcase & Filter Controls */}
      <section className="py-16 md:py-24 bg-background min-h-[60vh] relative">
        <div className="container mx-auto px-4 md:px-6">
          
          {/* Controls Bar: Category Pills + Search Bar */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-12">
            
            {/* Category Filter Pills */}
            <div className="flex flex-wrap items-center gap-2.5">
              {CATEGORIES.map((category) => (
                <button
                  key={category}
                  onClick={() => setActiveCategory(category)}
                  className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-300 flex items-center gap-1.5 ${
                    activeCategory === category
                      ? "bg-gradient-to-r from-primary to-primary/90 text-white shadow-lg shadow-primary/25 scale-105"
                      : "bg-white/80 border border-slate-200 text-foreground/80 hover:bg-white hover:border-primary/40 hover:text-primary"
                  }`}
                >
                  {category === "All" && <Grid className="w-3.5 h-3.5" />}
                  <span>{category}</span>
                </button>
              ))}
            </div>

            {/* Search Input Box */}
            <div className="relative w-full lg:w-72">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search gallery..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-full text-xs font-medium bg-white/90 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Results count & status indicator */}
          <div className="flex items-center justify-between mb-8 pb-3 border-b border-border/60">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Showing {filteredItems.length} {filteredItems.length === 1 ? "Item" : "Items"}
            </span>
            {activeCategory !== "All" && (
              <button
                onClick={() => {
                  setActiveCategory("All");
                  setSearchQuery("");
                }}
                className="text-xs font-semibold text-primary hover:underline"
              >
                Reset filters
              </button>
            )}
          </div>

          {/* Gallery Media Grid */}
          {filteredItems.length === 0 ? (
            <div className="text-center py-20 bg-slate-50/80 rounded-3xl border border-dashed border-slate-200">
              <Camera className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="font-serif font-bold text-xl text-slate-700 mb-2">No photos found</h3>
              <p className="text-slate-500 text-sm max-w-sm mx-auto mb-6">
                We couldn't find any gallery items matching "{searchQuery}". Try searching with a different keyword or category.
              </p>
              <button
                onClick={() => {
                  setActiveCategory("All");
                  setSearchQuery("");
                }}
                className="px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider bg-primary text-white hover:bg-primary/90 transition-colors shadow-md"
              >
                View All Photos
              </button>
            </div>
          ) : (
            <motion.div 
              layout
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8"
            >
              <AnimatePresence>
                {filteredItems.map((item, index) => {
                  const isLiked = likedItems[item.id];
                  const currentLikes = item.likes + (isLiked ? 1 : 0);

                  return (
                    <motion.div
                      layout
                      key={item.id}
                      initial={{ opacity: 0, scale: 0.9, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.4, delay: index * 0.05 }}
                      whileHover={{ y: -6 }}
                      onClick={() => setSelectedImageIndex(index)}
                      className="group cursor-pointer rounded-3xl bg-white border border-slate-100 shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden flex flex-col relative"
                    >
                      {/* Image Container */}
                      <div className="relative h-64 sm:h-72 overflow-hidden bg-slate-900">
                        <img
                          src={item.image}
                          alt={item.title}
                          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                        />
                        
                        {/* Gradient Overlay on Hover */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-90 transition-opacity duration-300" />

                        {/* Top Badges */}
                        <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-white bg-black/40 backdrop-blur-md px-3 py-1 rounded-full border border-white/20">
                            {item.category}
                          </span>

                          <button
                            onClick={(e) => toggleLike(item.id, e)}
                            className={`p-2 rounded-full backdrop-blur-md border transition-all ${
                              isLiked
                                ? "bg-red-500 text-white border-red-500 scale-110"
                                : "bg-black/40 text-white border-white/20 hover:bg-white/20"
                            }`}
                            aria-label="Like photo"
                          >
                            <Heart className={`w-3.5 h-3.5 ${isLiked ? "fill-white" : ""}`} />
                          </button>
                        </div>

                        {/* Media Type Icon indicator */}
                        {item.type === "video" && (
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="w-14 h-14 rounded-full bg-primary/90 text-white flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                              <Play className="w-6 h-6 ml-1 fill-white" />
                            </div>
                          </div>
                        )}

                        {/* Hover Action Prompt */}
                        <div className="absolute bottom-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <div className="p-2 rounded-full bg-white/90 text-slate-900 shadow-md">
                            <Maximize2 className="w-4 h-4" />
                          </div>
                        </div>

                        {/* Date Tag */}
                        <div className="absolute bottom-4 left-4 z-10 text-white/80 text-[11px] font-medium flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-primary" />
                          <span>{item.date}</span>
                        </div>
                      </div>

                      {/* Content Card Body */}
                      <div className="p-6 flex-1 flex flex-col justify-between">
                        <div>
                          <h3 className="font-serif font-bold text-lg text-slate-900 mb-2 leading-snug group-hover:text-primary transition-colors">
                            {item.title}
                          </h3>
                          <p className="text-slate-600 text-xs leading-relaxed line-clamp-2">
                            {item.description}
                          </p>
                        </div>

                        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
                          <span className="flex items-center gap-1 text-primary font-bold group-hover:translate-x-1 transition-transform">
                            View Image <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
                          </span>
                          <span className="flex items-center gap-1 text-slate-400">
                            <Heart className="w-3 h-3 text-red-400" /> {currentLikes}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </motion.div>
          )}

        </div>
      </section>

      {/* Lightbox Modal View */}
      <AnimatePresence>
        {selectedItem && selectedImageIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[150] flex items-center justify-center p-4 md:p-8 bg-black/90 backdrop-blur-xl"
            onClick={() => setSelectedImageIndex(null)}
          >
            {/* Close Button */}
            <button
              onClick={() => setSelectedImageIndex(null)}
              className="absolute top-6 right-6 z-20 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all border border-white/20"
              aria-label="Close modal"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Prev Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedImageIndex(selectedImageIndex > 0 ? selectedImageIndex - 1 : filteredItems.length - 1);
              }}
              className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all border border-white/20"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            {/* Next Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedImageIndex(selectedImageIndex < filteredItems.length - 1 ? selectedImageIndex + 1 : 0);
              }}
              className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all border border-white/20"
              aria-label="Next image"
            >
              <ChevronRight className="w-6 h-6" />
            </button>

            {/* Modal Card Content */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              onClick={(e) => e.stopPropagation()}
              className="max-w-5xl w-full max-h-[90vh] bg-slate-950 rounded-3xl overflow-hidden shadow-2xl border border-white/15 flex flex-col md:flex-row relative"
            >
              {/* Image Preview Area */}
              <div className="flex-1 bg-black flex items-center justify-center relative min-h-[300px] md:min-h-[500px]">
                <img
                  src={selectedItem.image}
                  alt={selectedItem.title}
                  className="w-full h-full max-h-[70vh] md:max-h-[85vh] object-contain"
                />
                {selectedItem.type === "video" && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                    <div className="w-20 h-20 rounded-full bg-primary text-white flex items-center justify-center shadow-2xl cursor-pointer hover:scale-110 transition-transform">
                      <Play className="w-8 h-8 ml-1 fill-white" />
                    </div>
                  </div>
                )}
              </div>

              {/* Sidebar Info Area */}
              <div className="w-full md:w-80 lg:w-96 p-6 md:p-8 bg-slate-900 text-white flex flex-col justify-between border-t md:border-t-0 md:border-l border-white/10">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-bold uppercase tracking-wider text-primary bg-primary/15 px-3 py-1 rounded-full border border-primary/30">
                      {selectedItem.category}
                    </span>
                    <span className="text-xs text-white/60 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" /> {selectedItem.date}
                    </span>
                  </div>

                  <h2 className="text-2xl font-serif font-bold text-white mb-4 leading-tight">
                    {selectedItem.title}
                  </h2>

                  <p className="text-white/80 text-sm leading-relaxed mb-6 font-sans">
                    {selectedItem.description}
                  </p>
                </div>

                <div className="pt-6 border-t border-white/10 flex items-center justify-between text-xs text-white/60">
                  <span>Photo {selectedImageIndex + 1} of {filteredItems.length}</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => toggleLike(selectedItem.id, e)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold transition-all ${
                        likedItems[selectedItem.id]
                          ? "bg-red-500/20 text-red-400 border-red-500/50"
                          : "bg-white/5 text-white/80 border-white/20 hover:bg-white/10"
                      }`}
                    >
                      <Heart className={`w-3.5 h-3.5 ${likedItems[selectedItem.id] ? "fill-red-400 text-red-400" : ""}`} />
                      <span>{selectedItem.likes + (likedItems[selectedItem.id] ? 1 : 0)}</span>
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Call To Action Banner */}
      <section className="py-20 bg-secondary text-white text-center relative overflow-hidden">
        <div className="container mx-auto px-4 md:px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl mx-auto"
          >
            <Sparkles className="w-8 h-8 text-yellow-400 mx-auto mb-4" />
            <h2 className="text-3xl md:text-4xl font-serif font-bold mb-4">
              Experience Tare Pet Montessori in Person
            </h2>
            <p className="text-white/90 text-lg mb-8 leading-relaxed font-sans">
              Photos only capture a fraction of the magic. We invite parents and guardians to visit our Yenagoa campus to see our classrooms in action.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link 
                href="/contact" 
                className="w-full sm:w-auto inline-flex items-center justify-center rounded-full text-base font-semibold bg-primary text-white hover:bg-primary/90 h-14 px-8 py-3 hover:scale-105 active:scale-95 transition-all shadow-lg"
              >
                Schedule a Campus Tour
              </Link>
              <Link 
                href="/admissions" 
                className="w-full sm:w-auto inline-flex items-center justify-center rounded-full text-base font-semibold glass-button text-white hover:bg-white/20 h-14 px-8 py-3 hover:scale-105 active:scale-95 transition-all border border-white/30"
              >
                Learn About Admissions
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </PageTransition>
  );
}
