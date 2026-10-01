import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app/App';
import { loadCourse, selectedCourseId } from './content/registry';
import './styles/tokens.css';
import './styles/base.css';
import './styles/components.css';
import './styles/learn.css';
import './styles/player.css';
import './styles/lecture.css';
import './styles/prep.css';
import './styles/quiz.css';
import './styles/app.css';

// only the selected course's content is downloaded (switching courses reloads the page)
const root = createRoot(document.getElementById('root')!);
loadCourse(selectedCourseId()).then(
  (course) =>
    root.render(
      <StrictMode>
        <App course={course} />
      </StrictMode>,
    ),
  () => root.render(<p className="boot-msg">教材を読み込めませんでした。通信状態を確認して、再読み込みしてください。</p>),
);
