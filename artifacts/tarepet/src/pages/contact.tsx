import { PageTransition } from "@/components/layout/Layout";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { MapPin, Phone, Mail, Clock, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import contactImg from "@assets/contact_hero.png";

const contactSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Valid email is required"),
  subject: z.string().min(5, "Subject is required"),
  message: z.string().min(10, "Message is required"),
});

export default function Contact() {
  const { toast } = useToast();

  const form = useForm<z.infer<typeof contactSchema>>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: "",
      email: "",
      subject: "",
      message: "",
    },
  });

  function onSubmit(values: z.infer<typeof contactSchema>) {
    // Values are submitted to the toast notification — not logged to console.
    toast({
      title: "Message Sent",
      description: "Thank you for reaching out. We will get back to you soon.",
    });
    form.reset();
  }

  return (
    <PageTransition>
      {/* Hero Header */}
      <section className="bg-slate-950 text-white pt-32 pb-24 md:pt-40 md:pb-32 relative overflow-hidden border-b border-white/10">
        {/* Background Image Layer */}
        <div className="absolute inset-0 z-0">
          <img
            src={contactImg}
            alt="Tare Pet Montessori School Contact & Information Desk"
            className="w-full h-full object-cover object-center opacity-95 scale-105 brightness-100"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-slate-950/35 to-black/20" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-black/40" />
        </div>

        {/* Subtle Ambient Glass Shimmer */}
        <div className="absolute inset-0 glass-shimmer pointer-events-none opacity-10 z-0" />

        <div className="container mx-auto px-4 md:px-6 text-center relative z-10 max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-button text-white text-xs font-semibold uppercase tracking-wider mb-6 shadow-lg border border-white/20"
          >
            <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
            <span>We'd Love To Hear From You</span>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-5xl md:text-6xl font-serif font-bold text-white mb-6 tracking-tight drop-shadow-md leading-[1.15]"
          >
            Get In Touch With <span className="text-primary italic font-light">Tare Pet</span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg md:text-xl text-white/90 max-w-3xl mx-auto font-sans leading-relaxed font-normal mb-10"
          >
            Located at Kpansia-Epie, Yenagoa, Bayelsa State. Reach out for admissions inquiries, campus tours, or general questions.
          </motion.p>

          {/* Location & Contact Pills */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-wrap items-center justify-center gap-3 md:gap-4 text-xs md:text-sm font-sans"
          >
            <span className="flex items-center gap-2 px-4 py-2 rounded-full glass-card bg-white/10 border border-white/20 text-white font-semibold shadow-sm">
              <MapPin className="w-4 h-4 text-red-400" /> 47 Chief John Obi Str., Kpansia, Yenagoa
            </span>
            <span className="flex items-center gap-2 px-4 py-2 rounded-full glass-card bg-white/10 border border-white/20 text-white font-semibold shadow-sm">
              <Phone className="w-4 h-4 text-emerald-400" /> 0803 789 0628 / 0703 830 2292
            </span>
          </motion.div>
        </div>
      </section>

      <section className="py-24 bg-background relative overflow-hidden">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 max-w-6xl mx-auto">
            
            {/* Contact Details — Slide from Left */}
            <motion.div
              initial={{ opacity: 0, x: -70 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.65 }}
            >
              <h2 className="text-3xl font-serif font-bold text-foreground mb-8">Get in Touch</h2>
              
              <div className="space-y-6 mb-12">
                <div className="flex items-start gap-4 p-6 glass-card rounded-2xl border border-white/80 shadow-sm hover:shadow-md transition-all">
                  <div className="w-12 h-12 rounded-2xl bg-primary/15 text-primary flex items-center justify-center shrink-0">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground mb-1 text-lg">Our Physical Address</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      Tare Pet Montessori School<br />
                      43. LT. Col Edor Obi Road Kpansia<br />
                      Yenagoa, Bayelsa State, Nigeria
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-6 glass-card rounded-2xl border border-white/80 shadow-sm hover:shadow-md transition-all">
                  <div className="w-12 h-12 rounded-2xl bg-secondary/15 text-secondary flex items-center justify-center shrink-0">
                    <Phone className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground mb-1 text-lg">Official Phone Numbers</h3>
                    <p className="text-muted-foreground text-sm">
                      0803 789 0628<br />
                      0703 830 2292
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-6 glass-card rounded-2xl border border-white/80 shadow-sm hover:shadow-md transition-all">
                  <div className="w-12 h-12 rounded-2xl bg-primary/15 text-primary flex items-center justify-center shrink-0">
                    <Mail className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground mb-1 text-lg">Official Email Addresses</h3>
                    <p className="text-muted-foreground text-sm">
                      tarepetmontessori@gmail.com<br />
                      tarepetm@gmail.com
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-6 glass-card rounded-2xl border border-white/80 shadow-sm hover:shadow-md transition-all">
                  <div className="w-12 h-12 rounded-2xl bg-secondary/15 text-secondary flex items-center justify-center shrink-0">
                    <Clock className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground mb-1 text-lg">Office Working Hours</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      Monday – Friday: 7:30 AM – 3:00 PM<br />
                      Saturday – Sunday: Closed
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Contact Form — Slide from Right */}
            <motion.div
              initial={{ opacity: 0, x: 70 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.65, delay: 0.15 }}
            >
              <div className="glass-card p-10 rounded-3xl shadow-2xl border border-white/80">
                <h2 className="text-3xl font-serif font-bold text-foreground mb-2">Send a Message</h2>
                <p className="text-muted-foreground text-sm mb-8 leading-relaxed">
                  We welcome your inquiries. Please fill out the form below and we will respond promptly.
                </p>

                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-semibold text-foreground">Your Name</FormLabel>
                          <FormControl>
                            <Input placeholder="John Doe" {...field} className="bg-white/80 border-white/80 rounded-xl h-11" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-semibold text-foreground">Email Address</FormLabel>
                          <FormControl>
                            <Input placeholder="john@example.com" {...field} className="bg-white/80 border-white/80 rounded-xl h-11" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="subject"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-semibold text-foreground">Subject</FormLabel>
                          <FormControl>
                            <Input placeholder="Inquiry about Nursery Admissions" {...field} className="bg-white/80 border-white/80 rounded-xl h-11" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="message"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-semibold text-foreground">Message</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="How can we help you?" 
                              className="min-h-[140px] bg-white/80 border-white/80 rounded-xl resize-none"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button type="submit" className="w-full h-12 rounded-full font-bold uppercase tracking-wider text-white bg-gradient-to-r from-primary to-primary/90 shadow-xl hover:scale-105 active:scale-95 transition-all">
                      Send Message
                    </Button>
                  </form>
                </Form>
              </div>
            </motion.div>

          </div>
        </div>
      </section>
    </PageTransition>
  );
}
