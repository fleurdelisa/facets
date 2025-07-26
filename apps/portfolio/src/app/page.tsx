import { Button } from "@/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/ui/card";
import { ArrowRight, Code, ExternalLink, Github, Linkedin, Mail, Twitter } from "lucide-react";
import Link from "next/link";

type Project = {
  title: string;
  description: string;
  tags: string[];
  githubUrl?: string;
  liveUrl?: string;
};

const skills = [
  { name: "TypeScript", level: 90 },
  { name: "React", level: 90 },
  { name: "Next.js", level: 85 },
  { name: "Node.js", level: 80 },
  { name: "Three.js", level: 75 },
  { name: "Tailwind CSS", level: 85 },
  { name: "GraphQL", level: 70 },
  { name: "PostgreSQL", level: 75 },
];

const projects: Project[] = [
  {
    title: "Project One",
    description: "A modern web application built with Next.js and TypeScript that showcases my skills in building responsive and performant user interfaces.",
    tags: ["Next.js", "TypeScript", "Tailwind CSS"],
    githubUrl: "#",
    liveUrl: "#"
  },
  {
    title: "Interactive 3D Experience",
    description: "An immersive 3D web experience created with Three.js and React Three Fiber, demonstrating my ability to work with WebGL and 3D graphics.",
    tags: ["Three.js", "React Three Fiber", "WebGL"],
    githubUrl: "#",
    liveUrl: "#"
  },
  {
    title: "Full Stack Dashboard",
    description: "A comprehensive dashboard application with real-time data visualization and user authentication.",
    tags: ["Node.js", "Express", "MongoDB", "React"],
    githubUrl: "#",
    liveUrl: "#"
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-b from-background/80 to-background" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/10 via-background to-background" />
        </div>
        
        <div className="container relative z-10 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/80">
              Hi, I'm <span className="text-primary">Lisa Le</span>
            </h1>
            <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              I build digital experiences with modern web technologies and a focus on performance, accessibility, and user experience.
            </p>
            <div className="mt-10 flex flex-wrap justify-center gap-4">
              <Button asChild size="lg" className="gap-2">
                <Link href="#projects">
                  View My Work
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button variant="ghost" size="lg" asChild>
                <Link href="#contact" className="flex items-center gap-2">
                  Get In Touch
                </Link>
              </Button>
            </div>
          </div>
        </div>
        
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
          <div className="animate-bounce">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-foreground/70">
              <path d="M19 14L12 21M12 21L5 14M12 21L12 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 md:py-32">
        <div className="container px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-12 text-center">
              About Me
            </h2>
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <p className="text-lg text-muted-foreground mb-6">
                  I'm a full-stack developer with a love for creating beautiful, functional, and user-centric digital experiences. With a strong foundation in modern web technologies, I bring ideas to life through clean, efficient code, and thoughtful design.
                </p>
                <p className="text-lg text-muted-foreground mb-8">
                  When I'm not coding, you can find me at the climbing gym, taking hip-hop dance classes, or reflecting on the human experience.
                </p>
                <div className="flex flex-wrap gap-4">
                  <Button variant="outline" size="lg" asChild className="gap-2">
                    <Link href="#" target="_blank" rel="noopener noreferrer">
                      <Github className="h-5 w-5" />
                      GitHub
                    </Link>
                  </Button>
                  <Button variant="outline" size="lg" asChild className="gap-2">
                    <Link href="#" target="_blank" rel="noopener noreferrer">
                      <Linkedin className="h-5 w-5" />
                      LinkedIn
                    </Link>
                  </Button>
                  <Button variant="outline" size="lg" asChild className="gap-2">
                    <Link href="#" target="_blank" rel="noopener noreferrer">
                      <Twitter className="h-5 w-5" />
                      Twitter
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Projects Section */}
      <section id="projects" className="py-20 md:py-32 bg-muted/20">
        <div className="container px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-12 text-center">
              Featured Projects
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              {projects.map((project, index) => (
                <Card key={index} className="group hover:shadow-lg transition-shadow overflow-hidden">
                  <CardHeader>
                    <CardTitle>{project.title}</CardTitle>
                    <CardDescription>{project.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {project.tags.map((tag) => (
                        <span 
                          key={tag} 
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </CardContent>
                  <CardFooter className="flex gap-2">
                    {project.githubUrl && (
                      <Button variant="outline" size="sm" asChild className="gap-2">
                        <Link href={project.githubUrl} target="_blank" rel="noopener noreferrer">
                          <Github className="h-4 w-4" />
                          Code
                        </Link>
                      </Button>
                    )}
                    {project.liveUrl && (
                      <Button variant="outline" size="sm" asChild className="gap-2">
                        <Link href={project.liveUrl} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4" />
                          Live Demo
                        </Link>
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 md:py-32">
        <div className="container px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
              Get In Touch
            </h2>
            <p className="text-lg text-muted-foreground mb-10">
              Have a project in mind or want to collaborate? I&apos;d love to hear from you!
            </p>
            <Button size="lg" asChild>
              <Link href="mailto:your.email@example.com">
                <Mail className="mr-2 h-5 w-5" />
                Say Hello
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Lisa Le. All rights reserved.
            </div>
            <div className="flex space-x-4 mt-4 md:mt-0">
              <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                <span className="sr-only">GitHub</span>
                <Github className="h-5 w-5" />
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                <span className="sr-only">LinkedIn</span>
                <Linkedin className="h-5 w-5" />
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                <span className="sr-only">Twitter</span>
                <Twitter className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
