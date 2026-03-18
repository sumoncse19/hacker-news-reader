import { Link, useLocation } from "react-router-dom";

export function Header() {
  const location = useLocation();

  const navItems = [
    { label: "Feed", path: "/" },
    { label: "Bookmarks", path: "/bookmarks" },
  ];

  return (
    <header className="sticky top-0 z-10 border-b bg-linear-to-r from-orange-500 to-orange-600 shadow-sm">
      <div className="container mx-auto px-4 max-w-3xl flex items-center justify-between h-14">
        <Link to="/" className="flex items-center gap-2 text-white">
          <span className="text-xl">📰</span>
          <span className="text-lg font-bold tracking-tight">
            Smart HN Reader
          </span>
        </Link>
        <nav className="flex gap-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                location.pathname === item.path
                  ? "bg-white/20 text-white"
                  : "text-orange-100 hover:bg-white/10 hover:text-white"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
