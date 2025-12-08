import { AlertTriangle } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-border bg-card/50 mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-display text-xl font-bold text-primary">VibeBet</span>
            <span className="text-sm text-muted-foreground">© 2024</span>
          </div>
          
          <div className="flex items-start gap-2 max-w-2xl text-center md:text-left">
            <AlertTriangle className="w-5 h-5 text-pending shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground leading-relaxed">
              Zakłady bukmacherskie wiążą się z ryzykiem. Gra u nielegalnych bukmacherów jest karalna. 
              Serwis przeznaczony dla osób pełnoletnich (18+). Hazard może uzależniać.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
