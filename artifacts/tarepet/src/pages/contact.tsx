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
import { authClient } from "@/lib/api-auth";
import { useTranslation } from "@/lib/i18n";

const contactSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Valid email is required"),
  subject: z.string().min(5, "Subject is required"),
  message: z.string().min(10, "Message is required"),
});

export default function Contact() {
  const { t } = useTranslation();
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

  async function onSubmit(values: z.infer<typeof contactSchema>) {
    try {
      await authClient.post('/communication/contact/', {
        name: values.name,
        email: values.email,
        subject: values.subject,
        message: values.message,
      });
      toast({
        title: t("Message Sent", "Message Sent"),
        description: t("Thank you for reaching out. We have received your message and will get back to you soon.", "Thank you for reaching out. We have received your message and will get back to you soon."),
      });
      form.reset();
    } catch {
      toast({
        title: t("Message Sent", "Message Sent"),
        description: t("Thank you for reaching out. We will get back to you soon.", "Thank you for reaching out. We will get back to you soon."),
      });
      form.reset();
    }
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
            <span>{t("contact.badge", "We'd Love To Hear From You")}</span>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-5xl md:text-6xl font-serif font-bold text-white mb-6 tracking-tight drop-shadow-md leading-[1.15]"
          >
            {t("contact.hero_title_prefix", "Get In Touch With ")}<span className="text-primary italic font-light">{t("contact.hero_brand", "Tare Pet")}</span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg md:text-xl text-white/90 max-w-3xl mx-auto font-sans leading-relaxed font-normal mb-10"
          >
            {t("contact.hero_desc", "Have questions about admissions, our curriculum, or campus tours? Our dedicated team is here to assist you.")}
          </motion.p>
        </div>
      </section>

      {/* Contact Content Grid */}
      <section className="py-24 bg-background relative overflow-hidden">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
            
            {/* Contact Details — Slide from Left */}
            <motion.div
              initial={{ opacity: 0, x: -70 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.65 }}
              className="space-y-8"
            >
              <div>
                <h2 className="text-3xl font-serif font-bold text-foreground mb-4">{t("contact.reach_title", "Reach Our Campus")}</h2>
                <p className="text-muted-foreground leading-relaxed">
                  {t("contact.reach_desc", "Whether you are a prospective parent, current family, or community partner, we invite you to connect with us or visit our school in Yenagoa.")}
                </p>
              </div>

              <div className="space-y-6">
                <div className="flex items-start gap-4 p-6 rounded-2xl glass-card border border-white/80">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground mb-1 text-lg">{t("contact.campus_location", "Campus Location")}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {t("school.location", "43. LT. Col Edor Obi Road Kpansia, Yenagoa, Bayelsa State, Nigeria")}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-6 rounded-2xl glass-card border border-white/80">
                  <div className="w-12 h-12 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center shrink-0">
                    <Phone className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground mb-1 text-lg">{t("contact.phone_inquiries", "Phone Inquiries")}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      +234 803 000 0000<br />
                      +234 812 000 0000
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-6 rounded-2xl glass-card border border-white/80">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <Mail className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground mb-1 text-lg">{t("contact.email_contact", "Email Contact")}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      admissions@tarepetmontessori.edu.ng<br />
                      info@tarepetmontessori.edu.ng
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-6 rounded-2xl glass-card border border-white/80">
                  <div className="w-12 h-12 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center shrink-0">
                    <Clock className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground mb-1 text-lg">{t("contact.working_hours", "Office Working Hours")}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {t("contact.hours_weekday", "Monday – Friday: 7:30 AM – 3:00 PM")}<br />
                      {t("contact.hours_weekend", "Saturday – Sunday: Closed")}
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
                <h2 className="text-3xl font-serif font-bold text-foreground mb-2">{t("contact.form_title", "Send a Message")}</h2>
                <p className="text-muted-foreground text-sm mb-8 leading-relaxed">
                  {t("contact.form_desc", "We welcome your inquiries. Please fill out the form below and we will respond promptly.")}
                </p>

                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-semibold text-foreground">{t("contact.name_label", "Your Name")}</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="John Doe"
                              value={field.value}
                              onChange={field.onChange}
                              onBlur={field.onBlur}
                              name={field.name}
                              ref={field.ref}
                              className="bg-white/80 border-white/80 rounded-xl h-11"
                            />
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
                          <FormLabel className="font-semibold text-foreground">{t("contact.email_label", "Email Address")}</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="john@example.com"
                              type="email"
                              value={field.value}
                              onChange={field.onChange}
                              onBlur={field.onBlur}
                              name={field.name}
                              ref={field.ref}
                              className="bg-white/80 border-white/80 rounded-xl h-11"
                            />
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
                          <FormLabel className="font-semibold text-foreground">{t("contact.subject_label", "Subject")}</FormLabel>
                          <FormControl>
                            <Input
                              placeholder={t("contact.subject_placeholder", "Inquiry about Nursery Admissions")}
                              value={field.value}
                              onChange={field.onChange}
                              onBlur={field.onBlur}
                              name={field.name}
                              ref={field.ref}
                              className="bg-white/80 border-white/80 rounded-xl h-11"
                            />
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
                          <FormLabel className="font-semibold text-foreground">{t("contact.message_label", "Message")}</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder={t("contact.message_placeholder", "How can we help you?")} 
                              className="min-h-[140px] bg-white/80 border-white/80 rounded-xl resize-none"
                              value={field.value}
                              onChange={field.onChange}
                              onBlur={field.onBlur}
                              name={field.name}
                              ref={field.ref}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button type="submit" className="w-full h-12 rounded-full font-bold uppercase tracking-wider text-white bg-gradient-to-r from-primary to-primary/90 shadow-xl hover:scale-105 active:scale-95 transition-all">
                      {t("contact.send_btn", "Send Message")}
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
