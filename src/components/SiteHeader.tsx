import { Link, useNavigate } from "@tanstack/react-router";
import { Leaf, Menu, X, LogOut, LayoutDashboard } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { LanguageSelector } from "@/components/LanguageSelector";
import { useLanguage } from "@/hooks/use-language";

const nav = [
  { to: "/", labelKey: "nav.home" },
  { to: "/how-it-works", labelKey: "nav.howItWorks" },
  { to: "/features", labelKey: "nav.features" },
  { to: "/about", labelKey: "nav.about" },
] as const;

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const formatMunicipality = (municipality: string | null | undefined) => {
    if (!municipality) return null;
    return municipality
      .replace(/_/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const municipalityLabel = formatMunicipality(profile?.municipality);

  return (
    <header className="sticky top-0 z-40 border-b border-primary/20 bg-gradient-to-r from-secondary/20 via-white/80 to-sand/20 shadow-sm backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-3 rounded-full border border-primary/10 bg-white/80 px-3 py-2 shadow-sm shadow-primary/5 transition hover:bg-white">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-primary to-secondary text-white shadow-md">
            <Leaf className="h-5 w-5" />
          </span>
          <span className="font-display text-base font-semibold tracking-tight text-slate-900">
            EcoLoop <span className="text-primary">Siargao</span>
          </span>
        </Link>
        {user && municipalityLabel && (
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
            <span className="text-xs font-medium text-primary">Municipality of {municipalityLabel}</span>
          </div>
        )}
        <nav className="hidden items-center gap-1 lg:flex">
          {nav.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className="rounded-full px-3 py-1.5 text-sm text-slate-600 transition-colors hover:bg-sand/70 hover:text-slate-900"
              activeProps={{ className: "rounded-full px-3 py-1.5 text-sm bg-primary/20 text-primary font-medium" }}
              activeOptions={{ exact: n.to === "/" }}
            >
              {t(n.labelKey)}
            </Link>
          ))}
        </nav>
        <div className="hidden lg:flex items-center gap-2">
          <LanguageSelector />
          {user ? (
            <>
              <Link to="/profile" search={{ userId: undefined }} className="flex items-center gap-2 rounded-full border border-primary/15 bg-white/80 px-3 py-1.5 text-slate-700 shadow-sm shadow-primary/5 transition hover:bg-white">
                <div className="h-8 w-8 rounded-full overflow-hidden bg-secondary/10 border-2 border-primary/40 flex-shrink-0">
                  {profile?.profile_picture_url ? (
                    <img src={profile.profile_picture_url} alt={profile?.full_name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center font-semibold text-primary text-xs">
                      {profile?.full_name?.[0]?.toUpperCase() ?? "?"}
                    </div>
                  )}
                </div>
                <span className="text-sm text-slate-700 font-medium hidden sm:inline">{profile?.full_name?.split(" ")[0] || t("nav.account")}</span>
              </Link>
              <Button asChild size="sm" className="rounded-full bg-gradient-to-r from-primary to-secondary text-white hover:from-primary/90 hover:to-secondary/90">
                <Link to="/messages">
                  <LayoutDashboard className="mr-1.5 h-4 w-4" /> {t("nav.openApp")}
                </Link>
              </Button>
              <Button size="sm" variant="ghost" className="border border-primary/20 text-slate-700 hover:bg-secondary/10 hover:text-primary" onClick={async () => { await signOut(); navigate({ to: "/" }); }}>
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <Button asChild size="sm" className="rounded-full bg-gradient-to-r from-primary to-secondary text-white hover:from-primary/90 hover:to-secondary/90">
                <Link to="/auth">{t("nav.joinEcoLoop")}</Link>
              </Button>
            </>
          )}
        </div>
        <button
          aria-label="Toggle menu"
          onClick={() => setOpen((v) => !v)}
          className="grid h-10 w-10 place-items-center rounded-md border border-border lg:hidden"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>
      {open && (
        <div className="border-t border-border/60 bg-background lg:hidden">
          <div className="mx-auto grid max-w-7xl gap-1 px-4 py-3">
            {user && municipalityLabel && (
              <div className="px-3 py-2 text-xs font-medium text-primary bg-primary/10 rounded-md">
                Municipality of {municipalityLabel}
              </div>
            )}
            {nav.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-2 text-sm text-foreground hover:bg-secondary"
              >
                {t(n.labelKey)}
              </Link>
            ))}
            {user ? (
              <>
                <Link to="/profile" search={{ userId: undefined }} onClick={() => setOpen(false)} className="rounded-md px-3 py-2 text-sm text-foreground hover:bg-secondary">
                  {t("nav.myProfile")}
                </Link>
                <Link to="/messages" onClick={() => setOpen(false)} className="mt-1 rounded-md bg-primary px-3 py-2 text-center text-sm font-medium text-primary-foreground">
                  {t("nav.openApp")}
                </Link>
              </>
            ) : (
              <Link to="/auth" onClick={() => setOpen(false)} className="mt-1 rounded-md bg-primary px-3 py-2 text-center text-sm font-medium text-primary-foreground">
                {t("nav.joinEcoLoop")}
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
