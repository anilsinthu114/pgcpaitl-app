import { Button } from "@/components/ui/Button";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col gap-12 text-center">
      <section className="py-20 bg-muted bg-opacity-50 rounded-xl relative overflow-hidden border border-border">
        <div className="relative z-10 px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 font-serif text-primary">
            Post Graduate Program in <br className="hidden md:block" /> Law and Technology
          </h1>
          <p className="text-xl text-muted-foreground mb-10 max-w-3xl mx-auto leading-relaxed">
            Building Future Leaders at the Intersection of Legal Frameworks and Technological Innovation.
            An initiative by Government Law and Technology Institutes.
          </p>
          <div className="flex flex-col md:flex-row justify-center gap-4 items-center">
            <Link href="/apply">
              <Button className="px-8 py-4 text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all">
                Apply Now 2026
              </Button>
            </Link>
            <Link href="/status">
              <Button variant="outline" className="px-8 py-4 text-lg bg-white bg-opacity-80">
                Check Status
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
        <div className="card p-8 hover:shadow-md transition-shadow">
          <div className="text-secondary text-4xl mb-4 font-serif">01</div>
          <h3 className="text-xl font-bold mb-3 text-primary">Expert Faculty</h3>
          <p className="text-muted-foreground">Learn from top practitioners and academicians in the field of Cyber Law, AI Ethics, and Policy Making.</p>
        </div>
        <div className="card p-8 hover:shadow-md transition-shadow">
          <div className="text-secondary text-4xl mb-4 font-serif">02</div>
          <h3 className="text-xl font-bold mb-3 text-primary">Industry Relevant</h3>
          <p className="text-muted-foreground">Curriculum designed with inputs from leading technology firms and premier law institutes to meet market demands.</p>
        </div>
        <div className="card p-8 hover:shadow-md transition-shadow">
          <div className="text-secondary text-4xl mb-4 font-serif">03</div>
          <h3 className="text-xl font-bold mb-3 text-primary">Global Recognition</h3>
          <p className="text-muted-foreground">Certification recognized by governmental bodies and international organizations, opening global career pathways.</p>
        </div>
      </section>
    </div>
  );
}
