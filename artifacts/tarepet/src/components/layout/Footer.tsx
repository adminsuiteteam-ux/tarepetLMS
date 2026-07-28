import { Link } from "wouter";
import tarepetLogo from "@assets/tarepet__1784835204178.png";
import { Facebook, Instagram, Twitter, Mail, Phone, MapPin } from "lucide-react";
import { FooterBackgroundGradient, TextHoverEffect } from "@/components/ui/hover-footer";

export function Footer() {
  const quickLinks = [
    { label: "About Us", href: "/about" },
    { label: "Our Programs", href: "/programs" },
    { label: "Admissions", href: "/admissions" },
    { label: "Journal & News", href: "/journal" },
    { label: "School Events", href: "/events" },
    { label: "Contact Us", href: "/contact" },
  ];

  const contactInfo = [
    {
      icon: <MapPin size={18} className="text-primary shrink-0" />,
      text: "Murpiry L. & Sec. Sch., Kpansia-Epje, Yenagoa, Bayelsa State",
      href: null,
    },
    {
      icon: <Phone size={18} className="text-primary shrink-0" />,
      text: "+234 (0) 800 000 0000",
      href: "tel:+2348000000000",
    },
    {
      icon: <Mail size={18} className="text-primary shrink-0" />,
      text: "info@tarepetmontessori.com",
      href: "mailto:info@tarepetmontessori.com",
    },
  ];

  const socialLinks = [
    { icon: <Facebook size={18} />, label: "Facebook", href: "#" },
    { icon: <Instagram size={18} />, label: "Instagram", href: "#" },
    { icon: <Twitter size={18} />, label: "Twitter", href: "#" },
  ];

  return (
    <footer className="bg-secondary text-secondary-foreground relative h-fit overflow-hidden border-t border-white/10 mt-12">
      <div className="max-w-7xl mx-auto px-6 pt-16 pb-12 z-10 relative">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-16 pb-12">
          
          {/* Brand section */}
          <div className="flex flex-col space-y-4">
            <Link href="/" className="flex items-center gap-3 group bg-white/10 p-3 rounded-2xl w-fit border border-white/10 shadow-sm">
              <img 
                src={tarepetLogo} 
                alt="Tare Pet Montessori School Logo" 
                className="w-10 h-10 object-contain group-hover:scale-105 transition-transform"
              />
              <div className="flex flex-col">
                <span className="font-serif font-bold text-xl text-white leading-none tracking-tight">
                  Tare Pet
                </span>
                <span className="font-sans text-[10px] uppercase tracking-[0.15em] text-white/80 font-semibold mt-1">
                  montessori school
                </span>
              </div>
            </Link>
            <p className="text-secondary-foreground/80 text-sm leading-relaxed">
              A premium Montessori institution dedicated to nurturing young minds, fostering independence, and inspiring a lifelong love for learning in Yenagoa.
            </p>
            <p className="font-serif italic text-base text-white/90">
              "Not to Knowledge is Power"
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white text-lg font-serif font-bold mb-6">Quick Links</h4>
            <ul className="space-y-3 text-sm">
              {quickLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-secondary-foreground/80 hover:text-white hover:translate-x-1 transition-all inline-block"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact section */}
          <div>
            <h4 className="text-white text-lg font-serif font-bold mb-6">Contact Info</h4>
            <ul className="space-y-4 text-sm">
              {contactInfo.map((item, i) => (
                <li key={i} className="flex items-start space-x-3 text-secondary-foreground/80">
                  <span className="mt-0.5">{item.icon}</span>
                  {item.href ? (
                    <a href={item.href} className="hover:text-white transition-colors leading-relaxed">
                      {item.text}
                    </a>
                  ) : (
                    <span className="leading-relaxed">{item.text}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Connect section */}
          <div>
            <h4 className="text-white text-lg font-serif font-bold mb-6">Connect With Us</h4>
            <p className="text-secondary-foreground/80 text-sm mb-6 leading-relaxed">
              Follow us on social media for updates, events, and a glimpse into our vibrant learning community.
            </p>
            <div className="flex space-x-4">
              {socialLinks.map(({ icon, label, href }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-primary transition-all duration-300 hover:scale-110"
                >
                  {icon}
                </a>
              ))}
            </div>
          </div>

        </div>

        <hr className="border-t border-white/10 my-8" />

        {/* Footer bottom copyright */}
        <div className="flex flex-col md:flex-row justify-between items-center text-sm text-secondary-foreground/60 space-y-4 md:space-y-0">
          <p className="text-center md:text-left">
            &copy; {new Date().getFullYear()} Tare Pet Montessori School. All rights reserved.
          </p>
          <div className="flex space-x-6 text-sm">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>

      {/* Large Interactive Text Hover Effect */}
      <div className="lg:flex hidden h-[26rem] -mt-44 -mb-28 justify-center items-center pointer-events-auto">
        <TextHoverEffect text="TARE PET" className="z-20" />
      </div>

      <FooterBackgroundGradient />
    </footer>
  );
}
