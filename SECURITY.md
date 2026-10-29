# Security

Start with [Frame security](docs/security.md) before connecting a frame to a network or adding
private photos, accounts or dashboard credentials. It collects known risks and a verification
workflow for owners and agents. Hardware reports describe particular units; they do not certify
other firmware or provide a vendor security-support commitment.

## Reporting vulnerabilities

For a new vulnerability in this repository's scripts, kiosk or dashboard, use GitHub's
**Security → Advisories → Report a vulnerability** if the repository offers it. Otherwise,
ask the maintainers for a private security contact, without posting exploit details or secrets.
A `SECURITY.md` file does not enable private reporting; see
[GitHub's reporting instructions](https://docs.github.com/en/code-security/how-tos/report-and-fix-vulnerabilities/report-privately).

For vendor firmware, contact the vendor's security channel where available. Publicly disclosed
findings can be linked from the device report and the [known-risk index](docs/security.md#known-risks-and-advisories).
Do not attribute a vendor issue to this project's software or invent a CVE, affected-version
range or malware classification.

Share the affected component/version, expected and observed behavior, a minimal reproducer,
impact and any tested mitigation. Redact device identifiers, account details and credentials.
Keep firmware dumps, vendor binaries and personal photos out of public issues and PRs.
