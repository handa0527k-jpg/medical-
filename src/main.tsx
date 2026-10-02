import { StrictMode, useCallback, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app/App';
import { SwitchCourseContext } from './app/course';
import { loadCourse, selectCourse, selectedCourseId } from './content/registry';
import type { Course } from './content/types';
import './styles/tokens.css';
import './styles/base.css';
import './styles/components.css';
import './styles/learn.css';
import './styles/player.css';
import './styles/lecture.css';
import './styles/prep.css';
import './styles/quiz.css';
import './styles/app.css';
import './styles/catalog.css';

/** Holds the open course; only that course's content is downloaded. */
function Root({ initial }: { initial: Course }) {
  const [course, setCourse] = useState(initial);
  const cur = useRef(initial.id);
  const switchCourse = useCallback(async (id: string) => {
    if (id === cur.current) return;
    const c = await loadCourse(id);
    cur.current = c.id;
    selectCourse(c.id);
    setCourse(c);
  }, []);
  return (
    <SwitchCourseContext.Provider value={switchCourse}>
      <App course={course} />
    </SwitchCourseContext.Provider>
  );
}

const root = createRoot(document.getElementById('root')!);
loadCourse(selectedCourseId()).then(
  (course) =>
    root.render(
      <StrictMode>
        <Root initial={course} />
      </StrictMode>,
    ),
  () => root.render(<p className="boot-msg">教材を読み込めませんでした。通信状態を確認して、再読み込みしてください。</p>),
);
