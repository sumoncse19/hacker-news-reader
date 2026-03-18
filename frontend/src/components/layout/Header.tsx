import { Link, useLocation } from "react-router-dom";

export function Header() {
  const location = useLocation();

  const navItems = [
    { label: "Feed", path: "/" },
    { label: "Bookmarks", path: "/bookmarks" },
  ];

  return (
    <header className="border-b bg-white sticky top-0 z-10">
      <div className="container mx-auto px-4 flex items-center justify-between h-14">
        <Link to="/" className="text-lg font-bold text-orange-600">
          Smart HN Reader
        </Link>
        <nav className="flex gap-4">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`text-sm font-medium transition-colors ${
                location.pathname === item.path
                  ? "text-orange-600"
                  : "text-zinc-500 hover:text-zinc-700"
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
