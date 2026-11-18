"""
End-to-end API evaluation script for CTI RAG Assistant v2.0.
Tests GET /api/health and POST /api/query through the live Cloudflare tunnel
and saves round-trip latency, server latency, citation counts, and abstention
checks to evaluation/results/api_evaluation_results.csv.

Usage:
    python evaluation/run_api_evaluation.py \
        --backend https://<random-words>.trycloudflare.com \
        --key <your-access-key>
"""

import argparse
import csv
import json
import os
import re
import time
from pathlib import Path
import requests

CITATION_PATTERN = re.compile(r"\[(?:S|C|V|R|L)\d+\]")
NOT_FOUND_PHRASE = "not found in the selected datasets or live api results"


def strip_footer(answer: str) -> str:
    return re.split(r"\n\n### Dataset citations|\n\n---\n\*Processing", answer or "", maxsplit=1)[0]


def main() -> None:
    parser = argparse.ArgumentParser(description="Run end-to-end API evaluation against Colab backend.")
    parser.add_argument("--backend", required=True, help="Cloudflare tunnel URL (e.g., https://xxx.trycloudflare.com)")
    parser.add_argument("--key", required=True, help="CTI_ACCESS_KEY printed by the Colab serving cell")
    parser.add_argument(
        "--questions",
        default=str(Path(__file__).parent / "eval_questions.json"),
        help="Path to evaluation questions JSON file",
    )
    parser.add_argument(
        "--output",
        default=str(Path(__file__).parent / "results" / "api_evaluation_results.csv"),
        help="Output CSV path",
    )
    parser.add_argument("--live-api", action="store_true", help="Enable live ThreatCluster API during evaluation")
    args = parser.parse_args()

    backend_url = args.backend.strip().rstrip("/")
    headers = {
        "Content-Type": "application/json",
        "X-Access-Key": args.key.strip(),
    }

    print(f"Checking backend health at {backend_url}/api/health ...")
    health_resp = requests.get(f"{backend_url}/api/health", headers=headers, timeout=20)
    health_resp.raise_for_status()
    health_data = health_resp.json()
    print("Health OK:", json.dumps(health_data))

    with open(args.questions, "r", encoding="utf-8") as f:
        questions = json.load(f)

    results_rows = []
    for item in questions:
        qid = item["id"]
        category = item["category"]
        mode = item.get("mode", "cti")
        question_text = item["question"]
        expected = item.get("expected_behavior", "ground_and_cite")

        print(f"\nRunning [{qid}] ({category}, mode={mode})...")
        payload = {
            "question": question_text,
            "mode": mode,
            "use_live_api": bool(args.live_api),
            "history": [],
        }

        t0 = time.perf_counter()
        resp = requests.post(f"{backend_url}/api/query", headers=headers, json=payload, timeout=120)
        round_trip_s = round(time.perf_counter() - t0, 3)
        resp.raise_for_status()
        data = resp.json()

        answer_md = data.get("answer_markdown", "")
        server_s = data.get("timings", {}).get("server_seconds")
        network_overhead_s = round(round_trip_s - float(server_s), 3) if server_s is not None else None

        body_only = strip_footer(answer_md)
        citations = CITATION_PATTERN.findall(body_only)
        abstained = NOT_FOUND_PHRASE in body_only.lower()

        if expected == "abstain":
            auto_pass = abstained
        elif expected == "triage_indicators":
            auto_pass = "email triage result" in body_only.lower()
        else:
            auto_pass = len(citations) > 0 and not abstained

        print(
            f"  Done in {round_trip_s}s (server: {server_s}s) | "
            f"citations: {len(citations)} | abstained: {abstained} | auto_check: {auto_pass}"
        )

        results_rows.append({
            "id": qid,
            "category": category,
            "mode": mode,
            "expected_behavior": expected,
            "round_trip_seconds": round_trip_s,
            "server_seconds": server_s,
            "network_overhead_seconds": network_overhead_s,
            "citation_count": len(citations),
            "unique_citations": ",".join(dict.fromkeys(citations)),
            "abstained": abstained,
            "auto_check_passed": auto_pass,
            "question": question_text.replace("\n", " "),
            "answer_preview": body_only[:400].replace("\n", " "),
            "manual_correctness_0_to_2": "",
            "manual_grounding_0_to_2": "",
            "manual_relevance_0_to_2": "",
            "reviewer_notes": "",
        })

    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, "w", newline="", encoding="utf-8") as csvfile:
        writer = csv.DictWriter(csvfile, fieldnames=list(results_rows[0].keys()))
        writer.writeheader()
        writer.writerows(results_rows)

    print(f"\nSaved {len(results_rows)} evaluation records to {output_path}")


if __name__ == "__main__":
    main()