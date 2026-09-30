import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { HashRouter, Route, Routes, useLocation } from 'react-router-dom';
import { selectedCourse } from '../content/registry';
import { CourseContext } from './course';
import { StoreContext, useProgress } from '../state/hooks';
import { ProgressStore } from '../state/store';
import { LocalStorageRepository } from '../state/storage';
import { Layout } from './Layout';
import { HomePage } from '../features/home/HomePage';
import { BookPage } from '../features/textbook/BookPage';
import { ChapterPage } from '../features/textbook/ChapterPage';
import { QuizMenu } from '../features/quiz/QuizMenu';
import { QuizSession } from '../features/quiz/QuizSession';
import { JudgementSession } from '../features/quiz/JudgementSession';
import { ReviewPage } from '../features/review/ReviewPage';
import { StatsPage } from '../features/analytics/StatsPage';
import { ZukanPage } from '../features/zukan/ZukanPage';
import { FiguresPage, FigurePage } from '../features/figures/FiguresPage';
import { SettingsPage } from '../features/settings/SettingsPage';
import { NotFound } from './NotFound';

// heavy, media-driven screens are code-split
const LecturesPage = lazy(() => import('../features/lecture/LecturesPage'));
const LecturePage = lazy(() => import('../features/lecture/LecturePage'));
const AnimationsPage = lazy(() => import('../features/animations/AnimationsPage'));
const AnimationPage = lazy(() => import('../features/animations/AnimationPage'));
const BoardViewerPage = lazy(() => import('../features/lecture/BoardViewerPage'));
const QuickReviewPage = lazy(() => import('../features/review/QuickReviewPage'));

function ScrollToTop() {
  const { pathname, search } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname, search]);
  return null;
}

function ThemeSync() {
  const { settings } = useProgress();
  useEffect(() => {
    const r = document.documentElement;
    if (settings.theme === 'system') delete r.dataset.theme;
    else r.dataset.theme = settings.theme;
    try { localStorage.setItem('medstudy:theme', JSON.stringify(settings.theme)); } catch { /* ignore */ }
    const bg = getComputedStyle(r).getPropertyValue('--paper').trim();
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', bg || '#15131f');
  }, [settings.theme]);
  return null;
}

export function App() {
  const [course] = useState(selectedCourse);
  const store = useMemo(() => new ProgressStore(new LocalStorageRepository(), course.id), [course.id]);
  useEffect(() => { document.title = `MED·STUDY ${course.title}`; }, [course]);
  useEffect(() => {
    const f = () => store.flush();
    window.addEventListener('pagehide', f);
    return () => window.removeEventListener('pagehide', f);
  }, [store]);

  return (
    <CourseContext.Provider value={course}>
      <StoreContext.Provider value={store}>
        <HashRouter>
          <ThemeSync />
          <ScrollToTop />
          <Layout>
            <Suspense fallback={<div className="empty">読み込み中…</div>}>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/book" element={<BookPage />} />
                <Route path="/chapter/:id" element={<ChapterPage />} />
                <Route path="/lectures" element={<LecturesPage />} />
                <Route path="/lecture/:id" element={<LecturePage />} />
                <Route path="/lecture/:id/board" element={<BoardViewerPage />} />
                <Route path="/review5/:id" element={<QuickReviewPage />} />
                <Route path="/figures" element={<FiguresPage />} />
                <Route path="/figures/:id" element={<FigurePage />} />
                <Route path="/animations" element={<AnimationsPage />} />
                <Route path="/animations/:id" element={<AnimationPage />} />
                <Route path="/zukan" element={<ZukanPage />} />
                <Route path="/quiz" element={<QuizMenu />} />
                <Route path="/quiz/play" element={<QuizSession />} />
                <Route path="/quiz/judge" element={<JudgementSession />} />
                <Route path="/review" element={<ReviewPage />} />
                <Route path="/stats" element={<StatsPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </Layout>
        </HashRouter>
      </StoreContext.Provider>
    </CourseContext.Provider>
  );
}
