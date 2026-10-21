#!/usr/bin/env python3
"""Small SQLite check for the D1-compatible schema, seed and trigger."""

import sqlite3
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


def main() -> None:
    unseeded = sqlite3.connect(":memory:")
    unseeded.executescript((ROOT / "schema.sql").read_text(encoding="utf-8"))
    unseeded.execute(
        """
        INSERT INTO view_events
          (path, bucket, visitor_hash, client_hash, created_at)
        VALUES (?, ?, ?, ?, ?)
        """,
        ("/posts/unseeded/", 123, "1" * 64, "2" * 64, 1_700_000_000),
    )
    assert unseeded.execute(
        "SELECT total FROM view_counts WHERE path = '@site'"
    ).fetchone()[0] == 363843

    database = sqlite3.connect(":memory:")
    database.executescript((ROOT / "schema.sql").read_text(encoding="utf-8"))
    database.executescript((ROOT / "seed.sql").read_text(encoding="utf-8"))
    database.executescript((ROOT / "page-seed.sql").read_text(encoding="utf-8"))

    seeded_page_total = database.execute(
        "SELECT total FROM view_counts WHERE path = '/posts/chunked-kv-cache-compression/'"
    ).fetchone()[0]
    assert seeded_page_total == 115, seeded_page_total

    database.execute(
        """
        INSERT OR IGNORE INTO view_events
          (path, bucket, visitor_hash, client_hash, created_at)
        VALUES (?, ?, ?, ?, ?)
        """,
        (
            "/posts/chunked-kv-cache-compression/",
            123,
            "e" * 64,
            "f" * 64,
            1_700_000_000,
        ),
    )

    event = ("/posts/demo/", 123, "a" * 64, "b" * 64, 1_700_000_000)
    database.execute(
        """
        INSERT OR IGNORE INTO view_events
          (path, bucket, visitor_hash, client_hash, created_at)
        VALUES (?, ?, ?, ?, ?)
        """,
        event,
    )
    database.execute(
        """
        INSERT OR IGNORE INTO view_events
          (path, bucket, visitor_hash, client_hash, created_at)
        VALUES (?, ?, ?, ?, ?)
        """,
        event,
    )
    database.execute(
        """
        INSERT OR IGNORE INTO view_events
          (path, bucket, visitor_hash, client_hash, created_at)
        VALUES (?, ?, ?, ?, ?)
        """,
        ("/posts/demo/", 123, "c" * 64, "d" * 64, 1_700_000_001),
    )

    rows = dict(database.execute("SELECT path, total FROM view_counts"))
    assert rows["@site"] == 363845, rows
    assert rows["/posts/demo/"] == 2, rows
    assert rows["/posts/chunked-kv-cache-compression/"] == 116, rows

    # The seed is safe to run again after traffic has arrived.
    database.executescript((ROOT / "seed.sql").read_text(encoding="utf-8"))
    total = database.execute(
        "SELECT total FROM view_counts WHERE path = '@site'"
    ).fetchone()[0]
    assert total == 363845, total

    # Re-seeding page history also preserves views accumulated after launch.
    database.executescript((ROOT / "page-seed.sql").read_text(encoding="utf-8"))
    seeded_page_total = database.execute(
        "SELECT total FROM view_counts WHERE path = '/posts/chunked-kv-cache-compression/'"
    ).fetchone()[0]
    assert seeded_page_total == 116, seeded_page_total
    print("schema/seed/trigger test passed")


if __name__ == "__main__":
    main()
