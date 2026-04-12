# Current Release Notes

This file is the working draft for the next app-store release.

Workflow:

1. Add short user-facing bullets here as features or fixes land.
2. When cutting a real release, bump `expo.version` in `app.json` if the public release version should change.
3. Before publishing, trim this down to the final Play/App Store release note text.
4. After the release is submitted, reset this file back to the template for the next cycle.

Current draft:

- Adds flash logging and ND-stop logging to exposure entry without expanding the main shooting form.
- Adds voice parsing for flash power and ND-stop dictation, including common speech-to-text aliases.
- Exports registered lens focal length metadata for downstream EXIF-writing workflows.
- Rounds EV values to the selected whole, half, or third-stop increment in roll views and exports.
- Stores exposure UTC offsets so exports can reconstruct local wall-clock capture times for EXIF.
- Adds a local EXIF-writing utility for exported roll CSVs, with reverse-order scan matching, optional lossless TIFF compression, timezone-aware timestamps, and safer output-folder handling.

Reset template:

```md
# Current Release Notes

This file is the working draft for the next app-store release.

Workflow:

1. Add short user-facing bullets here as features or fixes land.
2. When cutting a real release, bump `expo.version` in `app.json` if the public release version should change.
3. Before publishing, trim this down to the final Play/App Store release note text.
4. After the release is submitted, reset this file back to the template for the next cycle.

Current draft:

- 
```
