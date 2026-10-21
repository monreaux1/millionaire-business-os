import React from "react";
import { LOGO_URL, useBrandLogo, useIsDark } from "@/lib/logo";

function BrandLogo() {
  const dark = useIsDark();
  const url = useBrandLogo(LOGO_URL, { light: dark });
  return (
    <div className="h-16 flex items-center justify-center mb-6">
      {url
        ? <img src={url} alt="Millionaire Business OS" className="h-14 sm:h-16 w-auto max-w-full" />
        : <span className="text-xl font-bold tracking-tight text-foreground">Millionaire Business <span className="text-primary">OS</span></span>}
    </div>
  );
}

export default function AuthLayout({ title, subtitle, footer, children }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <a href="/welcome" aria-label="Millionaire Business OS home"><BrandLogo /></a>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">{title}</h1>
          {subtitle && <p className="text-muted-foreground mt-2">{subtitle}</p>}
        </div>
        <div className="bg-card rounded-2xl shadow-sm border border-border p-8">
          {children}
        </div>
        {footer && (
          <p className="text-center text-sm text-muted-foreground mt-6">{footer}</p>
        )}
      </div>
    </div>
  );
}
