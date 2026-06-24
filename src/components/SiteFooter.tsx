import { Link } from "@tanstack/react-router";
import { Leaf } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t-2 border-primary/30 bg-gradient-to-b from-secondary/15 via-white/95 to-sand/30 shadow-inner">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-primary to-secondary text-white">
              <Leaf className="h-4 w-4" />
            </span>
            <span className="font-display text-base font-semibold text-slate-900">EcoLoop Siargao</span>
          </div>
          <p className="mt-3 max-w-xs text-sm text-slate-600/80">
            A circular economy platform connecting Siargao's farmers, restaurants, residents, and LGUs to turn waste into harvest.
          </p>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-slate-900">Platform</h4>
          <ul className="mt-3 space-y-2 text-sm text-slate-600/80">
            <li><Link to="/marketplace" className="hover:text-primary hover:font-medium transition-colors">Marketplace</Link></li>
            <li><Link to="/trades" className="hover:text-primary hover:font-medium transition-colors">Transaction History</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-slate-900">Community</h4>
          <ul className="mt-3 space-y-2 text-sm text-slate-600/80">
            <li><Link to="/about" className="hover:text-primary hover:font-medium transition-colors">About</Link></li>
            <li><Link to="/how-it-works" className="hover:text-primary hover:font-medium transition-colors">How it works</Link></li>
            <li><Link to="/auth" className="hover:text-primary hover:font-medium transition-colors">LGU dashboard</Link></li>
            <li><Link to="/contact" className="hover:text-primary hover:font-medium transition-colors">Contact</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-slate-900">Get involved</h4>
          <p className="mt-3 text-sm text-slate-600/80">
            Ready to close the loop? Join as a farmer, restaurant, resident, or LGU partner.
          </p>
          <Link to="/auth" className="mt-3 inline-flex rounded-full bg-gradient-to-r from-primary to-secondary px-4 py-2 text-sm font-medium text-white shadow-md shadow-primary/10 hover:from-primary/90 hover:to-secondary/90">
            Join EcoLoop
          </Link>
        </div>
      </div>
      <div className="border-t border-border/60 py-5 text-center text-xs text-slate-600/80">
        © {new Date().getFullYear()} EcoLoop Siargao · Built for a circular island economy
      </div>
    </footer>
  );
}
