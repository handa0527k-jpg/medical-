#!/usr/bin/env bash
# 音声合成・評価のモデルを HuggingFace から models/ にダウンロードする（済んでいるファイルは飛ばす）。
# 合計約3.5 GB。ライセンス：JVNV モデル CC BY-SA 4.0／小春音アミ・あみたろ 利用規約とクレジット表記／
# deberta-v2-large-japanese-char-wwm CC BY-SA 4.0／Kokoro-82M Apache-2.0／faster-whisper small MIT
set -euo pipefail
cd "$(dirname "$0")/../models" 2>/dev/null || { mkdir -p "$(dirname "$0")/../models"; cd "$(dirname "$0")/../models"; }
dl(){ mkdir -p "$(dirname "$2")"; [ -s "$2" ] || curl -sSL --retry 4 -o "$2" "https://huggingface.co/$1/resolve/main/$3"; echo "ok $2"; }
for v in F1 F2 M1 M2; do d=jvnv-$v-jp; for f in config.json style_vectors.npy; do dl litagin/style_bert_vits2_jvnv sbv2/$d/$f $d/$f; done; done
dl litagin/style_bert_vits2_jvnv sbv2/jvnv-F1-jp/jvnv-F1-jp_e160_s14000.safetensors jvnv-F1-jp/jvnv-F1-jp_e160_s14000.safetensors
dl litagin/style_bert_vits2_jvnv sbv2/jvnv-F2-jp/jvnv-F2_e166_s20000.safetensors jvnv-F2-jp/jvnv-F2_e166_s20000.safetensors
dl litagin/style_bert_vits2_jvnv sbv2/jvnv-M1-jp/jvnv-M1-jp_e158_s14000.safetensors jvnv-M1-jp/jvnv-M1-jp_e158_s14000.safetensors
dl litagin/style_bert_vits2_jvnv sbv2/jvnv-M2-jp/jvnv-M2-jp_e159_s17000.safetensors jvnv-M2-jp/jvnv-M2-jp_e159_s17000.safetensors
for m in koharune-ami amitaro; do r=litagin/sbv2_${m//-/_}; for f in config.json style_vectors.npy $m.safetensors; do dl $r sbv2/$m/$f $m/$f; done; done
for f in config.json model.safetensors special_tokens_map.json tokenizer_config.json vocab.txt; do dl ku-nlp/deberta-v2-large-japanese-char-wwm bert/deberta-v2-large-japanese-char-wwm/$f $f; done
dl fastrtc/kokoro-onnx kokoro/kokoro-v1.0.onnx kokoro-v1.0.onnx
dl fastrtc/kokoro-onnx kokoro/voices-v1.0.bin voices-v1.0.bin
for f in config.json model.bin tokenizer.json vocabulary.txt; do dl Systran/faster-whisper-small whisper-small/$f $f; done
