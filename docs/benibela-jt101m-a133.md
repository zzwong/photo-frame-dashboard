# Benibela JT101M-B02 / JT101M-A02 (Allwinner A133, Android 10)

One 10.1-inch Benibela sold as `JT101M-B02`; Android reports `JT101M-A02`.
Tested from a Linux host over micro-USB, with separate DC barrel power.
The [C-2](joyhong-c2-a133.md) and [LOOFII C-3](allwinner-a133-loofii-c3.md)
also use the A133; their recovery and flashing procedures have not been verified on this frame.

## Identity and hardware

| Item | Observed |
| --- | --- |
| SoC | Allwinner A133, four Cortex-A53 cores; configured maximum 1.512 GHz |
| OS | Android 10 / API 29, kernel 4.9.170; 64-bit kernel, 32-bit ARM userspace, VNDK 29 |
| Build fingerprint | `Allwinner/ceres_aw/ceres-aw:10/QP1A.191105.004/eng.joy.20220905.163444:eng/test-keys` |
| Security patch | `2020-11-05` |
| RAM | 2,021,884 KiB visible to the kernel (2 GB class); `ro.config.low_ram=true` |
| eMMC | SCA32G, 61,079,552 × 512-byte sectors = 31,272,730,624 bytes |
| Display / touch | 800×1280 panel, logical landscape 1280×800 at 160 dpi; `a00zp101i004_e40` panel driver, `gslX680` touch |
| Wi-Fi | XR829 / `xradio_wlan`, SDIO `0a9e:2282`; association and network time worked |
| Bluetooth | Controller initialization and discovery worked; pairing, HID, audio and GATT connections not tested |
| Sensors | Android registers no sensors; `mir3da` and `stk3x1x` fail to probe on stock firmware |
| USB / power | Micro-USB data (`1f3a:1001`) and DC barrel jack. USB-only power flickered at startup; booted with DC power attached |
| Access | Root ADB shell as shipped; SELinux Enforcing; vbmeta device state reports locked |
| WebView | Stock 74.0.3729.186 → tested system-app update 155.0.8059.39; AOSP test-key signed |
| Stock HOME | `com.waophoto.smartframe/.ui.GuideActivity` |

The light-sensor node exists in the device tree, but its I²C initialization fails and no usable
sensor interface appears. This does not establish whether the part is physically fitted.

One apparent shutdown was the stock 120-second screen-sleep timeout; ADB remained available.

## Stock software differences

`ro.adb.secure=0`; `/system/xbin/su` is setuid and world-executable (mode `4777`).
The platform certificate matches the public AOSP platform key. SELinux Enforcing does
not make this a hardened stock image; access to `su` from an untrusted app was not tested.

No standalone `com.waophoto.fota` package was installed, and no TCP 5555 or 14035 listener
was observed. Do not assume the C-2's updater or network-ADB configuration applies.
Allwinner's persistent logcat/kernel logging is running; its init config includes rotation.

WebView 155.0.8059.39 installed as an update in `/data` using the
[same pinned LineageOS APK and AOSP test-key route as the C-2](joyhong-c2-a133.md#webview-and-the-kiosk).
The factory APK remained unchanged. `oklch`, `color-mix`, `:has()`, nesting, flex gap and
`aspect-ratio` passed; all six failed on stock WebView 74. A pinned build of the repo's demo
passed visible-content and USB touch-navigation checks on all seven tabs in the existing
WebView test browser. External fonts/images were blocked; the Home HQ APK was not tested.

Local 15-second H.264 Baseline clips at 480p, 720p and 1080p/30 used
`OMX.allwinner.video.decoder.avc`. Each 450-frame clip ended with two browser-reported dropped
frames and no corruption. These short local trials do not qualify streaming or long-term playback.

Rollback was tested with `adb shell pm uninstall -k com.android.webview` (no `--user`):
the factory provider returned and rendered the test page and 480p video. Avoid
`uninstall-system-updates` on this Android 10 build: it operates on all updated system apps.
After reinstalling 155, a normal reboot preserved it, Photos auto-start and Rootless HOME.

## Launcher and photo viewer on stock Android

Rootless worked as the default HOME. A custom native photo viewer and a separate dashboard ran
on stock Android; the owner confirmed the dashboard was responsive and fit the display. These
were not this repo's WebView kiosk.

The photo viewer's existing `BOOT_COMPLETED` receiver ran, but Android blocked its background
Activity start. Allowing the `SYSTEM_ALERT_WINDOW` app-op for that viewer alone let the same
receiver bring it onscreen. Android documents this as a
[background-launch exception](https://developer.android.com/guide/components/activities/secure-bal#when-background-activity-starts-are-allowed-exceptions).
No overlay was drawn. After a normal ADB reboot, the viewer opened automatically in about
35 seconds with Rootless still the default HOME. The cached album appeared and the viewer
later reconnected to its server. Cold power-loss startup was not tested.

Home from the viewer and Settings returned to Rootless in USB-injected navigation checks.
No root boot hook or vendor-app disable was needed.

Undo: select the stock HOME component above, turn off the viewer's boot option and restore
its previous overlay app-op (`default` on this frame).

## Firmware preservation and differences

Preserved 18 regions: firmware partitions, both eMMC hardware boot areas, device configuration
and primary/backup partition tables. Exact byte counts, gzip readback and independent device
hashes were checked. Userdata, cache, writable DSU metadata and RPMB were excluded.
This is a partial firmware backup, not a full-device clone; a full restore has not been tested.

These whole-partition hashes and offsets differ from the C-2 record:

| Partition | Start sector | Sectors | SHA-256 |
| --- | --- | --- | --- |
| `boot` (p3) | 257,568 | 151,072 | `c34b8972af71acbb57fb6807e05af219bf3cc17da267911c00d7b9c4b801d692` |
| `recovery` (p6) | 4,635,712 | 65,536 | `4897ce63357470713a5c2940286433746d29a7d4c6bb5302c8de7b772e6c1ba3` |
| `dtbo` (p15) | 6,470,720 | 4,096 | `cbd231eaf5a513f2a124226feb406e64796680c0c86a9442bbcfb91186111ac2` |

## Android 12 trials and recovery limits

DSU attempts, including phh Android 12.1 v416 and a stock-system control, reached U-Boot
fastboot without guest ADB. A guest-init recorder produced no output. The cause is unknown;
the result does not establish Android 12 incompatibility. Stock Android was recovered, and
ten checked firmware regions matched the preserved copies. No firmware partitions were
flashed and the bootloader was not unlocked.

Software FEL entry and read-only SoC identification worked (`soc=00001855(A133)`). A later
retained-DRAM read stalled FEL and required removal of both DC and USB power. The attempted
reset-pinhole entry booted Android normally, so hardware FEL entry remains unverified.
A software-only FEL return remains unverified. Do not repeat the stalled DRAM probe.
