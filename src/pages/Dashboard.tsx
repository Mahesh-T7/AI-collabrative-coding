import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import { AxiosError } from 'axios';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Label } from '@/components/ui/label';
import { Code2, Plus, LogOut, Folder, Loader2, Share2, Search, LayoutGrid, List, Filter, Github, Trash2, Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ProjectCardSkeleton } from '@/components/ProjectCardSkeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

interface Project {
  _id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  ownerId: {
    username: string;
    email: string;
    avatarUrl?: string;
  };
  members: Array<{
    username: string;
    email: string;
    avatarUrl?: string;
  }>;
}

const Dashboard = () => {
  const { user, signOut, loading: authLoading } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [newProjectName, setNewProjectName] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importLocalDialogOpen, setImportLocalDialogOpen] = useState(false);
  const [repoUrl, setRepoUrl] = useState('');
  const [creating, setCreating] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'name'>('date');
  const [filterBy, setFilterBy] = useState<'all' | 'owned' | 'shared'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await api.get('/projects');
        setProjects(response.data);
      } catch (error) {
        const err = error as AxiosError<{ message: string }>;
        toast({
          title: 'Error',
          description: err.response?.data?.message || 'Failed to load projects',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchProjects();
    }
  }, [user, toast]);

  const filteredProjects = projects
    .filter((project) => {
      const matchesSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter =
        filterBy === 'all'
          ? true
          : filterBy === 'owned'
            ? project.ownerId?.email === user?.email
            : project.ownerId?.email !== user?.email; // Shared
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      }
      return a.name.localeCompare(b.name);
    });

  const createProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;

    setCreating(true);
    try {
      const response = await api.post('/projects', { name: newProjectName });
      const project = response.data;

      toast({
        title: 'Project created!',
        description: `${newProjectName} has been created successfully`,
      });
      setNewProjectName('');
      setDialogOpen(false);
      navigate(`/project/${project._id}`);
    } catch (error) {
      const err = error as AxiosError<{ message: string }>;
      toast({
        title: 'Error',
        description: err.response?.data?.message || 'Failed to create project',
        variant: 'destructive',
      });
    } finally {
      setCreating(false);
    }
  };

  const importProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repoUrl.trim()) return;

    setCreating(true);
    try {
      const response = await api.post('/projects/import/github', { repoUrl });
      const project = response.data;

      toast({
        title: 'Project imported!',
        description: `${project.name} has been imported successfully`,
      });
      setRepoUrl('');
      setImportDialogOpen(false);
      navigate(`/project/${project._id}`);
    } catch (error) {
      const err = error as AxiosError<{ message: string }>;
      toast({
        title: 'Error',
        description: err.response?.data?.message || 'Failed to import project',
        variant: 'destructive',
      });
    } finally {
      setCreating(false);
    }
  };

  const deleteProject = async (projectId: string) => {
    try {
      await api.delete(`/projects/${projectId}`);
      setProjects(projects.filter(p => p._id !== projectId));
      toast({
        title: 'Project deleted',
        description: 'The project has been permanently deleted.',
      });
      setProjectToDelete(null);
    } catch (error) {
      const err = error as AxiosError<{ message: string }>;
      toast({
        title: 'Error',
        description: err.response?.data?.message || 'Failed to delete project',
        variant: 'destructive',
      });
    }
  };

  const handleLocalImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setCreating(true);

    try {
      // 1. Prepare files
      const fileList: { name: string; content: string; language: string }[] = [];
      let projectName = "Imported Project";

      // Try to determine project name from directory
      if (files[0].webkitRelativePath) {
        projectName = files[0].webkitRelativePath.split('/')[0];
      }

      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        // Skip node_modules, .git, and binary files
        if (file.webkitRelativePath.includes('node_modules') ||
          file.webkitRelativePath.includes('.git') ||
          file.webkitRelativePath.includes('dist') ||
          file.webkitRelativePath.includes('build')) {
          continue;
        }

        // Only process text files
        const textExtensions = ['.js', '.jsx', '.ts', '.tsx', '.html', '.css', '.json', '.md', '.txt', '.py', '.java'];
        const ext = '.' + file.name.split('.').pop();
        if (!textExtensions.includes(ext) && file.type.indexOf('text') === -1 && file.type !== 'application/json' && file.type !== 'application/javascript') {
          continue;
        }

        const content = await readFileContent(file);

        // Normalize path: Remove top-level directory name
        const relativePath = file.webkitRelativePath.split('/').slice(1).join('/');

        // Skip if it's the root folder itself or empty
        if (!relativePath) continue;

        let language = 'plaintext';
        if (['.js', '.jsx'].includes(ext)) language = 'javascript';
        else if (['.ts', '.tsx'].includes(ext)) language = 'typescript';
        else if (ext === '.html') language = 'html';
        else if (ext === '.css') language = 'css';
        else if (ext === '.json') language = 'json';

        fileList.push({
          name: relativePath,
          content,
          language
        });
      }

      if (fileList.length === 0) {
        throw new Error("No valid text files found to import.");
      }

      // 2. Send to backend
      const response = await api.post('/projects/import/local', {
        name: projectName,
        files: fileList
      });
      const project = response.data;

      toast({
        title: 'Project imported!',
        description: `${project.name} has been imported successfully`,
      });

      setImportLocalDialogOpen(false);
      navigate(`/project/${project._id}`);

    } catch (error) {
      console.error(error);
      const err = error as AxiosError<{ message: string }>;
      toast({
        title: 'Error',
        description: err.response?.data?.message || (error as Error).message || 'Failed to import project',
        variant: 'destructive',
      });
    } finally {
      setCreating(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const readFileContent = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = (e) => reject(e);
      reader.readAsText(file);
    });
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-accent to-cyan-accent-glow flex items-center justify-center">
                <Code2 className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-accent to-cyan-accent-glow bg-clip-text text-transparent">
                CodeCollab
              </h1>
            </div>
          </div>
        </header>
        <main className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="h-8 w-48 bg-muted rounded animate-pulse mb-2" />
              <div className="h-4 w-64 bg-muted rounded animate-pulse" />
            </div>
            <div className="h-10 w-32 bg-muted rounded animate-pulse" />
          </div>
          <div className="h-16 w-full bg-muted rounded animate-pulse mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <ProjectCardSkeleton key={i} />
            ))}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-accent to-cyan-accent-glow flex items-center justify-center">
              <Code2 className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-accent to-cyan-accent-glow bg-clip-text text-transparent">
              CodeCollab
            </h1>
          </div>
          <Button variant="ghost" onClick={signOut} className="gap-2">
            <LogOut className="w-4 h-4" />
            Sign Out
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold mb-2">Your Projects</h2>
            <p className="text-muted-foreground">Manage and access your coding projects</p>
          </div>

          <div className="flex items-center gap-4">
            {/* Import Local Dialog/Button */}
            <Button variant="outline" className="gap-2" onClick={() => fileInputRef.current?.click()} disabled={creating}>
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              Import Local
            </Button>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              // @ts-expect-error webkitdirectory is not in standard types but works in browsers
              webkitdirectory=""
              directory=""
              multiple
              onChange={handleLocalImport}
            />

            <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Github className="w-4 h-4" />
                  Import from GitHub
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Import from GitHub</DialogTitle>
                </DialogHeader>
                <form onSubmit={importProject} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="repo-url">Repository URL</Label>
                    <Input
                      id="repo-url"
                      placeholder="https://github.com/username/repo"
                      value={repoUrl}
                      onChange={(e) => setRepoUrl(e.target.value)}
                      required
                      disabled={creating}
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={creating}>
                    {creating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Importing...
                      </>
                    ) : (
                      'Import Project'
                    )}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2 bg-gradient-to-r from-cyan-accent to-cyan-accent-glow hover:opacity-90">
                  <Plus className="w-4 h-4" />
                  New Project
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Project</DialogTitle>
                </DialogHeader>
                <form onSubmit={createProject} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="project-name">Project Name</Label>
                    <Input
                      id="project-name"
                      placeholder="My Awesome Project"
                      value={newProjectName}
                      onChange={(e) => setNewProjectName(e.target.value)}
                      required
                      disabled={creating}
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={creating}>
                    {creating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      'Create Project'
                    )}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="flex flex-col md:flex-row gap-4 mb-8 items-center justify-between bg-card/30 p-4 rounded-lg border border-border/50 backdrop-blur-sm">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search projects..."
              className="pl-10 bg-background/50"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
            <Select value={filterBy} onValueChange={(value: string) => setFilterBy(value as 'all' | 'owned' | 'shared')}>
              <SelectTrigger className="w-[140px] bg-background/50">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Projects</SelectItem>
                <SelectItem value="owned">Owned by Me</SelectItem>
                <SelectItem value="shared">Shared with Me</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={(value: string) => setSortBy(value as 'date' | 'name')}>
              <SelectTrigger className="w-[140px] bg-background/50">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Last Updated</SelectItem>
                <SelectItem value="name">Name (A-Z)</SelectItem>
              </SelectContent>
            </Select>

            <div className="h-8 w-[1px] bg-border mx-1 hidden md:block" />

            <ToggleGroup type="single" value={viewMode} onValueChange={(value) => value && setViewMode(value as 'grid' | 'list')}>
              <ToggleGroupItem value="grid" aria-label="Grid view" size="sm">
                <LayoutGrid className="w-4 h-4" />
              </ToggleGroupItem>
              <ToggleGroupItem value="list" aria-label="List view" size="sm">
                <List className="w-4 h-4" />
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        </div>

        {
          filteredProjects.length === 0 ? (
            <Card className="p-12 text-center bg-card/50 backdrop-blur-sm border-dashed">
              <Folder className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="text-xl font-semibold mb-2">No projects found</h3>
              <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                {searchQuery ? "Try adjusting your search or filters" : "Create your first project to get started or choose a template"}
              </p>

              {!searchQuery && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 max-w-2xl mx-auto">
                  {['React', 'Node.js', 'Python'].map((tech) => (
                    <Button
                      key={tech}
                      variant="outline"
                      className="h-auto py-4 flex flex-col gap-2 hover:border-cyan-accent hover:text-cyan-accent"
                      onClick={() => {
                        setNewProjectName(`${tech} Project`);
                        setDialogOpen(true);
                      }}
                    >
                      <Code2 className="w-6 h-6" />
                      <span>{tech}</span>
                    </Button>
                  ))}
                </div>
              )}

              <Button
                onClick={() => setDialogOpen(true)}
                className="gap-2 bg-gradient-to-r from-cyan-accent to-cyan-accent-glow hover:opacity-90"
              >
                <Plus className="w-4 h-4" />
                Create New Project
              </Button>
            </Card>
          ) : (
            <div className={viewMode === 'grid'
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              : "flex flex-col gap-4"
            }>
              {filteredProjects.map((project) => (
                <Card
                  key={project._id}
                  className={`p-6 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-accent/10 hover:border-cyan-accent/50 bg-card/50 backdrop-blur-sm group ${viewMode === 'list' ? 'flex items-center justify-between gap-4' : ''
                    }`}
                >
                  <div
                    className={`flex items-start gap-3 cursor-pointer ${viewMode === 'list' ? 'flex-1' : ''}`}
                    onClick={() => navigate(`/project/${project._id}`)}
                  >
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-cyan-accent/20 to-cyan-accent-glow/20 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                      <Code2 className="w-6 h-6 text-cyan-accent" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-lg truncate group-hover:text-cyan-accent transition-colors">
                          {project.name}
                        </h3>
                        {viewMode === 'grid' && (
                          <span className="px-2 py-0.5 rounded-full bg-cyan-accent/10 text-cyan-accent text-[10px] font-medium border border-cyan-accent/20">
                            JavaScript
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Updated {new Date(project.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className={`flex items-center ${viewMode === 'list' ? 'gap-6' : 'mt-4 pt-4 border-t border-border justify-between'}`}>
                    <div className="flex items-center gap-2">
                      <div className="flex -space-x-2">
                        <div
                          className="w-8 h-8 rounded-full bg-cyan-accent/20 border-2 border-background flex items-center justify-center text-xs font-medium ring-2 ring-background"
                          title={`Owner: ${project.ownerId?.username}`}
                        >
                          {project.ownerId?.username?.charAt(0).toUpperCase()}
                        </div>
                        {project.members?.map((member, i) => (
                          <div
                            key={i}
                            className="w-8 h-8 rounded-full bg-purple-500/20 border-2 border-background flex items-center justify-center text-xs font-medium ring-2 ring-background"
                            title={`Member: ${member.username}`}
                          >
                            {member.username.charAt(0).toUpperCase()}
                          </div>
                        ))}
                      </div>
                      {project.members?.length > 0 && (
                        <span className="text-xs text-muted-foreground ml-1">
                          +{project.members.length}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      {/* Delete Button */}
                      {project.ownerId?.email === user?.email && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
                          onClick={(e) => {
                            e.stopPropagation();
                            setProjectToDelete(project._id);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}

                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-cyan-accent hover:bg-cyan-accent/10"
                        onClick={(e) => {
                          e.stopPropagation();
                          const url = `${window.location.origin}/project/${project._id}`;
                          navigator.clipboard.writeText(url);
                          toast({
                            title: "Link copied!",
                            description: "Project link copied to clipboard",
                          });
                        }}
                      >
                        <Share2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )
        }
      </main >

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!projectToDelete} onOpenChange={(open) => !open && setProjectToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the project and all of its files.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 hover:bg-red-600"
              onClick={() => projectToDelete && deleteProject(projectToDelete)}
            >
              Delete Project
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div >
  );
};

export default Dashboard;