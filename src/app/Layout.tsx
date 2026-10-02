import { useEffect, useState, type ReactNode } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { useCourse } from './course';
import { useProgress, useStore } from '../state/hooks';

const NAV: { to: string; label: string; end?: boolean }[] = [
  { to: '/', label: 'ホーム', end: true },
  { to: '/course', label: '教材トップ' },
  { to: '/lectures', label: '授業' },
  { to: '/book', label: '教科書' },
  { to: '/figures', label: '図解' },
  { to: '/animations', label: 'アニメ' },
  { to: '/quiz', label: '5択問題' },
  { to: '/review', label: '弱点復習' },
  { to: '/stats', label: '分析' },
];

const MORE: { to: string; label: string; sub: string }[] = [
  { to: '/book', label: '教科書', sub: '章ごとの解説と赤シート' },
  { to: '/figures', label: '図解', sub: 'タップで構造と役割を確認' },
  { to: '/animations', label: 'アニメーション', sub: '機序を動きで理解' },
  { to: '/zukan', label: '役割図鑑', sub: '小器官をたとえで一覧' },
  { to: '/stats', label: '成績・弱点分析', sub: '正答率・学習時間・履歴' },
  { to: '/settings', label: '設定', sub: 'テーマ・音声・データ' },
];

export function Layout({ children }: { children: ReactNode }) {
  const course = useCourse();
  const { settings } = useProgress();
  const store = useStore();
  const [menu, setMenu] = useState(false);
  const loc = useLocation();
  useEffect(() => setMenu(false), [loc.pathname]);
  const isDark = settings.theme === 'dark' || (settings.theme === 'system' && matchMedia('(prefers-color-scheme: dark)').matches);
  const tabActive = (p: string) => (p === '/' ? loc.pathname === '/' || loc.pathname.startsWith('/category') : loc.pathname.startsWith(p) || (p === '/book' && loc.pathname.startsWith('/chapter')) || (p === '/lectures' && loc.pathname.startsWith('/lecture')));

  return (
    <>
      <a href="#main" className="visually-hidden">本文へ移動</a>
      {/* shared SVG defs referenced by figures (glow filter, grid, cell gradient) */}
      <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true" focusable="false">
        <defs>
          <filter id="gl" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="4" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M40 0H0V40" fill="none" stroke="#141a26" strokeWidth="1" /></pattern>
          <radialGradient id="cg" cx="50%" cy="45%" r="60%"><stop offset="0" stopColor="#131a26" /><stop offset="1" stopColor="#090b11" /></radialGradient>
        </defs>
      </svg>
      <header className="app-header">
        <div className="wrap hrow">
          <Link to="/" className="brand" aria-label="ホームへ">
            <i />
            <b>MED·STUDY</b>
          </Link>
          <Link to="/course" className="brand-course" title="開いている教材">{course.title}</Link>
          <nav className="topnav" aria-label="メイン">
            {NAV.map((n) => (
              <NavLink key={n.to} to={n.to} end={n.end} className={({ isActive }) => (isActive || (n.to === '/' && loc.pathname.startsWith('/category')) || (n.to === '/book' && loc.pathname.startsWith('/chapter')) || (n.to === '/lectures' && loc.pathname.startsWith('/lecture/')) ? 'active' : '')}>
                {n.label}
              </NavLink>
            ))}
          </nav>
          <span className="spacer" />
          <button className="icon-btn" aria-label={isDark ? 'ライトテーマにする' : 'ダークテーマにする'} onClick={() => store.setSettings({ theme: isDark ? 'light' : 'dark' })}>
            <Icon name={isDark ? 'sun' : 'moon'} />
          </button>
          <Link to="/settings" className="icon-btn" aria-label="設定"><Icon name="gear" /></Link>
        </div>
      </header>

      <main id="main" className="app-main wrap">{children}</main>

      <nav className="tabbar" aria-label="タブ">
        <Link to="/" className={tabActive('/') ? 'active' : ''}><Icon name="home" />ホーム</Link>
        <Link to="/course" className={tabActive('/course') || tabActive('/book') ? 'active' : ''}><Icon name="book" />教材</Link>
        <Link to="/lectures" className={tabActive('/lectures') ? 'active' : ''}><Icon name="play" />授業</Link>
        <Link to="/quiz" className={tabActive('/quiz') || tabActive('/review') ? 'active' : ''}><Icon name="quiz" />5択</Link>
        <button onClick={() => setMenu(true)} aria-haspopup="dialog" aria-expanded={menu}><Icon name="menu" />メニュー</button>
      </nav>

      {menu && (
        <>
          <div className="sheet-backdrop" onClick={() => setMenu(false)} />
          <div className="sheet" role="dialog" aria-label="メニュー">
            <div className="grab" />
            <div className="sheet-grid">
              <Link to="/review"><b>🎯 弱点復習</b><small>間違えた問題・苦手テーマ</small></Link>
              {MORE.map((m) => (
                <Link key={m.to} to={m.to}><b>{m.label}</b><small>{m.sub}</small></Link>
              ))}
            </div>
          </div>
        </>
      )}
    </>
  );
}
