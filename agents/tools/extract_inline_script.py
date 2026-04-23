#!/usr/bin/env python3
"""Print the main inline application script from index.html to stdout."""

from pathlib import Path
import sys


def main() -> int:
    if len(sys.argv) != 2:
        print("usage: extract_inline_script.py <html-file>", file=sys.stderr)
        return 1

    html = Path(sys.argv[1]).read_text(encoding="utf-8")
    start_marker = "    <script>\n"
    end_marker = "\n    </script>"

    start = html.find(start_marker)
    if start == -1:
        raise SystemExit("inline script start marker not found")

    start += len(start_marker)
    end = html.find(end_marker, start)
    if end == -1:
        raise SystemExit("inline script end marker not found")

    sys.stdout.write(html[start:end])
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
