import { describe, expect, it } from 'vitest';
import { toSpeech, sentences, estimateDuration } from '../src/engine/speech/reading';

describe('toSpeech', () => {
  it('strips markup and reads abbreviations, units and symbols', () => {
    expect(toSpeech('<b>rER</b>の直径は約25 nm')).toBe('粗面小胞体の直径は約25ナノメートル');
    expect(toSpeech('mRNAとtRNA')).toBe('メッセンジャーアールエヌエーとティーアールエヌエー');
    expect(toSpeech('1万×g：ミト・リソ')).toBe('1万ジー、ミトコンドリアとリソソーム');
    expect(toSpeech('リソソーム（pH<5）')).toBe('リソソーム、ペーハー5未満');
    expect(toSpeech('β酸化とγチュブリン')).toBe('ベータ酸化とガンマチュブリン');
  });
  it('gives kana readings for commonly misread terms', () => {
    expect(toSpeech('小胞体の内腔')).toBe('小胞体のないくう');
    expect(toSpeech('被覆陥凹')).toBe('ひふくかんおう');
    expect(toSpeech('最後の上清')).toBe('最後のじょうせい');
  });
  it('turns brackets and arrows into natural pauses', () => {
    expect(toSpeech('細胞質側の葉（P面）には粒が残る')).toBe('細胞質側のよう、ピー面には粒が残る');
    expect(toSpeech('小さい → 膜を通過')).toBe('小さい、膜を通過');
    expect(toSpeech('門番の正体――膜は“流れる壁”')).toBe('門番の正体、膜は流れる壁');
  });
  it('splits sentences and estimates duration', () => {
    expect(sentences('一つ。二つ！三つ？')).toEqual(['一つ。', '二つ！', '三つ？']);
    expect(estimateDuration('あいうえお')).toBeGreaterThanOrEqual(1.6);
  });
});

describe('sentences', () => {
  it('keeps closing brackets with their sentence', () => {
    expect(sentences('問いを持とう。「なぜ違う場所で働くのか？」次へ。')).toEqual(['問いを持とう。', '「なぜ違う場所で働くのか？」', '次へ。']);
  });
});
