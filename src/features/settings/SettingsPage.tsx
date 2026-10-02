import { useEffect, useState } from 'react';
import { useProgress, useStore } from '../../state/hooks';
import { japaneseVoices, voiceScore, webSpeechAvailable } from '../../engine/speech/narrator';
import type { ThemePref } from '../../state/types';
import { COURSES } from '../../content/registry';
import { useCourse, useSwitchCourse } from '../../app/course';

export function SettingsPage() {
  const s = useProgress();
  const store = useStore();
  const course = useCourse();
  const switchCourse = useSwitchCourse();
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>(() => japaneseVoices());
  const [confirm, setConfirm] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (!webSpeechAvailable()) return;
    const f = () => setVoices(japaneseVoices());
    speechSynthesis.addEventListener('voiceschanged', f);
    return () => speechSynthesis.removeEventListener('voiceschanged', f);
  }, []);

  const exportData = () => {
    const blob = new Blob([JSON.stringify(s, null, 1)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `medstudy-${s.courseId}-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };

  return (
    <>
      <section className="page-h"><div className="kick">SETTINGS</div><h1>設定</h1></section>
      <div className="card" style={{ padding: '6px 20px', marginTop: 16 }}>
        {COURSES.length > 1 && (
          <div className="set-row">
            <div className="l"><b>教材</b><small>学習する講義を切り替えます（進捗は教材ごとに保存）。ホームの「分野から学ぶ」からも選べます</small></div>
            <select className="sel" value={course.id} onChange={(e) => { void switchCourse(e.target.value); }} aria-label="教材">
              {COURSES.map((c) => <option key={c.id} value={c.id}>{c.lecture.label}　{c.title}</option>)}
            </select>
          </div>
        )}
        <div className="set-row">
          <div className="l"><b>テーマ</b><small>医学教育向けのダークが標準です</small></div>
          <div className="seg" role="group" aria-label="テーマ">
            {([['dark', 'ダーク'], ['light', 'ライト'], ['system', '端末に合わせる']] as [ThemePref, string][]).map(([k, l]) => (
              <button key={k} className={s.settings.theme === k ? 'on' : ''} aria-pressed={s.settings.theme === k} onClick={() => store.setSettings({ theme: k })}>{l}</button>
            ))}
          </div>
        </div>
        <div className="set-row">
          <div className="l">
            <b>ナレーションの声</b>
            <small>{webSpeechAvailable() ? '授業モードで使う端末の音声合成。★は自然に聞こえる高品質音声です。' : 'この端末・ブラウザでは音声合成が使えません（字幕で進行します）。'}</small>
          </div>
          <select className="sel" disabled={!voices.length} value={s.settings.voiceURI ?? ''} onChange={(e) => store.setSettings({ voiceURI: e.target.value || null })} aria-label="ナレーションの声">
            <option value="">自動（いちばん自然な声）</option>
            {voices.map((v) => <option key={v.voiceURI} value={v.voiceURI}>{v.name}{voiceScore(v) >= 40 ? '　★' : ''}</option>)}
          </select>
        </div>
        <div className="set-row">
          <div className="l"><b>授業の初期設定</b><small>字幕・ナレーション・自動一時停止</small></div>
          <div className="seg">
            <button className={s.settings.subtitles ? 'on' : ''} aria-pressed={s.settings.subtitles} onClick={() => store.setSettings({ subtitles: !s.settings.subtitles })}>字幕</button>
            <button className={s.settings.narration ? 'on' : ''} aria-pressed={s.settings.narration} onClick={() => store.setSettings({ narration: !s.settings.narration })}>音声</button>
            <button className={s.settings.autoPause ? 'on' : ''} aria-pressed={s.settings.autoPause} onClick={() => store.setSettings({ autoPause: !s.settings.autoPause })}>自動停止</button>
          </div>
        </div>
        <details className="set-row" style={{ display: 'block' }}>
          <summary style={{ cursor: 'pointer', fontWeight: 700, minHeight: 32 }}>もっと自然な声にするには（iPad・Mac・Windows）</summary>
          <div style={{ fontSize: 14, lineHeight: 1.8, marginTop: 8 }}>
            <p style={{ margin: '4px 0' }}><b>iPad・iPhone</b>：設定 → アクセシビリティ → 読み上げコンテンツ → 声 → 日本語 →「O-ren（プレミアム）」「Kyoko（拡張）」などをダウンロード。追加後にこのページを開き直してください。</p>
            <p style={{ margin: '4px 0' }}><b>Mac</b>：システム設定 → アクセシビリティ → 読み上げコンテンツ → システムの声 → 声を管理 → 日本語のプレミアム／拡張音声を追加。</p>
            <p style={{ margin: '4px 0' }}><b>Windows</b>：Microsoft Edgeで開くと「Microsoft Nanami Online (Natural)」などの自然な声が使えます。</p>
            <p className="muted" style={{ margin: '4px 0' }}>収録済みの講義音声ファイルが配置されている場合は、端末の声より優先して再生されます（授業画面に表示）。</p>
          </div>
        </details>
      </div>

      <div className="sec-h"><span className="en">DATA</span><h2>学習データ</h2></div>
      <div className="card" style={{ padding: '6px 20px' }}>
        <div className="set-row">
          <div className="l"><b>保存場所</b><small>この端末のブラウザ（localStorage）。ブラウザを閉じても残ります。</small></div>
          <span className="pill">回答 {s.answers.length}件</span>
        </div>
        <div className="set-row">
          <div className="l"><b>エクスポート</b><small>学習履歴をJSONファイルとして保存（バックアップ・移行用）</small></div>
          <button className="btn sm" onClick={exportData}>JSONを書き出す</button>
        </div>
        <div className="set-row">
          <div className="l"><b>学習データをリセット</b><small>回答・履歴・進捗をすべて消去します（設定は残ります）</small></div>
          {!confirm ? <button className="btn sm" onClick={() => setConfirm(true)}>リセット…</button> : (
            <span className="chips">
              <button className="btn sm eosin" onClick={() => { store.reset(); setConfirm(false); setMsg('学習データを消去しました'); }}>本当に消去する</button>
              <button className="btn sm" onClick={() => setConfirm(false)}>やめる</button>
            </span>
          )}
        </div>
        {msg && <p role="status" style={{ color: 'var(--ok)', fontWeight: 700 }}>{msg}</p>}
      </div>
    </>
  );
}
