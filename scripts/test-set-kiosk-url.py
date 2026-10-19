#!/usr/bin/env python3
"""Host-only URL character-guard checks. Run with Python 3 and Bash installed.

Reads set-kiosk-url.sh as data. Never sources or runs it or any device branch.
The extracted function must match the reviewed pure-function shape exactly;
changes to that shape require reviewing this safety gate before updating it.
"""

from pathlib import Path
import re
import subprocess
import unittest


SOURCE = Path(__file__).with_name("set-kiosk-url.sh").read_text(encoding="utf-8")
MATCHES = re.findall(
    r"^url_has_only_allowed_chars\(\) \{\n.*?^\}\n",
    SOURCE,
    flags=re.MULTILINE | re.DOTALL,
)
REVIEWED_FUNCTION = """url_has_only_allowed_chars() {
  local LC_ALL=C
  local allowed='^[A-Za-z0-9./:?=%~_+,#@&-]+$'
  [[ $1 =~ $allowed ]]
}
"""
if MATCHES != [REVIEWED_FUNCTION]:
    raise RuntimeError("Validator is missing, duplicated, or changed; review before running")

# Only the source-extracted, shape-checked function enters the Bash process.
# Test input is positional data, never interpolated into shell program text.
PROGRAM = (
    "set -euo pipefail\n" + MATCHES[0]
    + 'if url_has_only_allowed_chars "$1"; then exit 0; else exit 1; fi\n'
)


class UrlCharactersTest(unittest.TestCase):
    def accepts(self, value):
        result = subprocess.run(
            ["bash", "--noprofile", "--norc", "-c", PROGRAM, "validator-test", value],
            env={"PATH": "/usr/bin:/bin", "LC_ALL": "C"},
            capture_output=True,
            timeout=5,
            check=False,
        )
        self.assertIn(result.returncode, (0, 1), result.stderr)
        self.assertEqual(result.stdout, b"")
        self.assertEqual(result.stderr, b"")
        return result.returncode == 0

    def test_allowed_url_characters(self):
        for value in (
            "http://example.test/",
            "https://example.test:8443/a-b_C.~+,%20?x=1&y=2#@tag",
            "https://example.test/%0A%0D%27",
        ):
            with self.subTest(value=value):
                self.assertTrue(self.accepts(value))

    def test_literal_line_feed_at_each_position(self):
        for value in ("\nhttps://example.test/", "https://example.test/a\nb", "https://example.test/\n"):
            with self.subTest(value=value):
                self.assertFalse(self.accepts(value))

    def test_other_disallowed_characters(self):
        for char in ("\r", "\t", " ", "'", '"', "\\", ";", "|", "`", "$", "(", ")", "é"):
            with self.subTest(char=char):
                self.assertFalse(self.accepts("https://example.test/a" + char + "b"))

    def test_long_input(self):
        value = "https://example.test/" + "a" * 32768
        self.assertTrue(self.accepts(value))
        self.assertFalse(self.accepts(value + "'"))
        self.assertFalse(self.accepts(value + "\n"))

    def test_empty_input(self):
        self.assertFalse(self.accepts(""))

    def test_guard_is_used_after_unchanged_scheme_check(self):
        self.assertIn('''url=$1
case "$url" in
  http://*|https://*) ;;
  *) echo "URL must start with http:// or https://" >&2; exit 1 ;;
esac
''', SOURCE)
        self.assertEqual(SOURCE.count('if ! url_has_only_allowed_chars "$url"; then'), 1)
        self.assertLess(SOURCE.index('case "$url" in'), SOURCE.index('if ! url_has_only_allowed_chars "$url"; then'))


if __name__ == "__main__":
    unittest.main()
