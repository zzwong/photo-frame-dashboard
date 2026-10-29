# Frame security

Treat a newly acquired frame as an untrusted appliance. Firmware may expose root access,
run privileged vendor software or depend on an obsolete Android build. A modern launcher,
browser or WebView updates that component; the kernel, vendor services and trust configuration
need their own assessment.

Use the [device index](devices.md), existing [write/backup rules](../README.md#rules-we-learned-the-hard-way)
and [private frame records](frame-records.md). Confirm the model, firmware fingerprint and
current access path before applying a device-specific fix.

## Known risks and advisories

These are pointers to public evidence, not a universal affected-device list. Check current
primary advisories before relying on a version or mitigation. New entries should identify the
affected component/build, evidence, tested mitigation and undo, remaining risk and untested cases.

| Finding | Evidence and scope | What to establish on the selected frame |
| --- | --- | --- |
| Root ADB, permissive `su` or public signing keys | [C-2 access](joyhong-c2-a133.md#access-out-of-the-box), [XORO root](xoro-cpf10pf.md#adb-and-root) | USB/network authentication, listening interfaces, key ownership, `su` permissions and app-context access. Root shell or a permission bit alone does not establish every app's access under SELinux. |
| Hidden privileged background software | [Runxion `iotv` observations](runxion-zn-dp1002-rk3126.md#hidden-root-agent-iotv), [public analysis #205](https://github.com/wesbos/photo-frame-dashboard/issues/205) | Match binary hashes, process ownership, startup mechanism and actual network connections. A filename, driver or package name alone is not a malware diagnosis. |
| Vendor update/boot dependencies | [C-2 FOTA hook](joyhong-c2-a133.md#the-vendor-fota-boot-hook-read-this-before-disabling-anything), [Skylight app-update analysis](app-updates.md) | Which component downloads/installs updates, its privileges and whether Android depends on it at boot. Disabling the entire C-2 FOTA package broke every Activity; use only the matching report's tested component change. |
| Compromised eMudhra intermediate CAs | [Google advisory](https://blog.google/security/protecting-chrome-and-android-users-from-compromised-emudhra-intermediate-ca-certificates/), [Mozilla advisory](https://blog.mozilla.org/security/2026/10/20/protecting-firefox-users-following-the-compromise-of-emudhra-intermediate-certificates/), [frame findings #229](https://github.com/wesbos/photo-frame-dashboard/issues/229) | The trust path used by each app, available blocklist updates and actual rejection of affected chains. Chrome, WebView and native apps can have different update/trust paths. Root presence is an exposure indicator, not proof of successful TLS acceptance. |

Google distributed Android blocks through Google Play services. A frame without that channel
needs separate verification. The [incident's chain fixtures and mitigations](https://emudhra.we-have-a-problem.com/)
cover both emSign and AAA Certificate Services paths. Distrusting a root can break unrelated
sites: identify the exact certificates, preserve undo and test the frame's required services.
Do not disable every certificate from an issuer or replace the entire trust store blindly.

## Before network access

- Agree on the frame's purpose and allowed destinations. Prefer a dedicated guest/IoT segment
  with router/AP-enforced separation from workstations, NAS, management interfaces and peers.
  Verify what the network actually blocks, including IPv6 and cross-client traffic; an SSID name
  or DNS filter is not evidence of isolation. Limit outbound access to the required services,
  DNS and time sources; assess unexpected vendor/proxy connections before allowing more.
- Keep ADB and management ports off the public internet. Restrict required maintenance access
  to trusted hosts. A VPN/tailnet still needs access controls and working device authentication.
- Start without personal data or primary accounts. Use synthetic content, per-frame read-only
  credentials and narrowly shared albums/calendars. Keep operator/admin keys off the frame.
- Preserve a management path independent of the change being tested. Prove Settings → Apps
  and a return to Home by touch before disabling the app that currently provides access.

A rooted frame can change its own firewall. Use router/AP enforcement for containment; a
frame-local firewall is an additional layer. Existing firewall scripts are model-specific
examples, not an isolation certificate: check their LAN, IPv6, multicast and management allowances.

## Assess, change, verify

1. **Capture a read-only baseline.** Record Android/security-patch level, active WebView/browser,
   installed privileged apps, root/SELinux state, USB/network ADB settings, listeners, startup
   hooks, time and trust configuration. Correlate suspicious traffic with its owning process
   and boot mechanism. Store raw diagnostics privately; redact them before sharing.
2. **Prepare a narrow change and undo.** Follow the owner's authorized scope and the repository's
   write/backup rules. Record exact affected components/artifact hashes and prior values.
   Reconcile updates with the tested model, ABI, signatures and boot dependencies. Recovery
   entry and full restore remain separate claims from having a verified backup.
3. **Verify supply-chain provenance.** Use official sources and pin downloaded bytes. Check APK
   package, ABI, minimum Android version and signer before installation. If a matching public
   AOSP key is needed for re-signing, first verify the original source and hash; the new local
   signature only proves local packaging. Keep factory/known-good artifacts for rollback.
   Resolve clock/trust errors instead of bypassing HTTPS certificate or hostname checks.
4. **Apply one reviewed change.** Avoid blanket debloat lists, global trust changes and copied
   boot/firewall recipes. A successful install or shell exit is not runtime verification.
5. **Test function and security.** Check the actual renderer/app, required HTTPS service, Home/
   Settings escape, network reconnect and changed security behavior. Run a normal reboot;
   leave cold-power and USB-disconnected sleep/wake pending until tested. Preserve failures.
6. **Hand off the result.** Record what changed, evidence, rollback and unresolved risks in the
   existing private record. State the browser/OS update source and who owns future updates.
   Re-check after app, firmware or network changes and revoke credentials when retiring a frame.

### Evidence that supports a security claim

For network restrictions, verify an allowed connection and confirm the denied target is
listening from an independent permitted host. Correlate the denial with enforcement evidence.
For certificate distrust, test the relevant app's trust path against the affected chain and a
known-good HTTPS control. A timeout, DNS failure or generic JavaScript `fetch` error is
inconclusive; establish a certificate-verification rejection. Use synthetic data and an
owner-approved local fixture or public checker, without account cookies or credentials.

Report checks as **verified**, **failed**, **not tested** or **inconclusive**. Include the model/
firmware, app versions, method and limitations. Package absence, a closed-port snapshot or an
antivirus result cannot establish that a frame is free of unwanted software.

## Suspected compromise

Isolate the frame using the external network control, preserve private diagnostic evidence,
and revoke its service credentials from a trusted machine. Check affected services before
re-enrollment. Reflashing or factory-resetting the same vendor firmware does not establish
that a factory component was removed. Keep new private data off the frame until the owner's
chosen containment and recovery checks pass.
