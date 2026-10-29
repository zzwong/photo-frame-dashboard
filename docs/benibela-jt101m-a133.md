# Benibela JT101M-B02 / JT101M-A02 (Allwinner A133, Android 10)

One 10.1-inch Benibela sold as `JT101M-B02`; Android reports `JT101M-A02`.
Tested from a Linux host over micro-USB, with separate DC barrel power.
The [C-2](joyhong-c2-a133.md) and [LOOFII C-3](allwinner-a133-loofii-c3.md)
share the A133 platform, but their recovery and flashing procedures are not qualified here.

## Identity and hardware

| Item | Observed on this unit |
| --- | --- |
| SoC | Allwinner A133, four Cortex-A53 cores; configured maximum 1.512 GHz |
| OS | Android 10 / API 29, kernel 4.9.170; 64-bit kernel, 32-bit ARM userspace, VNDK 29 |
| Build fingerprint | `Allwinner/ceres_aw/ceres-aw:10/QP1A.191105.004/eng.joy.20220905.163444:eng/test-keys` |
| Security patch | `2020-11-05` |
| RAM | 2,021,884 KiB visible to the kernel (2 GB class) |
| eMMC | SCA32G, 61,079,552 × 512-byte sectors = 31,272,730,624 bytes |
| Display / touch | 800×1280 panel, logical landscape 1280×800 at 160 dpi; `a00zp101i004_e40` panel driver, `gslX680` touch |
| Wi-Fi | XR829 / `xradio_wlan`, SDIO `0a9e:2282`; association and network time worked |
| Bluetooth | Controller initialization and discovery worked; pairing, HID, audio and GATT connections not tested |
| Sensors | Android registers no sensors; `mir3da` and `stk3x1x` fail to probe on stock firmware |
| USB / power | Micro-USB data (`1f3a:1001`) and DC barrel jack. USB-only power flickered at startup; booted with DC power attached |
| Access | Root ADB shell as shipped; SELinux Enforcing; vbmeta device state reports locked |
| Stock HOME | `com.waophoto.smartframe/.ui.GuideActivity` |

Unlike the C-2 report, this unit has XR829 Wi-Fi and Enforcing SELinux. The light-sensor
node exists in the device tree, but its I²C initialization fails and no usable sensor
interface appears. That does not establish whether the part is physically fitted.
Camera feature/HAL declarations likewise do not prove a camera is present.

An apparent shutdown was the stock 120-second screen-sleep timeout. It was not demonstrated
power loss. ADB remained available during that event.

## Launcher and photo viewer on stock Android

Rootless worked as default HOME. A custom native photo viewer and dashboard ran on stock
Android; the owner confirmed the dashboard was responsive and fit the display. These were
separate apps, not this repo's WebView kiosk.

The photo viewer's existing `BOOT_COMPLETED` receiver ran, but Android blocked its background
Activity start. Allowing `SYSTEM_ALERT_WINDOW` for that viewer alone let the same receiver
bring it onscreen. Android documents this as a
[background-launch exception](https://developer.android.com/guide/components/activities/secure-bal#when-background-activity-starts-are-allowed-exceptions).
No overlay was drawn. A subsequent normal reboot opened the viewer automatically in about
35 seconds, with Rootless still the default HOME. Wi-Fi and the cached album recovered;
the viewer subsequently reconnected to its server.

Home from the viewer and Settings returned to Rootless (USB-injected navigation checks).
No root boot hook, system remount or vendor-app disable was needed. This tests one viewer
on this firmware, not every kiosk app. Cold power-loss startup remains untested.

Undo: select the stock HOME component above, turn off the viewer's boot option and restore
its previous overlay app-op (`default` on this unit). Keep Settings/ADB accessible while testing.

## Firmware preservation and differences

Preserved 18 regions: firmware partitions, both eMMC hardware boot areas, device configuration
and primary/backup partition tables. Exact byte counts, gzip readback and independent device
hashes were checked. Userdata, cache and writable DSU metadata were excluded: this is a
firmware backup, not a full-device clone. A full restore has not been tested.

These whole-partition hashes and offsets differ from the C-2 record:

| Partition | Start sector | Sectors | SHA-256 |
| --- | --- | --- | --- |
| `boot` (p3) | 257,568 | 151,072 | `c34b8972af71acbb57fb6807e05af219bf3cc17da267911c00d7b9c4b801d692` |
| `recovery` (p6) | 4,635,712 | 65,536 | `4897ce63357470713a5c2940286433746d29a7d4c6bb5302c8de7b772e6c1ba3` |
| `dtbo` (p15) | 6,470,720 | 4,096 | `cbd231eaf5a513f2a124226feb406e64796680c0c86a9442bbcfb91186111ac2` |

## Android 12 trials and recovery limits

DSU attempts, including phh Android 12.1 v416, reached U-Boot fastboot without guest ADB.
A guest-init recorder produced no output. This does not establish the cause or prove that
Android 12 is incompatible. Stock Android was recovered afterward; ten checked firmware
regions still matched the preserved copies. No firmware partitions were flashed or unlocked.

Software FEL entry and read-only SoC identification worked (`soc=00001855(A133)`). A later
retained-DRAM read stalled FEL and required removal of both DC and USB power. The attempted
reset-pinhole entry booted Android normally, so hardware FEL entry remains unverified.
A software-only FEL return and full firmware restore are also unqualified. Do not repeat
the stalled DRAM probe or assume another A133 board's recovery recipe applies.
