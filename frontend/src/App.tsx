import { Routes, Route } from "react-router-dom";
import { Header } from "./components/layout/Header";
import { FeedPage } from "./pages/FeedPage";
import { StoryPage } from "./pages/StoryPage";

function App() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="container mx-auto px-4 py-6 max-w-3xl">
        <Routes>
          <Route path="/" element={<FeedPage />} />
          <Route path="/story/:id" element={<StoryPage />} />
          <Route
            path="/bookmarks"
            element={
              <p className="text-zinc-400 text-center py-8">
                Bookmarks — coming in Phase 3
              </p>
            }
          />
        </Routes>
      </main>
    </div>
  );
}

export default App;
