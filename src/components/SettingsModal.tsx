
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { useTheme, Theme } from "./ThemeProvider";
import { Settings, Monitor, Type, User, Info, LogOut, Moon, Sun, Laptop } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface SettingsModalProps {
    children: React.ReactNode;
}

export const SettingsModal = ({ children }: SettingsModalProps) => {
    const { theme, setTheme } = useTheme();

    return (
        <Dialog>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="max-w-4xl h-[80vh] p-0 bg-[#0d1117] border-[hsl(var(--editor-border))] gap-0 overflow-hidden text-[hsl(var(--editor-text))]">
                <DialogTitle className="sr-only">Settings</DialogTitle>
                <Tabs defaultValue="appearance" className="flex flex-col md:flex-row h-full w-full">

                    {/* Sidebar */}
                    <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-[hsl(var(--editor-border))] bg-card/30 p-6 flex-shrink-0">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-8 h-8 rounded-lg bg-[hsl(var(--editor-bg))] border border-[hsl(var(--editor-border))] flex items-center justify-center">
                                <Settings className="w-5 h-5 text-[hsl(var(--editor-text-muted))]" />
                            </div>
                            <span className="font-bold text-lg">Settings</span>
                        </div>

                        <TabsList className="flex flex-col h-auto w-full gap-2 bg-transparent p-0">
                            <TabsTrigger
                                value="appearance"
                                className="w-full justify-start gap-3 px-4 py-3 data-[state=active]:bg-cyan-accent/10 data-[state=active]:text-cyan-accent border border-transparent data-[state=active]:border-cyan-accent/20"
                            >
                                <Monitor className="w-4 h-4" />
                                Appearance
                            </TabsTrigger>
                            <TabsTrigger
                                value="editor"
                                className="w-full justify-start gap-3 px-4 py-3 data-[state=active]:bg-cyan-accent/10 data-[state=active]:text-cyan-accent border border-transparent data-[state=active]:border-cyan-accent/20"
                            >
                                <Type className="w-4 h-4" />
                                Editor
                            </TabsTrigger>
                            <TabsTrigger
                                value="account"
                                className="w-full justify-start gap-3 px-4 py-3 data-[state=active]:bg-cyan-accent/10 data-[state=active]:text-cyan-accent border border-transparent data-[state=active]:border-cyan-accent/20"
                            >
                                <User className="w-4 h-4" />
                                Account
                            </TabsTrigger>
                            <TabsTrigger
                                value="about"
                                className="w-full justify-start gap-3 px-4 py-3 data-[state=active]:bg-cyan-accent/10 data-[state=active]:text-cyan-accent border border-transparent data-[state=active]:border-cyan-accent/20"
                            >
                                <Info className="w-4 h-4" />
                                About
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-h-0 bg-[#0d1117] p-8 overflow-y-auto custom-scrollbar">

                        {/* Appearance Tab */}
                        <TabsContent value="appearance" className="max-w-2xl space-y-8 mt-0">
                            <div>
                                <h2 className="text-2xl font-bold mb-4">Appearance</h2>
                                <p className="text-[hsl(var(--editor-text-muted))] mb-8">Customize how CodeCollab looks and feels.</p>

                                <div className="space-y-6">
                                    <div className="p-4 rounded-xl border border-[hsl(var(--editor-border))] bg-card/20">
                                        <h3 className="text-sm font-medium mb-4">Theme Preference</h3>
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                            {[
                                                { id: "light", label: "Light", icon: Sun },
                                                { id: "dark", label: "Dark", icon: Moon },
                                                { id: "system", label: "System", icon: Laptop },
                                                { id: "midnight", label: "Midnight", icon: Moon, color: "bg-[#0F172A]" },
                                                { id: "forest", label: "Forest", icon: Moon, color: "bg-[#14271A]" },
                                                { id: "sunset", label: "Sunset", icon: Moon, color: "bg-[#261717]" }
                                            ].map((t) => (
                                                <button
                                                    key={t.id}
                                                    onClick={() => setTheme(t.id as Theme)}
                                                    className={`flex flex-col items-center gap-3 p-4 rounded-lg border-2 transition-all relative overflow-hidden ${theme === t.id ? 'border-cyan-accent bg-cyan-accent/5' : 'border-transparent hover:bg-card/40'
                                                        }`}
                                                >
                                                    {t.color && (
                                                        <div className={`absolute inset-0 opacity-20 ${t.color}`} />
                                                    )}
                                                    <div className="relative z-10 flex flex-col items-center gap-2">
                                                        <t.icon className="w-6 h-6" />
                                                        <span className="text-sm font-medium">{t.label}</span>
                                                    </div>
                                                    {theme === t.id && (
                                                        <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-cyan-accent" />
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </TabsContent>

                        {/* Editor Tab */}
                        <TabsContent value="editor" className="max-w-2xl space-y-8 mt-0">
                            <div>
                                <h2 className="text-2xl font-bold mb-4">Editor</h2>
                                <p className="text-[hsl(var(--editor-text-muted))] mb-8">Configure the code editing experience.</p>

                                <div className="space-y-6">
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div className="space-y-0.5">
                                                <Label>Font Size</Label>
                                                <p className="text-xs text-[hsl(var(--editor-text-muted))]">Control the size of the text in the editor</p>
                                            </div>
                                            <span className="text-sm font-mono bg-card/50 px-2 py-1 rounded">14px</span>
                                        </div>
                                        <Slider defaultValue={[14]} max={24} min={10} step={1} className="w-[60%]" />
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <Label>Font Family</Label>
                                            <p className="text-xs text-[hsl(var(--editor-text-muted))]">Font used in the code editor</p>
                                        </div>
                                        <Select defaultValue="jetbrains">
                                            <SelectTrigger className="w-[180px]">
                                                <SelectValue placeholder="Select a font" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="jetbrains">JetBrains Mono</SelectItem>
                                                <SelectItem value="fira">Fira Code</SelectItem>
                                                <SelectItem value="consolas">Consolas</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="flex items-center justify-between pt-4 border-t border-[hsl(var(--editor-border))]">
                                        <div className="space-y-0.5">
                                            <Label>Word Wrap</Label>
                                            <p className="text-xs text-[hsl(var(--editor-text-muted))]">Wrap long lines of code</p>
                                        </div>
                                        <Switch defaultChecked />
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <Label>Minimap</Label>
                                            <p className="text-xs text-[hsl(var(--editor-text-muted))]">Show the code overview on the right</p>
                                        </div>
                                        <Switch defaultChecked />
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <Label>Line Numbers</Label>
                                            <p className="text-xs text-[hsl(var(--editor-text-muted))]">Show line numbers in the gutter</p>
                                        </div>
                                        <Switch defaultChecked />
                                    </div>
                                </div>
                            </div>
                        </TabsContent>

                        {/* Account Tab */}
                        <TabsContent value="account" className="max-w-2xl space-y-8 mt-0">
                            <div>
                                <h2 className="text-2xl font-bold mb-4">Account</h2>
                                <p className="text-[hsl(var(--editor-text-muted))] mb-8">Manage your profile and session.</p>

                                <div className="p-6 rounded-xl border border-[hsl(var(--editor-border))] bg-card/20 space-y-6">
                                    <div className="flex items-center gap-4">
                                        <Avatar className="w-16 h-16">
                                            <AvatarImage src="https://github.com/shadcn.png" />
                                            <AvatarFallback>MT</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <h3 className="text-lg font-semibold">User</h3>
                                            <p className="text-sm text-[hsl(var(--editor-text-muted))]">user@example.com</p>
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t border-[hsl(var(--editor-border))]">
                                        <Button variant="destructive" className="flex items-center gap-2">
                                            <LogOut className="w-4 h-4" />
                                            Sign Out
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </TabsContent>

                        {/* About Tab */}
                        <TabsContent value="about" className="max-w-2xl space-y-8 mt-0">
                            <div>
                                <h2 className="text-2xl font-bold mb-4">About</h2>
                                <div className="flex flex-col items-center p-8 rounded-xl border border-[hsl(var(--editor-border))] bg-card/20 text-center">
                                    <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-cyan-accent to-cyan-accent-glow flex items-center justify-center mb-4">
                                        <Monitor className="w-8 h-8 text-white" />
                                    </div>
                                    <h3 className="text-xl font-bold mb-1">CodeCollab</h3>
                                    <p className="text-[hsl(var(--editor-text-muted))] mb-6">v1.0.0</p>
                                    <p className="text-sm text-[hsl(var(--editor-text-muted))] max-w-sm mx-auto leading-relaxed">
                                        Built with ❤️ by Mahesh T. codeCollab is a real-time collaborative code editor powered by AI.
                                    </p>
                                </div>
                            </div>
                        </TabsContent>

                    </div>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
};
