import { Link } from "wouter";
import tarepetLogo from "@assets/tarepet__1784835204178.png";
import { Facebook, Instagram, Twitter, Mail, Phone, MapPin } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-secondary text-secondary-foreground">
      <div className="container mx-auto px-4 md:px-6 pt-16 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          
          {/* Brand Col */}
          <div className="flex flex-col gap-6">
            <Link href="/" className="flex items-center gap-3 group bg-white/10 p-3 rounded-lg w-fit">
              <img 
                src={tarepetLogo} 
                alt="Tarepet Montessori School Logo" 
                className="w-10 h-10 object-contain"
              />
              <div className="flex flex-col">
                <span className="font-serif font-bold text-xl text-white leading-none tracking-tight">
                  Tare Pet
                </span>
                <span className="font-sans text-[10px] uppercase tracking-[0.15em] text-white/90 font-medium mt-1">
                  montessori school
                </span>
              </div>
            </Link>
            <p className="text-secondary-foreground/80 text-sm leading-relaxed max-w-xs">
              A premium Montessori institution dedicated to nurturing young minds, fostering independence, and inspiring a lifelong love for learning.
            </p>
            <div className="font-serif italic text-lg text-primary-foreground">
              "Not to Knowledge is Power"
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-serif font-semibold text-lg mb-6 text-white">Quick Links</h3>
            <ul className="flex flex-col gap-3">
              <li>
                <Link href="/about" className="text-secondary-foreground/80 hover:text-white transition-colors text-sm">About Us</Link>
              </li>
              <li>
                <Link href="/programs" className="text-secondary-foreground/80 hover:text-white transition-colors text-sm">Our Programs</Link>
              </li>
              <li>
                <Link href="/admissions" className="text-secondary-foreground/80 hover:text-white transition-colors text-sm">Admissions</Link>
              </li>
              <li>
                <Link href="/blog" className="text-secondary-foreground/80 hover:text-white transition-colors text-sm">News & Blog</Link>
              </li>
              <li>
                <Link href="/contact" className="text-secondary-foreground/80 hover:text-white transition-colors text-sm">Contact Us</Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="font-serif font-semibold text-lg mb-6 text-white">Contact Info</h3>
            <ul className="flex flex-col gap-4">
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <span className="text-secondary-foreground/80 text-sm leading-relaxed">
                  Murpiry L. & Sec. Sch.<br />
                  Kpansia-Epje, Yenagoa<br />
                  Bayelsa State, Nigeria
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-primary shrink-0" />
                <span className="text-secondary-foreground/80 text-sm">
                  +234 (0) 800 000 0000
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-primary shrink-0" />
                <span className="text-secondary-foreground/80 text-sm">
                  info@tarepetmontessori.com
                </span>
              </li>
            </ul>
          </div>

          {/* Connect */}
          <div>
            <h3 className="font-serif font-semibold text-lg mb-6 text-white">Connect With Us</h3>
            <p className="text-secondary-foreground/80 text-sm mb-4">
              Follow us on social media for updates, events, and a glimpse into our vibrant learning community.
            </p>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-primary transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-primary transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-primary transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
            </div>
          </div>

        </div>

        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-secondary-foreground/60">
            &copy; {new Date().getFullYear()} Tare Pet Montessori School. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm text-secondary-foreground/60">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
