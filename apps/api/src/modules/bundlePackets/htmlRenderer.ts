import type { ArtifactVersionSummary, CncJobSummary, CustomerOrderStatusView, ManufacturingBundleSummary, SheetSummary } from '@craft-and-board/shared';
import type { BundleLifecycleView } from '@craft-and-board/shared';

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function renderBundlePacketHtml(input: {
  generatedAt: string;
  bundle: ManufacturingBundleSummary;
  lifecycle: BundleLifecycleView;
  customerStatus: CustomerOrderStatusView;
  sheets: SheetSummary[];
  cncJobs: CncJobSummary[];
  artifacts: ArtifactVersionSummary[];
  machineProfile: {
    name: string;
    controllerType: string;
    fileExtension: string;
    toolDiameterIn: number;
    spindleRpm: number;
    feedRateIpm: number;
    plungeRateIpm?: number | null;
    cutDepthIn: number;
    onionSkinDepthIn: number;
    safeZIn: number;
  };
  materialProfile: {
    name: string;
    thicknessIn: number;
    sheetWidthIn: number;
    sheetDepthIn: number;
    trimMarginIn: number;
    defaultEdgeBandPattern: string;
  };
}) {
  const onionSkinRows = input.sheets
    .flatMap((sheet) =>
      sheet.placements
        .filter((placement) => placement.onionSkin)
        .map(
          (placement) => `
            <tr>
              <td>Sheet ${sheet.sheetNumber}</td>
              <td>${escapeHtml(placement.partCode)}</td>
              <td>${placement.widthIn.toFixed(3)} x ${placement.depthIn.toFixed(3)}</td>
            </tr>`
        )
    )
    .join('');
  const sheetCards = input.sheets
    .map((sheet) => {
      const placements = sheet.placements
        .map(
          (placement) => `
            <tr>
              <td>${placement.sequenceNumber}</td>
              <td>${escapeHtml(placement.partCode)}</td>
              <td>${placement.widthIn.toFixed(3)} x ${placement.depthIn.toFixed(3)}</td>
              <td>${placement.xIn.toFixed(3)}, ${placement.yIn.toFixed(3)}</td>
              <td>${placement.onionSkin ? 'Yes' : 'No'}</td>
            </tr>`
        )
        .join('');

      const mapArtifacts = input.artifacts.filter(
        (artifact) => artifact.isCurrent && artifact.uri.includes(`/manufacturing/sheets/${sheet.id}/map`)
      );

      const mapLinks = mapArtifacts
        .map(
          (artifact) =>
            `<li><a href="${escapeHtml(artifact.uri)}">${escapeHtml(artifact.artifactType)} v${artifact.version}</a></li>`
        )
        .join('');

      return `
        <section class="sheet-card">
          <div class="section-title-row">
            <h3>Sheet ${sheet.sheetNumber}</h3>
            <span>Utilization ${sheet.utilizationPct}%</span>
          </div>
          <p class="muted">${sheet.totalParts} parts · Version ${sheet.version ?? 1} · ${sheet.isCurrent ? 'Current' : 'Superseded'}</p>
          ${mapLinks ? `<ul class="artifact-list">${mapLinks}</ul>` : ''}
          <table>
            <thead>
              <tr>
                <th>Seq</th>
                <th>Part</th>
                <th>Size</th>
                <th>Origin</th>
                <th>Onion Skin</th>
              </tr>
            </thead>
            <tbody>${placements}</tbody>
          </table>
        </section>`;
    })
    .join('');

  const cncRows = input.cncJobs
    .map(
      (job) => `
        <tr>
          <td>${escapeHtml(job.code)}</td>
          <td>${job.version ?? 1}</td>
          <td>${escapeHtml(job.status)}</td>
          <td>${escapeHtml(job.fileName)}</td>
          <td>${job.failureReason ? escapeHtml(job.failureReason) : ''}</td>
        </tr>`
    )
    .join('');

  const onionSkinCount = input.sheets.reduce(
    (sum, sheet) => sum + sheet.placements.filter((placement) => placement.onionSkin).length,
    0
  );

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Craft & Board Bundle Packet ${escapeHtml(input.bundle.bundleCode)}</title>
    <style>
      body { font-family: Arial, sans-serif; margin: 24px; color: #111827; }
      h1, h2, h3, p { margin: 0; }
      .header, .section { border: 1px solid #d1d5db; border-radius: 16px; padding: 20px; margin-bottom: 20px; }
      .summary-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; margin-top: 16px; }
      .summary-card { border: 1px solid #e5e7eb; border-radius: 12px; padding: 12px; }
      .summary-card strong { display: block; font-size: 20px; margin-top: 8px; }
      .muted { color: #4b5563; margin-top: 8px; }
      .warning { color: #991b1b; }
      table { width: 100%; border-collapse: collapse; margin-top: 12px; }
      th, td { border: 1px solid #d1d5db; padding: 8px; text-align: left; font-size: 12px; vertical-align: top; }
      th { background: #f3f4f6; }
      .sheet-card { border: 1px solid #e5e7eb; border-radius: 16px; padding: 16px; margin-top: 16px; }
      .section-title-row { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; }
      .artifact-list { margin: 8px 0 0; padding-left: 20px; }
      .artifact-list a { color: #065f46; text-decoration: none; }
      @media print {
        body { margin: 0.25in; }
        .header, .section, .sheet-card { break-inside: avoid; }
      }
    </style>
  </head>
  <body>
    <section class="header">
      <p>Craft & Board</p>
      <h1>Bundle Packet</h1>
      <p class="muted">Generated ${escapeHtml(input.generatedAt)}</p>
      <div class="summary-grid">
        <div class="summary-card"><span>Bundle</span><strong>${escapeHtml(input.bundle.bundleCode)}</strong></div>
        <div class="summary-card"><span>Material</span><strong>${escapeHtml(input.bundle.materialCode)}</strong></div>
        <div class="summary-card"><span>Status</span><strong>${escapeHtml(input.lifecycle.status)}</strong></div>
        <div class="summary-card"><span>Customer Status</span><strong>${escapeHtml(input.customerStatus.customerStatus)}</strong></div>
        <div class="summary-card"><span>Current Nest</span><strong>${input.lifecycle.currentNestVersion ?? 0}</strong></div>
        <div class="summary-card"><span>Current CNC</span><strong>${input.lifecycle.currentCncVersion ?? 0}</strong></div>
        <div class="summary-card"><span>Total Parts</span><strong>${input.bundle.totalPhysicalParts}</strong></div>
        <div class="summary-card"><span>Total Sheets</span><strong>${input.sheets.length}</strong></div>
        <div class="summary-card"><span>Utilization</span><strong>${input.bundle.utilizationPct ?? 0}%</strong></div>
        <div class="summary-card"><span>Onion Skin Parts</span><strong>${onionSkinCount}</strong></div>
      </div>
    </section>

    <section class="section">
      <h2>Lifecycle</h2>
      <p class="muted">Ship By ${escapeHtml(input.bundle.shipByDate)} · Product ${escapeHtml(input.bundle.productLabel)}</p>
      <p class="muted">Released ${input.lifecycle.releasedAt ?? 'Pending'} · Nest Approved ${input.lifecycle.nestingApprovedAt ?? 'Pending'} · CNC Approved ${input.lifecycle.cncApprovedAt ?? 'Pending'}</p>
      <p class="muted">Next Actions: ${escapeHtml(input.lifecycle.nextAllowedActions.join(', ') || 'None')}</p>
      ${input.lifecycle.status === 'error' || input.lifecycle.status === 'qc_hold' ? '<p class="muted warning">This bundle is currently in a hold/error state and requires operator review.</p>' : ''}
      <p class="muted">Operator Notes: ________________________________</p>
    </section>

    <section class="section">
      <h2>Profiles Used</h2>
      <table>
        <thead>
          <tr>
            <th>Profile</th>
            <th>Details</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Material</td>
            <td>${escapeHtml(input.materialProfile.name)} · ${input.materialProfile.sheetWidthIn} x ${input.materialProfile.sheetDepthIn} in · trim ${input.materialProfile.trimMarginIn} in · thickness ${input.materialProfile.thicknessIn} in · ${escapeHtml(input.materialProfile.defaultEdgeBandPattern)}</td>
          </tr>
          <tr>
            <td>Machine</td>
            <td>${escapeHtml(input.machineProfile.name)} · ${escapeHtml(input.machineProfile.controllerType)} · tool ${input.machineProfile.toolDiameterIn} in · ${input.machineProfile.spindleRpm} RPM · feed ${input.machineProfile.feedRateIpm} IPM · plunge ${input.machineProfile.plungeRateIpm ?? '-'} IPM · safe Z ${input.machineProfile.safeZIn} in</td>
          </tr>
        </tbody>
      </table>
    </section>

    <section class="section">
      <h2>CNC Jobs</h2>
      <table>
        <thead>
          <tr>
            <th>Code</th>
            <th>Version</th>
            <th>Status</th>
            <th>File</th>
            <th>Failure Reason</th>
          </tr>
        </thead>
        <tbody>${cncRows || '<tr><td colspan="5">No CNC jobs generated.</td></tr>'}</tbody>
      </table>
    </section>

    <section class="section">
      <h2>Sheets</h2>
      ${sheetCards || '<p class="muted">No sheets available for this packet.</p>'}
    </section>

    <section class="section">
      <h2>Onion Skin Warnings</h2>
      <table>
        <thead>
          <tr>
            <th>Sheet</th>
            <th>Part</th>
            <th>Size</th>
          </tr>
        </thead>
        <tbody>${onionSkinRows || '<tr><td colspan="3">No onion-skin parts in the current packet.</td></tr>'}</tbody>
      </table>
    </section>
  </body>
</html>`;
}
