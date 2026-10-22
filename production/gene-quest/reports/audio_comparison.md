# 音声合成モデルの比較（自動指標）

同じ8文（医学用語4文・会話4文）を各モデルで合成した。CER は Whisper small の書き起こしと台本のかな換算の文字誤り率。
F0 sd は抑揚の大きさの目安（半音）。RTF は CPU（4コア）での処理時間 / 音声長。

| エンジン | 声 | CER（医学用語4文） | CER（会話4文） | 話速 mora/s | F0 sd | RTF | 備考 |
|---|---|---|---|---|---|---|---|
| sbv2 | jvnv-F1-jp | 0.142 | 0.079 | 6.6 | 3.14 | 0.357 | |
| sbv2 | jvnv-F2-jp | 0.130 | 0.105 | 6.5 | 3.21 | 0.268 | |
| sbv2 | jvnv-M1-jp | 0.128 | 0.118 | 6.4 | 3.98 | 0.283 | |
| sbv2 | jvnv-M2-jp | 0.140 | 0.025 | 7.3 | 4.29 | 0.306 | |
| sbv2 | amitaro | 0.212 | 0.103 | 7.2 | 5.09 | 0.282 | |
| sbv2 | koharune-ami | 0.133 | 0.087 | 6.8 | 3.71 | 0.283 | |
| kokoro | jf_alpha | 0.056 | 0.073 | 6.7 | 3.54 | 0.208 | |
| kokoro | jf_gongitsune | 0.074 | 0.131 | 5.2 | 3.31 | 0.175 | |
| kokoro | jf_nezumi | 0.067 | 0.107 | 5.1 | 2.62 | 0.181 | |
| kokoro | jf_tebukuro | 0.085 | 0.062 | 5.4 | 3.28 | 0.180 | |
| kokoro | jm_kumo | 0.123 | 0.122 | 6.3 | 2.84 | 0.188 | |
| edge | ja-JP-NanamiNeural | – | – | – | – | – | 使用不可：ClientConnectorCertificateError: Cannot connect to host speech.platform.bing.com:443 ssl:True [SSLCertVerificationError: (1, '[SSL: CERTIFICATE_VERIFY_FA |

## 参照なし品質推定（torchaudio SQUIM）

| エンジン | 声 | STOI推定 | PESQ推定 | SI-SDR推定 | MOS推定 |
|---|---|---|---|---|---|
| kokoro | jf_alpha | 0.979 | 3.58 | 23.8 | 4.60 |
| kokoro | jf_gongitsune | 0.997 | 3.83 | 27.7 | 4.35 |
| kokoro | jf_nezumi | 0.995 | 4.02 | 26.8 | 4.79 |
| kokoro | jf_tebukuro | 0.984 | 4.00 | 27.6 | 4.80 |
| kokoro | jm_kumo | 0.996 | 3.91 | 25.4 | 4.70 |
| sbv2 | amitaro | 0.972 | 3.11 | 18.9 | 4.36 |
| sbv2 | jvnv-F1-jp | 0.962 | 3.85 | 25.6 | 4.71 |
| sbv2 | jvnv-F2-jp | 0.973 | 3.90 | 27.1 | 4.70 |
| sbv2 | jvnv-M1-jp | 0.995 | 3.84 | 25.2 | 4.71 |
| sbv2 | jvnv-M2-jp | 0.993 | 3.65 | 23.1 | 4.75 |
| sbv2 | koharune-ami | 0.967 | 3.80 | 28.3 | 4.71 |
