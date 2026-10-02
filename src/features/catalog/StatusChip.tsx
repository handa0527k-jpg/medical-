import { LECTURE_STATUS_LABEL, STATUS_LABEL, type Status } from '../../state/catalog';

/** 未学習 / 学習中 / 完了 (courses) or 未視聴 / 学習中 / 完了 (lectures). */
export function StatusChip({ status, lecture, pct }: { status: Status; lecture?: boolean; pct?: number }) {
  const label = (lecture ? LECTURE_STATUS_LABEL : STATUS_LABEL)[status];
  return (
    <span className={'st-chip ' + status}>
      <i aria-hidden="true" />
      {label}
      {status === 'active' && pct !== undefined && pct > 0 && <small>{pct}%</small>}
    </span>
  );
}
