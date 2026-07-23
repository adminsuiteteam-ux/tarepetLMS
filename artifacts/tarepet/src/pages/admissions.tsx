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
import { CheckCircle2, FileText, Calendar, GraduationCap } from "lucide-react";

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
    // This is client-side only as requested
    console.log(values);
    toast({
      title: "Inquiry Sent Successfully",
      description: "Thank you for your interest! Our admissions office will contact you shortly.",
    });
    form.reset();
  }

  return (
    <PageTransition>
      {/* Header */}
      <section className="bg-primary py-20 md:py-24 text-white">
        <div className="container mx-auto px-4 md:px-6">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-6xl font-serif font-bold mb-6">Admissions</h1>
            <p className="text-lg md:text-xl text-white/90">
              Join the Tarepet family. We seek students and families who share our commitment to academic excellence and character development.
            </p>
          </div>
        </div>
      </section>

      <section className="py-20 bg-background">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-24">
            
            {/* Process Info (Left Col) */}
            <div className="lg:col-span-7">
              <h2 className="text-3xl font-serif font-bold text-foreground mb-8">Admission Process</h2>
              
              <div className="space-y-12">
                <div className="flex gap-6">
                  <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 shadow-sm border border-primary/20">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-foreground mb-2">1. Application Form</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      Obtain an admission form from the school office at Kpansia-Epje or fill out the online inquiry form below to initiate the process. A non-refundable application fee is required.
                    </p>
                  </div>
                </div>

                <div className="flex gap-6">
                  <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 shadow-sm border border-primary/20">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-foreground mb-2">2. Assessment & Interview</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      Prospective pupils for Primary and Secondary levels will take an entrance assessment in Mathematics and English. Both parents and the child will be invited for an informal interactive session.
                    </p>
                  </div>
                </div>

                <div className="flex gap-6">
                  <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 shadow-sm border border-primary/20">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-foreground mb-2">3. Offer & Acceptance</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      Successful candidates will receive a formal letter of admission. Parents are required to accept the offer by paying the acceptance fee and submitting all required documentation within the stipulated timeframe.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-16 bg-muted p-8 rounded-2xl border border-border">
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
            </div>

            {/* Inquiry Form (Right Col) */}
            <div className="lg:col-span-5">
              <div className="bg-card p-8 rounded-2xl shadow-xl border border-border sticky top-32">
                <h3 className="text-2xl font-serif font-bold text-foreground mb-2">Make an Inquiry</h3>
                <p className="text-muted-foreground text-sm mb-8">
                  Fill out this form and our admissions team will get back to you with next steps.
                </p>

                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Parent / Guardian Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Mrs. Jane Doe" {...field} className="bg-background" />
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
                            <FormLabel>Email Address</FormLabel>
                            <FormControl>
                              <Input placeholder="jane@example.com" {...field} className="bg-background" />
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
                            <FormLabel>Phone Number</FormLabel>
                            <FormControl>
                              <Input placeholder="0800 000 0000" {...field} className="bg-background" />
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
                          <FormLabel>Child's Age Range</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="bg-background">
                                <SelectValue placeholder="Select an age range" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="2-5">2 - 5 years (Nursery)</SelectItem>
                              <SelectItem value="6-11">6 - 11 years (Primary)</SelectItem>
                              <SelectItem value="12-14">12 - 14 years (Junior Secondary)</SelectItem>
                              <SelectItem value="15-17">15 - 17 years (Senior Secondary)</SelectItem>
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
                          <FormLabel>Message / Questions</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Tell us what you'd like to know..." 
                              className="min-h-[120px] bg-background resize-none"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button type="submit" className="w-full h-12 text-base font-bold" data-testid="button-submit-inquiry">
                      Submit Inquiry
                    </Button>
                  </form>
                </Form>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Virtual Tour CTA */}
      <section className="py-20 bg-secondary text-white text-center">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-serif font-bold mb-6">Experience Tarepet</h2>
          <p className="text-white/80 max-w-2xl mx-auto mb-10 text-lg">
            Can't make it to Kpansia-Epje right now? Take a glimpse into our classrooms, laboratories, and play areas.
          </p>
          <Button variant="outline" className="h-14 px-8 text-base bg-transparent text-white border-white hover:bg-white hover:text-secondary font-bold">
            Take Virtual Tour
          </Button>
        </div>
      </section>
    </PageTransition>
  );
}
