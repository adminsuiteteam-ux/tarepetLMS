"use client"

import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const SQRT_5000 = Math.sqrt(5000);

export const testimonials = [
  {
    tempId: 0,
    testimonial: "The transformation in my daughter's confidence since joining Tare Pet Montessori is remarkable. She doesn't just memorize; she truly understands every concept.",
    by: "Mrs. Oweikeme Kpandia, Primary Parent",
    imgSrc: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=300&auto=format&fit=crop"
  },
  {
    tempId: 1,
    testimonial: "Finding a genuine Montessori environment in Yenagoa was a blessing. The teachers at Tare Pet are incredibly dedicated and the hands-on materials make learning fun.",
    by: "Mr. Tariye Amadi, Nursery Parent",
    imgSrc: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=300&auto=format&fit=crop"
  },
  {
    tempId: 2,
    testimonial: "My son transitioned to the Senior Secondary section flawlessly. The leadership training, WAEC prep, and moral values taught here are second to none.",
    by: "Dr. Ebiere Alagoa, Secondary Parent",
    imgSrc: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=300&auto=format&fit=crop"
  },
  {
    tempId: 3,
    testimonial: "The residential boarding facilities at Kpansia-Epje are top-notch. With 24/7 care, structured evening prep, and tight security, I sleep with complete peace of mind.",
    by: "Mrs. Preye Ogbonna, Boarding Parent",
    imgSrc: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=300&auto=format&fit=crop"
  },
  {
    tempId: 4,
    testimonial: "Tare Pet Montessori isn't just a school—it's a warm, nurturing family. My twins look forward to going to school in Kpansia every single morning!",
    by: "Engr. Tarila Ebimobowei, JSS Parent",
    imgSrc: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?q=80&w=300&auto=format&fit=crop"
  },
  {
    tempId: 5,
    testimonial: "Their dedicated special needs unit provided individualized attention that transformed my child's speech and socialization skills. God bless Tare Pet School!",
    by: "Mrs. Bodisere Okoro, Special Needs Unit Parent",
    imgSrc: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=300&auto=format&fit=crop"
  },
  {
    tempId: 6,
    testimonial: "Their WAEC, NECO, and JAMB preparation is exceptional. My eldest son passed all subjects with distinction and gained admission into his first-choice university.",
    by: "Chief Douye Timipre, Alumni Parent",
    imgSrc: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?q=80&w=300&auto=format&fit=crop"
  },
  {
    tempId: 7,
    testimonial: "The cosmic education approach connects science, math, and character. My kids excel academically while staying rooted in sound moral discipline.",
    by: "Pastor Ayebatonye Adebayo, Primary Parent",
    imgSrc: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=300&auto=format&fit=crop"
  },
  {
    tempId: 8,
    testimonial: "As a working mother, seeing the daily progress photos and teacher feedback on the Tare Pet Portal gives me immense joy. Highly recommended!",
    by: "Barr. (Mrs.) Yemi Igoni, Nursery Parent",
    imgSrc: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?q=80&w=300&auto=format&fit=crop"
  },
  {
    tempId: 9,
    testimonial: "The Practical Life and Erdkinder programs teach our young teenagers real-world responsibility, teamwork, and financial literacy. Truly outstanding!",
    by: "Mr. Kemebradikumo Danjuma, JSS Parent",
    imgSrc: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=300&auto=format&fit=crop"
  }
];

interface TestimonialCardProps {
  position: number;
  testimonial: typeof testimonials[0];
  handleMove: (steps: number) => void;
  cardSize: number;
}

const TestimonialCard: React.FC<TestimonialCardProps> = ({ 
  position, 
  testimonial, 
  handleMove, 
  cardSize 
}) => {
  const isCenter = position === 0;

  return (
    <div
      onClick={() => handleMove(position)}
      className={cn(
        "absolute left-1/2 top-1/2 cursor-pointer border-2 p-8 transition-all duration-500 ease-in-out select-none",
        isCenter 
          ? "z-10 bg-primary text-primary-foreground border-primary shadow-2xl scale-105" 
          : "z-0 bg-card text-card-foreground border-border hover:border-primary/50 opacity-90 hover:opacity-100"
      )}
      style={{
        width: cardSize,
        height: cardSize,
        clipPath: `polygon(40px 0%, calc(100% - 40px) 0%, 100% 40px, 100% 100%, calc(100% - 40px) 100%, 40px 100%, 0 100%, 0 0)`,
        transform: `
          translate(-50%, -50%) 
          translateX(${(cardSize / 1.4) * position}px)
          translateY(${isCenter ? -30 : position % 2 ? 15 : -15}px)
          rotate(${isCenter ? 0 : position % 2 ? 2.5 : -2.5}deg)
        `,
        boxShadow: isCenter ? "0px 12px 28px -4px rgba(0, 0, 0, 0.25)" : "0px 0px 0px 0px transparent"
      }}
    >
      <span
        className="absolute block origin-top-right rotate-45 bg-border"
        style={{
          right: -2,
          top: 38,
          width: SQRT_5000,
          height: 2
        }}
      />
      <img
        src={testimonial.imgSrc}
        alt={`${testimonial.by.split(',')[0]}`}
        className="mb-4 h-14 w-14 rounded-full border-2 border-white/80 object-cover object-top shadow-md"
      />
      <h3 className={cn(
        "text-base sm:text-lg font-serif font-semibold leading-snug line-clamp-4",
        isCenter ? "text-primary-foreground" : "text-foreground"
      )}>
        "{testimonial.testimonial}"
      </h3>
      <p className={cn(
        "absolute bottom-6 left-8 right-8 mt-2 text-xs sm:text-sm font-sans font-bold tracking-wide",
        isCenter ? "text-primary-foreground/90" : "text-secondary font-semibold"
      )}>
        — {testimonial.by}
      </p>
    </div>
  );
};

export const StaggerTestimonials: React.FC = () => {
  const [cardSize, setCardSize] = useState(360);
  const [testimonialsList, setTestimonialsList] = useState(testimonials);

  const handleMove = (steps: number) => {
    const newList = [...testimonialsList];
    if (steps > 0) {
      for (let i = steps; i > 0; i--) {
        const item = newList.shift();
        if (!item) return;
        newList.push({ ...item, tempId: Math.random() });
      }
    } else {
      for (let i = steps; i < 0; i++) {
        const item = newList.pop();
        if (!item) return;
        newList.unshift({ ...item, tempId: Math.random() });
      }
    }
    setTestimonialsList(newList);
  };

  useEffect(() => {
    const updateSize = () => {
      const { matches } = window.matchMedia("(min-width: 640px)");
      setCardSize(matches ? 360 : 290);
    };

    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  return (
    <div
      className="relative w-full overflow-hidden bg-transparent py-10"
      style={{ height: 520 }}
    >
      {testimonialsList.map((testimonial, index) => {
        const position = testimonialsList.length % 2
          ? index - Math.floor(testimonialsList.length / 2)
          : index - testimonialsList.length / 2;
        return (
          <TestimonialCard
            key={testimonial.tempId}
            testimonial={testimonial}
            handleMove={handleMove}
            position={position}
            cardSize={cardSize}
          />
        );
      })}
      <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-3 z-20">
        <button
          onClick={() => handleMove(-1)}
          className={cn(
            "flex h-12 w-12 items-center justify-center text-xl transition-all duration-300 rounded-full shadow-md",
            "bg-white border-2 border-primary/30 text-primary hover:bg-primary hover:text-white active:scale-95",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          )}
          aria-label="Previous testimonial"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <button
          onClick={() => handleMove(1)}
          className={cn(
            "flex h-12 w-12 items-center justify-center text-xl transition-all duration-300 rounded-full shadow-md",
            "bg-white border-2 border-primary/30 text-primary hover:bg-primary hover:text-white active:scale-95",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          )}
          aria-label="Next testimonial"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};
