import { PageTransition } from "@/components/layout/Layout";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, FileText, Calendar, GraduationCap, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

const inquirySchema = z.object({
  name: z.string().min(2, "Parent/Guardian name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().min(10, "Valid phone number is required"),
  childAge: z.string().min(1, "Please select an age range"),
  message: z.string().min(10, "Please tell us a bit about your inquiry"),
});

export default function Admissions() {
  const { toast } = useToast();

  const form = useForm<z.infer<typeof inquirySchema>>({
    resolver: zodResolver(inquirySchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      childAge: "",
      message: "",
    },
  });

  function onSubmit(values: z.infer<typeof inquirySchema>) {
    console.log(values);
    toast({
      title: "Inquiry Sent Successfully",
      description: "Thank you for your interest! Our admissions office will contact you shortly.",
    });
    form.reset();
  }

  return (
    <PageTransition>
      {/* Hero Header */}
      <section className="bg-gradient-to-br from-[#133e25] via-primary/95 to-[#0b2416] text-white pt-32 pb-24 md:pt-40 md:pb-32 relative overflow-hidden border-b border-white/10">
        {/* Background Image Layer */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=2000&auto=format&fit=crop"
            alt="Admissions & Learning"
            className="w-full h-full object-cover opacity-20 scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#133e25]/92 via-[#8b152b]/85 to-[#0b2416]/92 mix-blend-multiply" />
        </div>

        {/* Background Ambient Glow & Glass Shimmer */}
        <div className="absolute inset-0 glass-shimmer pointer-events-none opacity-20 z-0" />
        <div className="absolute top-10 right-10 w-96 h-96 bg-primary/25 rounded-full blur-3xl pointer-events-none animate-pulse" />
        <div className="absolute bottom-10 left-10 w-96 h-96 bg-secondary/35 rounded-full blur-3xl pointer-events-none animate-pulse" />

        <div className="container mx-auto px-4 md:px-6 relative z-10 max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-button text-white text-xs font-semibold uppercase tracking-wider mb-6 shadow-lg border border-white/20"
          >
            <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
            <span>Enrollment Open 2025 / 2026</span>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-5xl md:text-6xl font-serif font-bold text-white mb-6 tracking-tight drop-shadow-md leading-[1.15]"
          >
            Begin Your Child's Journey to <span className="text-primary italic font-light">Excellence</span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg md:text-xl text-white/90 max-w-3xl mx-auto font-sans leading-relaxed font-normal mb-10"
          >
            We welcome pupils and students dedicated to character development, curiosity, and academic leadership. Secure your child's place today.
          </motion.p>

          {/* Quick Highlight Badges */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-wrap items-center justify-center gap-3 md:gap-4 text-xs md:text-sm font-sans"
          >
            <span className="px-4 py-2 rounded-full glass-card bg-white/10 border border-white/20 text-white font-semibold shadow-sm">
              📝 Simple 3-Step Process
            </span>
            <span className="px-4 py-2 rounded-full glass-card bg-white/10 border border-white/20 text-white font-semibold shadow-sm">
              🎓 Entrance Assessment
            </span>
            <span className="px-4 py-2 rounded-full glass-card bg-white/10 border border-white/20 text-white font-semibold shadow-sm">
              🏫 Schedule Campus Visit
            </span>
          </motion.div>
        </div>
      </section>

      <section className="py-24 bg-background relative overflow-hidden">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-24">
            
            {/* Process Info (Left Col — Slide from Left) */}
            <motion.div 
              initial={{ opacity: 0, x: -70 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: false, margin: "-40px" }}
              transition={{ duration: 0.65 }}
              className="lg:col-span-7"
            >
              <h2 className="text-3xl font-serif font-bold text-foreground mb-8">Admission Process</h2>
              
              <div className="space-y-10">
                <div className="flex gap-6 p-6 rounded-2xl glass-card border border-white/80 shadow-sm hover:shadow-md transition-all">
                  <div className="w-12 h-12 rounded-2xl bg-primary/15 text-primary flex items-center justify-center shrink-0 shadow-sm border border-primary/20">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-foreground mb-2">1. Application Form</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      Obtain an admission form from the school office at Kpansia-Epje or fill out the online inquiry form below to initiate the process. A non-refundable application fee is required.
                    </p>
                  </div>
                </div>

                <div className="flex gap-6 p-6 rounded-2xl glass-card border border-white/80 shadow-sm hover:shadow-md transition-all">
                  <div className="w-12 h-12 rounded-2xl bg-primary/15 text-primary flex items-center justify-center shrink-0 shadow-sm border border-primary/20">
                    <Calendar className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-foreground mb-2">2. Assessment & Interview</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      Prospective pupils for Primary and Secondary levels will take an entrance assessment in Mathematics and English. Both parents and the child will be invited for an informal interactive session.
                    </p>
                  </div>
                </div>

                <div className="flex gap-6 p-6 rounded-2xl glass-card border border-white/80 shadow-sm hover:shadow-md transition-all">
                  <div className="w-12 h-12 rounded-2xl bg-primary/15 text-primary flex items-center justify-center shrink-0 shadow-sm border border-primary/20">
                    <GraduationCap className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-foreground mb-2">3. Offer & Acceptance</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      Successful candidates will receive a formal letter of admission. Parents are required to accept the offer by paying the acceptance fee and submitting all required documentation within the stipulated timeframe.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-16 glass-card p-8 rounded-3xl border border-white/80 shadow-lg">
                <h3 className="text-2xl font-serif font-bold text-foreground mb-6">Required Documents</h3>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    "Completed Application Form",
                    "2 Recent Passport Photographs",
                    "Birth Certificate / Declaration of Age",
                    "Immunization Record",
                    "Last Academic Report (if applicable)",
                    "Transfer Certificate (for mid-stream entries)"
                  ].map((doc, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-secondary shrink-0" />
                      <span className="text-sm font-medium text-foreground">{doc}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>

            {/* Inquiry Form (Right Col — Slide from Right) */}
            <motion.div 
              initial={{ opacity: 0, x: 70 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: false, margin: "-40px" }}
              transition={{ duration: 0.65, delay: 0.15 }}
              className="lg:col-span-5"
            >
              <div className="glass-card p-8 rounded-3xl shadow-2xl border border-white/80 sticky top-32">
                <h3 className="text-2xl font-serif font-bold text-foreground mb-2">Make an Inquiry</h3>
                <p className="text-muted-foreground text-sm mb-8 leading-relaxed">
                  Fill out this form and our admissions team will get back to you with next steps.
                </p>

                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-semibold text-foreground">Parent / Guardian Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Mrs. Jane Doe" {...field} className="bg-white/80 border-white/80 rounded-xl focus:ring-primary h-11" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="font-semibold text-foreground">Email Address</FormLabel>
                            <FormControl>
                              <Input placeholder="jane@example.com" {...field} className="bg-white/80 border-white/80 rounded-xl focus:ring-primary h-11" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="font-semibold text-foreground">Phone Number</FormLabel>
                            <FormControl>
                              <Input placeholder="0800 000 0000" {...field} className="bg-white/80 border-white/80 rounded-xl focus:ring-primary h-11" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="childAge"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-semibold text-foreground">Child's Age Range</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="bg-white/80 border-white/80 rounded-xl h-11">
                                <SelectValue placeholder="Select an age range" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="nursery">Nursery School (Ages 2 - 5)</SelectItem>
                              <SelectItem value="primary">Primary School (Ages 6 - 11)</SelectItem>
                              <SelectItem value="junior-secondary">Junior Secondary School</SelectItem>
                              <SelectItem value="senior-secondary">Senior Secondary School</SelectItem>
                              <SelectItem value="boarding">Boarding School Residence</SelectItem>
                              <SelectItem value="special-school">Special Needs & Inclusive School</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="message"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-semibold text-foreground">Message / Questions</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Tell us what you'd like to know..." 
                              className="min-h-[120px] bg-white/80 border-white/80 rounded-xl resize-none"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button type="submit" className="w-full h-12 rounded-full font-bold uppercase tracking-wider text-white bg-gradient-to-r from-primary to-primary/90 shadow-xl hover:scale-105 active:scale-95 transition-all" data-testid="button-submit-inquiry">
                      Submit Inquiry
                    </Button>
                  </form>
                </Form>
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* Virtual Tour CTA */}
      <section className="py-20 bg-secondary text-white text-center relative overflow-hidden">
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: false }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl font-serif font-bold mb-6">Experience Tare Pet</h2>
            <p className="text-white/80 max-w-2xl mx-auto mb-10 text-lg">
              Can't make it to Kpansia-Epje right now? Take a glimpse into our classrooms, laboratories, and play areas.
            </p>
            <Button variant="outline" className="h-14 px-8 rounded-full text-base bg-transparent text-white border-white hover:bg-white hover:text-secondary font-bold hover:scale-105 active:scale-95 transition-all">
              Take Virtual Tour
            </Button>
          </motion.div>
        </div>
      </section>
    </PageTransition>
  );
}
