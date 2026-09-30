import { Link } from 'react-router-dom';

export function NotFound() {
  return (
    <div className="empty">
      <p>ページが見つかりません。</p>
      <Link className="btn" to="/">ホームへ</Link>
    </div>
  );
}
