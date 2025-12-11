import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
// ... imports
import { Github, Linkedin, Mail, Globe, Code2, Terminal, Users, Zap, Briefcase, Keyboard, HelpCircle } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface LearnMoreModalProps {
    children: React.ReactNode;
}

const LearnMoreModal = ({ children }: LearnMoreModalProps) => {
    return (
        <Dialog>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="max-w-4xl h-[80vh] p-0 bg-[#0d1117] border-[hsl(var(--editor-border))] gap-0 overflow-hidden">
                <DialogTitle className="sr-only">Learn More</DialogTitle>
                <Tabs defaultValue="developer" className="flex flex-col md:flex-row h-full w-full">

                    {/* Sidebar */}
                    <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-[hsl(var(--editor-border))] bg-card/30 p-6 flex-shrink-0">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-accent to-cyan-accent-glow flex items-center justify-center">
                                <Code2 className="w-5 h-5 text-white" />
                            </div>
                            <span className="font-bold text-lg text-[hsl(var(--editor-text))]">CodeCollab</span>
                        </div>

                        <TabsList className="flex flex-col h-auto w-full gap-2 bg-transparent p-0">
                            <TabsTrigger
                                value="developer"
                                className="w-full justify-start gap-3 px-4 py-3 data-[state=active]:bg-cyan-accent/10 data-[state=active]:text-cyan-accent border border-transparent data-[state=active]:border-cyan-accent/20"
                            >
                                <Users className="w-4 h-4" />
                                Developer Profile
                            </TabsTrigger>
                            <TabsTrigger
                                value="guide"
                                className="w-full justify-start gap-3 px-4 py-3 data-[state=active]:bg-cyan-accent/10 data-[state=active]:text-cyan-accent border border-transparent data-[state=active]:border-cyan-accent/20"
                            >
                                <Zap className="w-4 h-4" />
                                User Guide
                            </TabsTrigger>
                            <TabsTrigger
                                value="shortcuts"
                                className="w-full justify-start gap-3 px-4 py-3 data-[state=active]:bg-cyan-accent/10 data-[state=active]:text-cyan-accent border border-transparent data-[state=active]:border-cyan-accent/20"
                            >
                                <Keyboard className="w-4 h-4" />
                                Shortcuts
                            </TabsTrigger>
                            <TabsTrigger
                                value="faq"
                                className="w-full justify-start gap-3 px-4 py-3 data-[state=active]:bg-cyan-accent/10 data-[state=active]:text-cyan-accent border border-transparent data-[state=active]:border-cyan-accent/20"
                            >
                                <HelpCircle className="w-4 h-4" />
                                FAQ
                            </TabsTrigger>
                        </TabsList>

                        <div className="mt-auto pt-8 text-xs text-[hsl(var(--editor-text-muted))]">
                            <p>Version 1.0.0</p>
                            <p className="mt-1">© 2024 CodeCollab</p>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-h-0 bg-[#0d1117]">

                        {/* Developer Tab */}
                        <TabsContent value="developer" className="h-full m-0">
                            {/* ... existing developer content ... */}
                            {/* Re-using existing content logic for brevity in this replace block if possible, but replace_file_content needs full block if I touch the container */}
                            {/* Since I cannot select non-contiguous blocks, and I want to insert new tabs, I should just rebuild the structure or use multi_replace, but multi_replace is safer.
                                Wait, I can't use multi_replace for inserting into the middle easily without context.
                                I will just rewrite the file content efficiently.
                             */}
                            <div className="h-full overflow-y-auto px-8 py-8 custom-scrollbar">
                                <div className="max-w-3xl mx-auto space-y-8 pb-10">
                                    <div className="flex flex-col md:flex-row gap-6 items-center md:items-start text-center md:text-left">
                                        <div className="relative">
                                            <Avatar className="w-32 h-32 border-4 border-cyan-accent/20">
                                                <AvatarImage src="https://github.com/shadcn.png" alt="Mahesh T" />
                                                <AvatarFallback className="text-2xl font-bold bg-cyan-accent/10 text-cyan-accent">MT</AvatarFallback>
                                            </Avatar>
                                            <div className="absolute -bottom-2 -right-2 bg-green-500 w-6 h-6 rounded-full border-4 border-[#0d1117]" />
                                        </div>

                                        <div className="space-y-2">
                                            <div className="inline-block px-3 py-1 rounded-full bg-cyan-accent/10 text-cyan-accent text-xs font-medium mb-2 border border-cyan-accent/20">
                                                Full Stack Developer
                                            </div>
                                            <h2 className="text-3xl font-bold text-[hsl(var(--editor-text))]">Mahesh T</h2>
                                            <p className="text-[hsl(var(--editor-text-muted))] flex flex-wrap justify-center md:justify-start gap-4 text-sm">
                                                <span>Bangalore, India</span>
                                                <span className="opacity-50">|</span>
                                                <span>+91-9663293978</span>
                                                <span className="opacity-50">|</span>
                                                <span>mahesh.mca24@cmrit.ac.in</span>
                                            </p>

                                            <div className="flex gap-3 justify-center md:justify-start pt-3">
                                                <a href="https://github.com/Mahesh-T7" target="_blank" rel="noopener noreferrer">
                                                    <Button size="sm" variant="outline" className="gap-2 hover:text-cyan-accent hover:border-cyan-accent">
                                                        <Github className="w-4 h-4" /> GitHub
                                                    </Button>
                                                </a>
                                                <a href="https://linkedin.com/in/mahesht07a8634" target="_blank" rel="noopener noreferrer">
                                                    <Button size="sm" variant="outline" className="gap-2 hover:text-cyan-accent hover:border-cyan-accent">
                                                        <Linkedin className="w-4 h-4" /> LinkedIn
                                                    </Button>
                                                </a>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="h-px bg-[hsl(var(--editor-border))]" />

                                    <div className="space-y-4">
                                        <h3 className="text-lg font-semibold flex items-center gap-2 text-[hsl(var(--editor-text))]">
                                            <Briefcase className="w-5 h-5 text-cyan-accent" />
                                            Education
                                        </h3>
                                        <div className="grid gap-4">
                                            <div className="bg-card/20 p-4 rounded-xl border border-[hsl(var(--editor-border))]">
                                                <div className="flex justify-between items-start mb-1">
                                                    <h4 className="font-semibold text-[hsl(var(--editor-text))]">Master of Computer Applications (MCA)</h4>
                                                    <span className="text-xs text-cyan-accent bg-cyan-accent/10 px-2 py-1 rounded">2024 - 2026</span>
                                                </div>
                                                <p className="text-sm text-[hsl(var(--editor-text-muted))]">CMR Institute of Technology, Bangalore</p>
                                                <p className="text-xs text-[hsl(var(--editor-text-muted))] mt-2 opacity-80">CGPA: 7.49/10.0</p>
                                            </div>

                                            <div className="bg-card/20 p-4 rounded-xl border border-[hsl(var(--editor-border))]">
                                                <div className="flex justify-between items-start mb-1">
                                                    <h4 className="font-semibold text-[hsl(var(--editor-text))]">Bachelor of Science in Computer Science</h4>
                                                    <span className="text-xs text-cyan-accent bg-cyan-accent/10 px-2 py-1 rounded">Graduated 2024</span>
                                                </div>
                                                <p className="text-sm text-[hsl(var(--editor-text-muted))]">Government First Grade College, Sindhanur</p>
                                                <p className="text-xs text-[hsl(var(--editor-text-muted))] mt-2 opacity-80">CGPA: 8.37/10.0</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <h3 className="text-lg font-semibold flex items-center gap-2 text-[hsl(var(--editor-text))]">
                                            <Code2 className="w-5 h-5 text-cyan-accent" />
                                            Technical Skills
                                        </h3>
                                        <div className="grid md:grid-cols-2 gap-4">
                                            {[
                                                { title: "Languages", skills: ["Java", "Python", "C", "JavaScript (ES6+)"] },
                                                { title: "Web Technologies", skills: ["React.js", "Node.js", "Express.js", "AngularJS", "HTML5", "CSS3", "Tailwind CSS"] },
                                                { title: "Databases", skills: ["MongoDB", "MySQL", "MongoDB Atlas"] },
                                                { title: "Tools & Platforms", skills: ["Git", "GitHub", "VS Code", "Postman"] }
                                            ].map((category) => (
                                                <div key={category.title} className="bg-card/20 p-4 rounded-xl border border-[hsl(var(--editor-border))]">
                                                    <h4 className="text-xs font-semibold text-[hsl(var(--editor-text-muted))] uppercase tracking-wider mb-3">
                                                        {category.title}
                                                    </h4>
                                                    <div className="flex flex-wrap gap-2">
                                                        {category.skills.map((skill) => (
                                                            <span key={skill} className="px-2 py-1 bg-cyan-accent/5 border border-cyan-accent/20 rounded text-xs text-cyan-accent/90 hover:bg-cyan-accent/10 transition-colors cursor-default">
                                                                {skill}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="bg-card/20 p-4 rounded-xl border border-[hsl(var(--editor-border))]">
                                            <h4 className="text-xs font-semibold text-[hsl(var(--editor-text-muted))] uppercase tracking-wider mb-3">
                                                Core Competencies
                                            </h4>
                                            <div className="flex flex-wrap gap-2">
                                                {["Full-Stack Development", "Real-Time Systems", "AI Integration", "API Design", "Responsive UI/UX"].map((skill) => (
                                                    <span key={skill} className="px-2 py-1 bg-gradient-to-r from-cyan-accent/10 to-transparent border border-cyan-accent/20 rounded text-xs text-cyan-accent hover:border-cyan-accent/40 transition-colors">
                                                        {skill}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                </div>
                            </div>
                        </TabsContent>

                        {/* Guide Tab */}
                        <TabsContent value="guide" className="h-full m-0">
                            <div className="h-full overflow-y-auto px-8 py-8 custom-scrollbar">
                                <div className="max-w-3xl mx-auto space-y-8 pb-10">
                                    <div className="mb-8">
                                        <h2 className="text-3xl font-bold text-[hsl(var(--editor-text))] mb-2">How to Use CodeCollab</h2>
                                        <p className="text-[hsl(var(--editor-text-muted))]">Master the platform in 4 easy steps.</p>
                                    </div>

                                    <div className="space-y-6">
                                        {[
                                            {
                                                icon: <Terminal className="w-6 h-6 text-cyan-accent" />,
                                                title: "1. Create or Join a Project",
                                                desc: "Start by creating a new project from the Dashboard, or paste an Invite Code to join an existing session."
                                            },
                                            {
                                                icon: <Code2 className="w-6 h-6 text-cyan-accent" />,
                                                title: "2. The Editor Workspace",
                                                desc: "Use the Monaco-powered editor on the left. The file explorer allows you to manage multiple files. All changes are saved automatically."
                                            },
                                            {
                                                icon: <Users className="w-6 h-6 text-cyan-accent" />,
                                                title: "3. Real-time Collaboration",
                                                desc: "Share your project URL with teammates. You'll see their cursors and edits live as they type. Use the chat to communicate."
                                            },
                                            {
                                                icon: <Zap className="w-6 h-6 text-cyan-accent" />,
                                                title: "4. AI Assistance",
                                                desc: "Stuck? Select a code block and click the AI Wand icon. Ask for 'Explain', 'Fix', or 'Improve' to get instant help."
                                            }
                                        ].map((step, i) => (
                                            <div key={i} className="flex gap-4 p-4 rounded-xl bg-card/30 border border-[hsl(var(--editor-border))]">
                                                <div className="mt-1 bg-cyan-accent/10 w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0">
                                                    {step.icon}
                                                </div>
                                                <div>
                                                    <h3 className="text-lg font-semibold text-[hsl(var(--editor-text))] mb-1">{step.title}</h3>
                                                    <p className="text-sm text-[hsl(var(--editor-text-muted))] leading-relaxed">
                                                        {step.desc}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="bg-cyan-accent/5 border border-cyan-accent/20 rounded-xl p-6 mt-8 text-center">
                                        <p className="text-[hsl(var(--editor-text))] font-medium mb-3">Ready to start building?</p>
                                        <Button className="bg-cyan-accent text-black hover:bg-cyan-accent/90">
                                            Go to Dashboard
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </TabsContent>

                        {/* Shortcuts Tab */}
                        <TabsContent value="shortcuts" className="h-full m-0">
                            <div className="h-full overflow-y-auto px-8 py-8 custom-scrollbar">
                                <div className="max-w-3xl mx-auto space-y-8 pb-10">
                                    <div className="mb-8">
                                        <h2 className="text-3xl font-bold text-[hsl(var(--editor-text))] mb-2">Keyboard Shortcuts</h2>
                                        <p className="text-[hsl(var(--editor-text-muted))]">Boost your productivity with these hotkeys.</p>
                                    </div>

                                    <div className="grid gap-4">
                                        {[
                                            { action: "Save File", win: "Ctrl + S", mac: "Cmd + S" },
                                            { action: "Toggle Terminal", win: "Ctrl + `", mac: "Cmd + `" },
                                            { action: "Command Palette", win: "Ctrl + Shift + P", mac: "Cmd + Shift + P" },
                                            { action: "AI Assistant", win: "Ctrl + I", mac: "Cmd + I" },
                                            { action: "Format Code", win: "Shift + Alt + F", mac: "Shift + Opt + F" },
                                            { action: "Find", win: "Ctrl + F", mac: "Cmd + F" },
                                            { action: "Replace", win: "Ctrl + H", mac: "Cmd + H" }
                                        ].map((item, i) => (
                                            <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-card/20 border border-[hsl(var(--editor-border))]">
                                                <span className="font-medium text-[hsl(var(--editor-text))]">{item.action}</span>
                                                <div className="flex gap-4 text-sm text-[hsl(var(--editor-text-muted))]">
                                                    <div className="flex flex-col items-end gap-1">
                                                        <span className="text-xs uppercase opacity-50">Windows/Linux</span>
                                                        <kbd className="px-2 py-1 bg-muted rounded border border-border font-mono text-xs">{item.win}</kbd>
                                                    </div>
                                                    <div className="flex flex-col items-end gap-1">
                                                        <span className="text-xs uppercase opacity-50">Mac</span>
                                                        <kbd className="px-2 py-1 bg-muted rounded border border-border font-mono text-xs">{item.mac}</kbd>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </TabsContent>

                        {/* FAQ Tab */}
                        <TabsContent value="faq" className="h-full m-0">
                            <div className="h-full overflow-y-auto px-8 py-8 custom-scrollbar">
                                <div className="max-w-3xl mx-auto space-y-8 pb-10">
                                    <div className="mb-8">
                                        <h2 className="text-3xl font-bold text-[hsl(var(--editor-text))] mb-2">Frequently Asked Questions</h2>
                                        <p className="text-[hsl(var(--editor-text-muted))]">Common questions and answers.</p>
                                    </div>

                                    <Accordion type="single" collapsible className="w-full">
                                        {[
                                            { q: "Is my code saved automatically?", a: "Yes, all changes are saved to the server in real-time as you type, ensuring you never lose your work." },
                                            { q: "Which languages are supported?", a: "We support a wide range of languages including JavaScript, TypeScript, Python, Java, C++, Go, Rust, and more through our Monaco Editor integration." },
                                            { q: "Can I deploy my project?", a: "Currently, you can run and test your code within the secure sandbox environment. Full deployment to external providers is on our roadmap." },
                                            { q: "How does the AI work?", a: "We use Google's advanced Gemini Pro model to analyze your code context and provide intelligent suggestions, bug fixes, and explanations." },
                                            { q: "Is it really real-time?", a: "Yes! We use WebSocket technology and CRDTs (Conflict-free Replicated Data Types) to ensure sub-millisecond synchronization between all collaborators." }
                                        ].map((item, i) => (
                                            <AccordionItem key={i} value={`item-${i}`} className="border-b border-[hsl(var(--editor-border))]">
                                                <AccordionTrigger className="text-[hsl(var(--editor-text))] hover:text-cyan-accent text-left">
                                                    {item.q}
                                                </AccordionTrigger>
                                                <AccordionContent className="text-[hsl(var(--editor-text-muted))] leading-relaxed">
                                                    {item.a}
                                                </AccordionContent>
                                            </AccordionItem>
                                        ))}
                                    </Accordion>
                                </div>
                            </div>
                        </TabsContent>

                    </div>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
};

export default LearnMoreModal;
