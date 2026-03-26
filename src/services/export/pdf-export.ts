import * as FileSystem from 'expo-file-system/legacy';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

import { exposureRepository } from '@/db/repositories/sqlite-exposure-repository';
import { formatEv100, formatExposureTimestamp } from '@/features/exposures/exposure-utils';
import { derivePushPullLabel, formatIso } from '@/features/rolls/roll-utils';
import { nowIsoString } from '@/lib/time';
import type { Exposure, Roll } from '@/types/domain';

function createTimestampSuffix() {
  return nowIsoString().replaceAll(':', '-');
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function formatOptionalText(value: string | null | undefined, fallback = '—') {
  const trimmed = value?.trim();
  return escapeHtml(trimmed ? trimmed : fallback);
}

function formatLocation(exposure: Exposure) {
  if (exposure.latitude === null || exposure.longitude === null) {
    return '—';
  }

  const parts = [
    `${exposure.latitude.toFixed(5)}, ${exposure.longitude.toFixed(5)}`,
  ];

  if (exposure.locationAccuracy !== null) {
    parts.push(`±${Math.round(exposure.locationAccuracy)}m`);
  }

  return parts.join(' · ');
}

function formatRollTitle(roll: Roll) {
  return roll.nickname?.trim() ? roll.nickname.trim() : 'Untitled Roll';
}

function buildExposureRows(roll: Roll, exposures: Exposure[]) {
  if (exposures.length === 0) {
    return `
      <tr>
        <td colspan="7" class="empty">No exposures logged on this roll yet.</td>
      </tr>
    `;
  }

  return exposures
    .map(
      (exposure) => `
        <tr>
          <td>${exposure.sequenceNumber}</td>
          <td>${escapeHtml(exposure.fStop)}</td>
          <td>${escapeHtml(exposure.shutterSpeed)}</td>
          <td>${formatOptionalText(exposure.lens)}</td>
          <td>${escapeHtml(formatEv100(exposure.fStop, exposure.shutterSpeed, roll.shotIso))}</td>
          <td>${escapeHtml(formatExposureTimestamp(exposure.capturedAt))}</td>
          <td>${escapeHtml(formatLocation(exposure))}</td>
        </tr>
        ${
          exposure.notes?.trim()
            ? `
              <tr class="note-row">
                <td></td>
                <td colspan="6"><span class="note-label">Notes:</span> ${escapeHtml(exposure.notes.trim())}</td>
              </tr>
            `
            : ''
        }
      `,
    )
    .join('');
}

function buildRollPdfHtml(roll: Roll, exposures: Exposure[]) {
  const rollTitle = escapeHtml(formatRollTitle(roll));
  const pushPullLabel = escapeHtml(derivePushPullLabel(roll.nativeIso, roll.shotIso));
  const startedAt = roll.startedAt ? escapeHtml(new Date(roll.startedAt).toLocaleString()) : 'Not set';
  const finishedAt = roll.finishedAt ? escapeHtml(new Date(roll.finishedAt).toLocaleString()) : 'Not set';
  const rollNotes = roll.notes?.trim() ? escapeHtml(roll.notes.trim()) : 'No roll notes.';

  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <title>${rollTitle}</title>
        <style>
          * { box-sizing: border-box; }
          body {
            margin: 0;
            color: #171717;
            background: #f4eee2;
            font-family: "Helvetica Neue", Arial, sans-serif;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .page {
            padding: 28px 28px 24px;
          }
          .header {
            display: flex;
            justify-content: space-between;
            gap: 16px;
            align-items: flex-start;
            margin-bottom: 20px;
          }
          .eyebrow {
            color: #6e6351;
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 1.4px;
            text-transform: uppercase;
            margin: 0 0 8px;
          }
          h1 {
            margin: 0 0 8px;
            font-size: 28px;
            line-height: 1.1;
          }
          .subhead {
            margin: 0;
            color: #3e3528;
            font-size: 15px;
            line-height: 1.5;
          }
          .status-chip {
            border: 1px solid #c8bca8;
            border-radius: 999px;
            background: #fffaf0;
            padding: 7px 12px;
            color: #3e3528;
            font-size: 12px;
            font-weight: 700;
            text-transform: capitalize;
          }
          .meta-grid {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 10px;
            margin-bottom: 16px;
          }
          .meta-card {
            border: 1px solid #d8cfbf;
            border-radius: 14px;
            background: #fffaf0;
            padding: 12px 14px;
          }
          .meta-label {
            color: #6e6351;
            font-size: 10px;
            font-weight: 700;
            letter-spacing: 1px;
            text-transform: uppercase;
            margin-bottom: 5px;
          }
          .meta-value {
            font-size: 14px;
            line-height: 1.4;
          }
          .meta-hint {
            margin-top: 3px;
            color: #6e6351;
            font-size: 12px;
          }
          .notes-card {
            border: 1px solid #d8cfbf;
            border-radius: 14px;
            background: #fffaf0;
            padding: 12px 14px;
            margin-bottom: 18px;
          }
          .notes-text {
            font-size: 13px;
            line-height: 1.5;
            white-space: pre-wrap;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            border: 1px solid #d8cfbf;
            background: #fffaf0;
            border-radius: 14px;
            overflow: hidden;
          }
          thead th {
            padding: 10px 10px;
            border-bottom: 1px solid #d8cfbf;
            background: #efe3cf;
            color: #4d4335;
            font-size: 10px;
            font-weight: 700;
            letter-spacing: 0.8px;
            text-align: left;
            text-transform: uppercase;
          }
          tbody td {
            padding: 10px 10px;
            border-bottom: 1px solid #ece2d3;
            font-size: 12px;
            line-height: 1.35;
            vertical-align: top;
          }
          tbody tr:last-child td {
            border-bottom: none;
          }
          .note-row td {
            padding-top: 0;
            color: #5b5143;
          }
          .note-label {
            font-weight: 700;
          }
          .empty {
            color: #6e6351;
            text-align: center;
            padding: 18px 12px;
          }
          .footer {
            margin-top: 16px;
            color: #6e6351;
            font-size: 11px;
            text-align: right;
          }
        </style>
      </head>
      <body>
        <div class="page">
          <div class="header">
            <div>
              <p class="eyebrow">Exposure Logger</p>
              <h1>${rollTitle}</h1>
              <p class="subhead">${escapeHtml(roll.filmStock)} · ${escapeHtml(roll.camera)}</p>
            </div>
            <div class="status-chip">${escapeHtml(roll.status)}</div>
          </div>

          <div class="meta-grid">
            <div class="meta-card">
              <div class="meta-label">ISO</div>
              <div class="meta-value">${escapeHtml(formatIso(roll.nativeIso, roll.shotIso))}</div>
              <div class="meta-hint">${pushPullLabel}</div>
            </div>
            <div class="meta-card">
              <div class="meta-label">Frames Logged</div>
              <div class="meta-value">${exposures.length}</div>
            </div>
            <div class="meta-card">
              <div class="meta-label">Started</div>
              <div class="meta-value">${startedAt}</div>
            </div>
            <div class="meta-card">
              <div class="meta-label">Finished</div>
              <div class="meta-value">${finishedAt}</div>
            </div>
          </div>

          <div class="notes-card">
            <div class="meta-label">Roll Notes</div>
            <div class="notes-text">${rollNotes}</div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Frame</th>
                <th>f-stop</th>
                <th>Shutter</th>
                <th>Lens</th>
                <th>EV</th>
                <th>Captured</th>
                <th>Location</th>
              </tr>
            </thead>
            <tbody>
              ${buildExposureRows(roll, exposures)}
            </tbody>
          </table>

          <div class="footer">Generated ${escapeHtml(new Date().toLocaleString())}</div>
        </div>
      </body>
    </html>
  `;
}

async function sharePdfFile(fileName: string, html: string) {
  const sharingAvailable = await Sharing.isAvailableAsync();
  if (!sharingAvailable) {
    throw new Error('Sharing is not available on this device.');
  }

  const result = await Print.printToFileAsync({
    html,
    width: 612,
    height: 792,
  });

  const directory = FileSystem.cacheDirectory ?? FileSystem.documentDirectory;
  if (!directory) {
    throw new Error('File export directory is unavailable.');
  }

  const fileUri = `${directory}${fileName}`;
  await FileSystem.moveAsync({
    from: result.uri,
    to: fileUri,
  });

  await Sharing.shareAsync(fileUri, {
    dialogTitle: 'Export exposure log PDF',
    mimeType: 'application/pdf',
    UTI: 'com.adobe.pdf',
  });

  return fileUri;
}

export async function exportRollPdf(roll: Roll) {
  const exposures = await exposureRepository.listByRollId(roll.id);
  const html = buildRollPdfHtml(roll, exposures);
  const fileName = `roll-${roll.id}-${createTimestampSuffix()}.pdf`;
  const fileUri = await sharePdfFile(fileName, html);

  return {
    fileUri,
    exportedRollIds: [roll.id],
    exportedExposures: exposures.length,
  };
}
