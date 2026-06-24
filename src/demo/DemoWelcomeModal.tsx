import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "novasafe:demo-welcome-dismissed";

export function wasDemoWelcomeDismissed(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function dismissDemoWelcome(): void {
  try {
    localStorage.setItem(STORAGE_KEY, "1");
  } catch {
    /* ignore */
  }
}

type DemoWelcomeModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function DemoWelcomeModal({ open, onOpenChange }: DemoWelcomeModalProps) {
  const start = () => {
    dismissDemoWelcome();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Welcome to NovaSafe Demo</DialogTitle>
          <DialogDescription asChild>
            <div className="space-y-3 pt-1 text-sm text-muted-foreground">
              <p>This is a safe demonstration environment. No data is stored or sent to any server.</p>
              <p className="font-medium text-foreground">Explore:</p>
              <ul className="list-inside list-disc space-y-1">
                <li>Password Manager</li>
                <li>Secure Vault</li>
                <li>Secret Storage</li>
                <li>Notes &amp; Cards</li>
              </ul>
            </div>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button onClick={start} className="w-full sm:w-auto">
            Start exploring
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
