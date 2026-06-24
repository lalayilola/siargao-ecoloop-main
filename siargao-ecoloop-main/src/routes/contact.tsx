import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Container, PageHero } from "@/components/Section";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Mail, Phone, MapPin, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — EcoLoop Siargao" },
      { name: "description", content: "Get in touch with the EcoLoop Siargao team — LGU partnerships, community rollouts, media and general questions." },
      { property: "og:title", content: "Contact EcoLoop Siargao" },
      { property: "og:description", content: "We'd love to hear from you. Reach the EcoLoop team here." },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  const [sent, setSent] = useState(false);
  return (
    <>
      <PageHero
        eyebrow="Contact"
        title="Let's close the loop together."
        sub="LGU partnerships, barangay rollouts, media or just a question — we'd love to hear from you."
      />
      <Container className="grid gap-8 py-12 lg:grid-cols-[1fr_1.4fr]">
        <div className="space-y-4">
          <Card className="p-5">
            <div className="flex items-start gap-3">
              <Mail className="mt-0.5 h-5 w-5 text-primary" />
              <div>
                <div className="font-semibold">Email</div>
                <div className="text-sm text-muted-foreground">hello@ecoloopsiargao.ph</div>
              </div>
            </div>
          </Card>
          <Card className="p-5">
            <div className="flex items-start gap-3">
              <Phone className="mt-0.5 h-5 w-5 text-primary" />
              <div>
                <div className="font-semibold">Phone</div>
                <div className="text-sm text-muted-foreground">+63 917 555 0123</div>
              </div>
            </div>
          </Card>
          <Card className="p-5">
            <div className="flex items-start gap-3">
              <MapPin className="mt-0.5 h-5 w-5 text-primary" />
              <div>
                <div className="font-semibold">Office</div>
                <div className="text-sm text-muted-foreground">Tourism Road, General Luna, Siargao Island</div>
              </div>
            </div>
          </Card>
        </div>
        <Card className="p-8">
          {sent ? (
            <div className="grid place-items-center py-10 text-center">
              <CheckCircle2 className="h-10 w-10 text-primary" />
              <h3 className="mt-3 font-display text-xl font-semibold">Message sent!</h3>
              <p className="mt-2 text-sm text-muted-foreground">We'll get back to you shortly. Salamat!</p>
            </div>
          ) : (
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                setSent(true);
              }}
            >
              <h2 className="font-display text-xl font-semibold">Send us a message</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" required />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="subject">Subject</Label>
                <Input id="subject" required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="msg">Message</Label>
                <Textarea id="msg" rows={5} required />
              </div>
              <Button type="submit" className="rounded-full" size="lg">Send message</Button>
              <p className="text-xs text-muted-foreground">Demo form — no data is submitted.</p>
            </form>
          )}
        </Card>
      </Container>
    </>
  );
}
