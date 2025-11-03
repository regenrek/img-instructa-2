import { createFileRoute } from '@tanstack/react-router';
import GradientOrb from '~/components/gradient-orb';
import { Button } from '~/components/ui/button';
import { Link } from '@tanstack/react-router';

export const Route = createFileRoute('/(marketing)/about')({
  component: AboutPage,
});

function AboutPage() {
  const skills = [
    'TypeScript',
    'React',
    'Node.js',
    'TanStack Stack',
    'Full-Stack Development',
    'System Design',
    'API Development',
    'Modern Web Technologies',
  ];

  const technologies = [
    { name: 'Frontend', items: ['React', 'TypeScript', 'Tailwind CSS', 'TanStack Router'] },
    { name: 'Backend', items: ['Node.js', 'Server Functions', 'REST APIs', 'Database Design'] },
    { name: 'Tools', items: ['Git', 'Docker', 'Vite', 'Testing', 'CI/CD'] },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      {/* Hero Section */}
      <main className="container relative z-0 mx-auto flex flex-col items-center px-4 pt-20 text-center md:pt-32">
        <GradientOrb className="-translate-x-1/2 absolute top-0 left-1/2 z-[-1] transform" />

        <h1 className="max-w-4xl font-medium text-4xl text-foreground md:text-6xl lg:text-7xl">
          Software Developer
        </h1>

        <p className="mt-6 text-lg text-muted-foreground md:text-xl max-w-2xl">
          Building modern web applications with passion and precision. 
          Crafting clean code and exceptional user experiences.
        </p>

        <p className="mt-4 text-muted-foreground text-xs uppercase tracking-wider">
          Full-Stack Engineer
        </p>

        {/* About Section */}
        <div className="mt-12 w-full max-w-2xl space-y-6 rounded-lg border border-border bg-card p-6 text-left">
          <h2 className="text-2xl font-semibold">About Me</h2>
          <div className="space-y-4 text-muted-foreground">
            <p>
              I'm a software developer passionate about creating elegant solutions to complex problems. 
              I love working with modern technologies and building applications that make a difference.
            </p>
            <p>
              My approach combines attention to detail with a focus on user experience, clean code, 
              and scalable architecture. I enjoy learning new technologies and staying up-to-date 
              with the latest industry trends.
            </p>
          </div>
        </div>

        {/* Skills Section */}
        <div className="mt-12 w-full max-w-2xl space-y-6 rounded-lg border border-border bg-card p-6">
          <h2 className="text-2xl font-semibold">Skills & Technologies</h2>
          
          <div className="space-y-6">
            {technologies.map((tech) => (
              <div key={tech.name}>
                <h3 className="font-semibold text-lg mb-3">{tech.name}</h3>
                <div className="flex flex-wrap gap-2">
                  {tech.items.map((item) => (
                    <span
                      key={item}
                      className="rounded-md border border-border bg-muted px-3 py-1.5 text-sm"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Skills Tags */}
        <div className="mt-12 w-full max-w-2xl space-y-6 rounded-lg border border-border bg-card p-6">
          <h2 className="text-2xl font-semibold">Tech Stack</h2>
          <div className="flex flex-wrap gap-2">
            {skills.map((skill) => (
              <span
                key={skill}
                className="rounded-full border border-border bg-background px-4 py-2 text-sm font-medium"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>

        {/* Call to Action */}
        <div className="mt-12 w-full max-w-2xl space-y-6 rounded-lg border border-border bg-card p-6 text-center">
          <h2 className="text-2xl font-semibold">Let's Connect</h2>
          <p className="text-muted-foreground mb-4">
            Interested in collaborating or have a project in mind? Let's talk!
          </p>
          <div className="flex gap-4 justify-center">
            <Link to="/">
              <Button variant="outline">Back to Home</Button>
            </Link>
            <Link to="/docs">
              <Button>View Docs</Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

