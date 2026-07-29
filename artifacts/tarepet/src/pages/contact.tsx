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
    console.log(values);
    toast({
      title: "Message Sent",
      description: "Thank you for reaching out. We will get back to you soon.",
    });
    form.reset();
  }

  return (
    <PageTransition>
      {/* Hero Header */}
      <section className="bg-gradient-to-br from-[#123922] via-[#0f2e1d] to-[#091f13] text-white pt-32 pb-24 md:pt-40 md:pb-32 relative overflow-hidden border-b border-white/10">
        {/* Background Image Layer */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1577896851231-70ef18881754?q=80&w=2000&auto=format&fit=crop"
            alt="Tare Pet School Reception & Campus"
            className="w-full h-full object-cover opacity-20 scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#123922]/92 via-[#0f2e1d]/88 to-[#091f13]/92 mix-blend-multiply" />
        </div>

        {/* Background Ambient Glow & Glass Shimmer */}
        <div className="absolute inset-0 glass-shimmer pointer-events-none opacity-20 z-0" />
        <div className="absolute top-10 right-10 w-96 h-96 bg-primary/25 rounded-full blur-3xl pointer-events-none animate-pulse" />
        <div className="absolute bottom-10 left-10 w-96 h-96 bg-secondary/35 rounded-full blur-3xl pointer-events-none animate-pulse" />

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
            Located at Kpansia-Epje, Yenagoa, Bayelsa State. Reach out for admissions inquiries, campus tours, or general questions.
          </motion.p>

          {/* Location & Contact Pills */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-wrap items-center justify-center gap-3 md:gap-4 text-xs md:text-sm font-sans"
          >
            <span className="px-4 py-2 rounded-full glass-card bg-white/10 border border-white/20 text-white font-semibold shadow-sm">
              📍 Murpiry L. & Sec. Sch., Kpansia-Epje, Yenagoa
            </span>
            <span className="px-4 py-2 rounded-full glass-card bg-white/10 border border-white/20 text-white font-semibold shadow-sm">
              📞 +234 (0) 800 000 0000
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
              viewport={{ once: false, margin: "-40px" }}
              transition={{ duration: 0.65 }}
            >
              <h2 className="text-3xl font-serif font-bold text-foreground mb-8">Get in Touch</h2>
              
              <div className="space-y-6 mb-12">
                <div className="flex items-start gap-4 p-6 glass-card rounded-2xl border border-white/80 shadow-sm hover:shadow-md transition-all">
                  <div className="w-12 h-12 rounded-2xl bg-primary/15 text-primary flex items-center justify-center shrink-0">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground mb-1 text-lg">Our Location</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      Tare Pet Montessori School<br />
                      Murpiry L. & Sec. Sch., Kpansia-Epje<br />
                      Yenagoa, Bayelsa State, Nigeria
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-6 glass-card rounded-2xl border border-white/80 shadow-sm hover:shadow-md transition-all">
                  <div className="w-12 h-12 rounded-2xl bg-secondary/15 text-secondary flex items-center justify-center shrink-0">
                    <Phone className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground mb-1 text-lg">Phone Number</h3>
                    <p className="text-muted-foreground text-sm">
                      +234 (0) 800 000 0000<br />
                      +234 (0) 800 111 2222
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-6 glass-card rounded-2xl border border-white/80 shadow-sm hover:shadow-md transition-all">
                  <div className="w-12 h-12 rounded-2xl bg-primary/15 text-primary flex items-center justify-center shrink-0">
                    <Mail className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground mb-1 text-lg">Email Address</h3>
                    <p className="text-muted-foreground text-sm">
                      info@tarepetmontessori.com<br />
                      admissions@tarepetmontessori.com
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-6 glass-card rounded-2xl border border-white/80 shadow-sm hover:shadow-md transition-all">
                  <div className="w-12 h-12 rounded-2xl bg-secondary/15 text-secondary flex items-center justify-center shrink-0">
                    <Clock className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground mb-1 text-lg">School Hours</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      Monday – Friday: 7:30 AM – 3:30 PM<br />
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
              viewport={{ once: false, margin: "-40px" }}
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
