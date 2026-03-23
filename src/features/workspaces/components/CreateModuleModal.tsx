import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlusCircle, Loader2 } from "lucide-react";
import { useCreateModule } from "../hooks/useModules";

interface CreateModuleModalProps {
  workspaceId: string;
}

export function CreateModuleModal({ workspaceId }: CreateModuleModalProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [ecosystem, setEcosystem] = useState("NuGet");
  const [rootPath, setRootPath] = useState("");
  const createMutation = useCreateModule();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(
      { workspaceId, data: { name, ecosystem, rootPath } },
      {
        onSuccess: () => {
          setOpen(false);
          setName("");
          setEcosystem("NuGet");
          setRootPath("");
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        <button
          type="button"
          className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2 gap-2"
        >
          <PlusCircle className="h-4 w-4" />
          Create Module
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create Module</DialogTitle>
            <DialogDescription>
              Add a new module to this workspace to track its dependencies and
              security posture.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="module-name">Module Name</Label>
              <Input
                id="module-name"
                placeholder="auth-service"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="module-ecosystem">Ecosystem</Label>
              <select
                id="module-ecosystem"
                value={ecosystem}
                onChange={(e) => setEcosystem(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="NuGet">NuGet (.NET)</option>
                <option value="npm">npm (Node.js)</option>
                <option value="PyPI">PyPI (Python)</option>
                <option value="Maven">Maven (Java)</option>
                <option value="Go">Go Modules</option>
              </select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="module-root">Root Path</Label>
              <Input
                id="module-root"
                placeholder="/src/services/auth"
                required
                value={rootPath}
                onChange={(e) => setRootPath(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
