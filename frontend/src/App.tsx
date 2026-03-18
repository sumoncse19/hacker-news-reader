import { Routes, Route } from "react-router-dom";
import { Header } from "./components/layout/Header";
import { FeedPage } from "./pages/FeedPage";
import { StoryPage } from "./pages/StoryPage";
import { BookmarksPage } from "./pages/BookmarksPage";

function App() {
  return (
    <div className="min-h-screen bg-zinc-50">
      <Header />
      <main className="container mx-auto px-4 py-6 max-w-3xl bg-white min-h-[calc(100vh-56px)] shadow-sm">
        <Routes>
          <Route path="/" element={<FeedPage />} />
          <Route path="/story/:id" element={<StoryPage />} />
          <Route path="/bookmarks" element={<BookmarksPage />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
