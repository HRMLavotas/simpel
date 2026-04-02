import { useState } from 'react';
import { Keyboard } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface Shortcut {
  keys: string[];
  description: string;
  category?: string;
}

interface KeyboardShortcutsHelpProps {
  shortcuts: Shortcut[];
}

export function KeyboardShortcutsHelp({ shortcuts }: KeyboardShortcutsHelpProps) {
  const [open, setOpen] = useState(false);

  // Group shortcuts by category
  const groupedShortcuts = shortcuts.reduce((acc, shortcut) => {
    const category = shortcut.category || 'General';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(shortcut);
    return acc;
  }, {} as Record<string, Shortcut[]>);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8" title="Keyboard Shortcuts">
          <Keyboard className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
          <DialogDescription>
            Gunakan shortcut keyboard untuk navigasi lebih cepat
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {Object.entries(groupedShortcuts).map(([category, categoryShortcuts]) => (
            <div key={category}>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                {category}
              </h3>
              <div className="space-y-2">
                {categoryShortcuts.map((shortcut, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <span className="text-sm">{shortcut.description}</span>
                    <div className="flex gap-1">
                      {shortcut.keys.map((key, keyIndex) => (
                        <Badge
                          key={keyIndex}
                          variant="outline"
                          className="font-mono text-xs px-2 py-1"
                        >
                          {key}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 pt-4 border-t text-xs text-muted-foreground">
          <p>💡 Tip: Tekan <Badge variant="outline" className="font-mono text-xs mx-1">Ctrl + /</Badge> untuk membuka dialog ini kapan saja</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Predefined shortcuts for common pages
export const DASHBOARD_SHORTCUTS: Shortcut[] = [
  { keys: ['Ctrl', 'F'], description: 'Focus filter', category: 'Navigation' },
  { keys: ['Ctrl', 'D'], description: 'Open data selector', category: 'Navigation' },
  { keys: ['Ctrl', 'R'], description: 'Refresh data', category: 'Actions' },
];

export const EMPLOYEES_SHORTCUTS: Shortcut[] = [
  { keys: ['Ctrl', 'N'], description: 'Add new employee', category: 'Actions' },
  { keys: ['Ctrl', 'K'], description: 'Focus search', category: 'Navigation' },
  { keys: ['Ctrl', 'E'], description: 'Export CSV', category: 'Actions' },
  { keys: ['Escape'], description: 'Close modals', category: 'Navigation' },
];
