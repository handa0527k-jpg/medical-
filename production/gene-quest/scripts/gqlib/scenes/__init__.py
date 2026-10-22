"""各章の映像。モジュールを読み込むと @visual で描画関数が登録される。"""
import importlib
import pkgutil

for _m in pkgutil.iter_modules(__path__):
    importlib.import_module(f"{__name__}.{_m.name}")
