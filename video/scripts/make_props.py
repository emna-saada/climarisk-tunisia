"""Build video/public/props.json, the English voice-over (Piper TTS) and subtitles.

Every figure spoken or shown in the video is read from ../outputs/kpis.json (pipeline output).
Usage (from video/):  ../.venv/bin/python scripts/make_props.py
"""
from __future__ import annotations

import json
import math
import subprocess
import wave
from pathlib import Path

import pandas as pd

VIDEO = Path(__file__).resolve().parents[1]
ROOT = VIDEO.parent
PUB = VIDEO / "public"
FPS = 30
SEC_EN = {"cereals": "Cereals", "olives": "Olives", "citrus": "Citrus", "agrifood": "Agrifood", "textile": "Textile",
          "tourism": "Coastal tourism", "residential": "Housing", "construction": "Construction",
          "chemicals": "Chemicals and phosphates", "energy": "Energy"}
VOICE = VIDEO / "voice_model/en_US-ljspeech-high.onnx"


def en(x: float, d: int = 1) -> str:
    return f"{x:.{d}f}"


def main() -> None:
    k = json.loads((ROOT / "outputs/kpis.json").read_text(encoding="utf-8"))
    P = k["periods"]
    labels = {"baseline": "Today", "ssp245_2030": "SSP2-4.5 · 2030", "ssp245_2050": "SSP2-4.5 · 2050",
              "ssp585_2030": "SSP5-8.5 · 2030", "ssp585_2050": "SSP5-8.5 · 2050"}
    sh0 = 100 * P["baseline"]["share_ead_high"]["med"]
    sh5 = 100 * P["ssp585_2050"]["share_ead_high"]["med"]
    el5 = P["ssp585_2050"]["el_add_tnd"]["med"] / 1e6
    bp5 = P["ssp585_2050"]["el_add_bp"]["med"]
    vt5 = P["ssp585_2050"]["el_add_vs_today_tnd"]["med"] / 1e6
    n_words = {2000: "two thousand"}.get(k["meta"]["n_loans"], str(k["meta"]["n_loans"]))
    assets = pd.read_parquet(ROOT / "outputs/asset_results.parquet")
    sl = assets.drop_duplicates("sector").set_index("sector")["sector_label"].to_dict()
    top = sorted(k["by_sector"]["ssp585_2050"].items(), key=lambda kv: -kv[1]["el_add_bp_med"])[:2]
    top_txt = f"{SEC_EN[top[0][0]]} and {SEC_EN[top[1][0]].lower()}"

    scenes = [
        ("hook", 15, "When the climate shifts, credit risk shifts with it. This is ClimaRisk Tunisia: "
                     "a map of the physical climate risk inside a bank loan portfolio."),
        ("origin", 25, "The floods in Nabeul in 2018, droughts that hit the cereal harvest, record heat. "
                       "The assets that Tunisian banks finance are exposed. In November 2026, according to the "
                       "Tunisian press, the central bank launched a roadmap on green finance and climate risk "
                       "for 2026 to 2030. This project sits where banking risk meets climate change."),
        ("regulation", 25, "The rules have been built step by step: the Basel principles in 2022, the IFRS S2 "
                           "standard in 2023, phase five of the NGFS scenarios in 2024, the European Banking "
                           "Authority guidelines and the voluntary Basel disclosure framework in 2025, then the "
                           "Tunisian roadmap. The tool helps banks prepare. It does not claim compliance."),
        ("method", 25, "The data are fully open: NASA climate projections, WRI flood maps, ESA land cover and "
                       "WorldPop population. For each loan, the method combines hazard, exposure and the "
                       "vulnerability of its sector, then adjusts the probability of default and the expected "
                       "loss. The portfolio of " + n_words + " loans is entirely synthetic."),
        ("results", 39, f"The result: the share of the loan book in a high-hazard zone rises from {en(sh0)} percent "
                        f"today to {en(sh5)} percent in 2050, under the high-emissions scenario. The extra expected "
                        f"loss reaches {en(el5)} million dinars, or {en(bp5, 0)} basis points of the book, "
                        f"{en(vt5)} million more than today. These figures describe a synthetic portfolio. "
                        f"{top_txt} are the most affected sectors, and the spread between climate models remains wide."),
        ("showcase", 26, "The website tells the story on a single map, then lets you switch scenarios, explore the "
                         "governorates and sectors, and download the working paper and the data."),
        ("outro", 15, "These figures are illustrative and must be calibrated on real bank data. ClimaRisk Tunisia, "
                      "an open-source project by Emna Saada, in geoinformatics."),
    ]

    (PUB / "voice").mkdir(parents=True, exist_ok=True)
    out_scenes, srt, t0 = [], [], 0.0
    for i, (sid, target, text) in enumerate(scenes):
        wav = PUB / "voice" / f"{i:02d}_{sid}.wav"
        subprocess.run([str(ROOT / ".venv/bin/piper"), "-m", str(VOICE), "-f", str(wav),
                        "--length-scale", "1.0", "--sentence-silence", "0.25"], input=text.encode(), check=True,
                       capture_output=True)
        with wave.open(str(wav)) as w:
            dur = w.getnframes() / w.getframerate()
        scene_s = max(target, dur + 1.6)
        out_scenes.append({"id": sid, "text": text, "audio": f"voice/{wav.name}", "audioSeconds": dur,
                           "durationInFrames": math.ceil(scene_s * FPS)})
        # subtitles: split on sentence boundaries, distribute time by length
        parts = [s.strip() for s in text.replace(" : ", " : |").replace(". ", ".|").split("|") if s.strip()]
        total = sum(len(p) for p in parts)
        t = t0 + 0.6
        for p in parts:
            d = dur * len(p) / total
            srt.append((t, t + d, p))
            t += d
        t0 += scene_s

    def ts(x):
        h, m, s = int(x // 3600), int(x % 3600 // 60), x % 60
        return f"{h:02d}:{m:02d}:{int(s):02d},{int((s % 1) * 1000):03d}"

    (VIDEO / "out").mkdir(exist_ok=True)
    (VIDEO / "out/climarisk_demo.srt").write_text(
        "\n".join(f"{i + 1}\n{ts(a)} --> {ts(b)}\n{txt}\n" for i, (a, b, txt) in enumerate(srt)), encoding="utf-8")

    # Tunisia outline projected to a 600x1000 SVG box (equirectangular, cos(lat) scaling)
    gj = json.loads((ROOT / "data/raw/tun_adm1.geojson").read_text(encoding="utf-8"))
    lon0, lon1, lat0, lat1 = 7.4, 11.7, 30.2, 37.6
    kx = math.cos(math.radians(34))
    W, H = 600, 1000
    sx = W / ((lon1 - lon0) * kx)
    sy = H / (lat1 - lat0)
    s = min(sx, sy)

    def proj(lon, lat):
        return round((lon - lon0) * kx * s, 1), round((lat1 - lat) * s, 1)

    paths = []
    gov_el = k["by_governorate"]["ssp585_2050"]
    gov_heat = assets[assets.period == "ssp585_2050"].groupby("governorate")["heat"].mean().to_dict()
    for f in gj["features"]:
        geom = f["geometry"]
        polys = geom["coordinates"] if geom["type"] == "MultiPolygon" else [geom["coordinates"]]
        d = ""
        for poly in polys:
            ring = poly[0][::2] if len(poly[0]) > 400 else poly[0]
            pts = [proj(x, y) for x, y in ring]
            d += "M" + "L".join(f"{x},{y}" for x, y in pts) + "Z"
        name = f["properties"]["shapeName"]
        paths.append({"name": name, "d": d, "el_bp": gov_el.get(name, {}).get("el_add_bp_med", 0),
                      "heat": gov_heat.get(name, 0)})

    pts = []
    sample = assets[assets.period.isin(["baseline", "ssp585_2050"])].pivot_table(
        index=["loan_id", "lon", "lat", "ead_tnd"], columns="period", values="composite").reset_index()
    for r in sample.sample(900, random_state=1).itertuples():
        x, y = proj(r.lon, r.lat)
        pts.append({"x": x, "y": y, "r": round(2 + 7 * math.sqrt(r.ead_tnd / sample.ead_tnd.max()), 1),
                    "s0": round(r.baseline, 3), "s1": round(r.ssp585_2050, 3)})

    hm = k["heatmap_sector_hazard"]["ssp585_2050"]
    props = {
        "fps": FPS, "scenes": out_scenes, "svg": {"w": round((lon1 - lon0) * kx * s), "h": round((lat1 - lat0) * s),
                                                  "paths": paths, "points": pts},
        "kpi": {"share0": sh0, "share5": sh5, "share5_p10": 100 * P["ssp585_2050"]["share_ead_high"]["p10"],
                "share5_p90": 100 * P["ssp585_2050"]["share_ead_high"]["p90"], "el5": el5, "bp5": bp5,
                "el5_p10": P["ssp585_2050"]["el_add_tnd"]["p10"] / 1e6,
                "el5_p90": P["ssp585_2050"]["el_add_tnd"]["p90"] / 1e6, "vt5": vt5,
                "n": k["meta"]["n_loans"], "ngov": k["meta"]["n_governorates"],
                "ead": k["meta"]["total_ead_tnd"] / 1e9,
                "hot0": k["hazard_means"]["baseline"]["hot35_days"],
                "hot5": k["hazard_means"]["ssp585_2050"]["hot35_days"],
                "pr5": k["hazard_means"]["ssp585_2050"]["prchange_pct"]},
        "periods": [{"key": p, "label": labels[p], "med": P[p]["el_add_tnd"]["med"] / 1e6,
                     "p10": P[p]["el_add_tnd"]["p10"] / 1e6, "p90": P[p]["el_add_tnd"]["p90"] / 1e6,
                     "share": 100 * P[p]["share_ead_high"]["med"]}
                    for p in ["baseline", "ssp245_2030", "ssp245_2050", "ssp585_2030", "ssp585_2050"]],
        "heatmap": {"rows": [SEC_EN[s] for s in hm], "cols": ["Heat", "Drought", "Flood", "Wildfire"],
                    "values": [[round(hm[s][h], 2) for h in ("heat", "drought", "flood", "fire")] for s in hm]},
        "disclaimer": "100 % synthetic portfolio: illustrative figures, to be calibrated on real bank data.",
    }
    (PUB / "props.json").write_text(json.dumps(props, ensure_ascii=False), encoding="utf-8")
    total = sum(sc["durationInFrames"] for sc in out_scenes) / FPS
    print(f"props.json written · {len(out_scenes)} scenes · {total:.1f} s")
    for sc in out_scenes:
        print(f"  {sc['id']:<11} audio {sc['audioSeconds']:5.1f}s  scene {sc['durationInFrames'] / FPS:5.1f}s")


if __name__ == "__main__":
    main()
