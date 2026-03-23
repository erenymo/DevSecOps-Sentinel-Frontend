import { Link, useLocation } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";

interface BreadcrumbOverride {
  [path: string]: string;
}

interface BreadcrumbProps {
  overrides?: BreadcrumbOverride;
}

export function Breadcrumb({ overrides = {} }: BreadcrumbProps) {
  const location = useLocation();
  const pathnames = location.pathname.split("/").filter((x) => x);

  if (pathnames.length === 0) return null;

  const buildPath = (index: number) => `/${pathnames.slice(0, index + 1).join("/")}`;

  const formatLabel = (segment: string, fullPath: string) => {
    // Check overrides first
    if (overrides[fullPath]) return overrides[fullPath];

    // If it looks like a UUID, show a shorter version
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uuidRegex.test(segment)) return segment.substring(0, 8) + "…";

    // Capitalize and replace hyphens
    return segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, " ");
  };

  return (
    <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground mb-6">
      <Link
        to="/dashboard"
        className="flex items-center gap-1 hover:text-foreground transition-colors"
      >
        <Home className="h-3.5 w-3.5" />
      </Link>
      {pathnames.map((segment, index) => {
        const fullPath = buildPath(index);
        const isLast = index === pathnames.length - 1;
        const label = formatLabel(segment, fullPath);

        return (
          <span key={fullPath} className="flex items-center gap-1.5">
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50" />
            {isLast ? (
              <span className="font-medium text-foreground truncate max-w-[200px]">{label}</span>
            ) : (
              <Link
                to={fullPath}
                className="hover:text-foreground transition-colors truncate max-w-[200px]"
              >
                {label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
