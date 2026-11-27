import fs from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit';
import { Response } from 'express';
import { logger } from '../../utils/logger';
import { VoterQueries } from '../../queries/voter.queries';

export interface VoterPdfExportOptions {
  boothId: string;
  language?: 'gu' | 'en';
  tenantDbName?: string | null;
  includePhotos?: boolean;
}

const GUJ_FEATURES: any[] = [
  'ccmp', 'locl', 'nukt', 'akhn', 'rphf', 'rkrf', 'pref',
  'blwf', 'abvf', 'half', 'psts', 'pres', 'abvs', 'blws',
  'haln', 'calt', 'kern'
];

export class VoterPdfExportService {
  /**
   * Generates and streams an ECI standard 3x10 grid voter list PDF for a specific booth.
   */
  static async exportBoothVoterListPdf(res: Response, options: VoterPdfExportOptions): Promise<void> {
    const { boothId, language = 'gu', tenantDbName, includePhotos = true } = options;
    const isGujarati = language !== 'en';

    logger.info(`[VoterPdfExport] Generating ECI voter list PDF for booth: ${boothId}, language: ${language}`);

    // 1. Fetch Booth metadata & voters
    const boothMetadata = await VoterQueries.getBoothDetailsForPdf(boothId, tenantDbName);
    if (!boothMetadata) {
      throw new Error('Selected booth not found');
    }

    const voters = await VoterQueries.getBoothVotersForPdf(boothId, tenantDbName);
    const totalVoters = voters.length;

    // Standard ECI Layout: 30 voters per page (3 columns x 10 rows)
    const VOTERS_PER_PAGE = 30;
    const totalPages = Math.max(1, Math.ceil(totalVoters / VOTERS_PER_PAGE));

    // 2. Set response headers for direct PDF download
    const cleanAc = boothMetadata.acNumber ? `AC_${boothMetadata.acNumber}_` : '';
    const cleanBoothNo = boothMetadata.boothNumber ? `Booth_${boothMetadata.boothNumber}` : 'Booth';
    const cleanBoothName = boothMetadata.name ? `_${boothMetadata.name.replace(/[^a-zA-Z0-9_\u0A80-\u0AFF]/g, '_').slice(0, 40)}` : '';
    const filename = `${cleanAc}${cleanBoothNo}${cleanBoothName}_Voter_List.pdf`.replace(/__+/g, '_');

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    // 3. Initialize PDF document (A4: 595.28 x 841.89 points)
    // Using bottom: 0 to avoid unintended auto-pagebreaks on absolute footer placement
    const doc = new PDFDocument({
      size: 'A4',
      autoFirstPage: false,
      bufferPages: true,
      margins: { top: 15, bottom: 0, left: 18, right: 18 },
    });

    doc.pipe(res);

    // Register Mukta Vaani font (Full Gujarati + Latin bilingual font)
    const fontRegularPath = path.resolve(__dirname, '../../assets/fonts/MuktaVaani-Regular.ttf');
    const fontBoldPath = path.resolve(__dirname, '../../assets/fonts/MuktaVaani-Bold.ttf');
    const logoPath = path.resolve(__dirname, '../../assets/logo.png');

    const hasFont = fs.existsSync(fontRegularPath) && fs.existsSync(fontBoldPath);
    if (hasFont) {
      doc.registerFont('Mukta', fontRegularPath);
      doc.registerFont('Mukta-Bold', fontBoldPath);
    }

    const fontNormal = hasFont ? 'Mukta' : 'Helvetica';
    const fontBold = hasFont ? 'Mukta-Bold' : 'Helvetica-Bold';
    const fontLatinBold = 'Helvetica-Bold';
    const textOptions: any = hasFont ? { features: GUJ_FEATURES } : {};

    // Standard Grid Dimensions (points)
    const cardWidth = 182;
    const cardHeight = 72.5;
    const colGap = 5.5;
    const rowGap = 4;
    const gridStartX = 18;
    const gridStartY = 50;
    const photoWidth = 38;
    const photoHeight = 49;

    const todayDate = new Date().toLocaleDateString('en-GB').replace(/\//g, '-');

    // 4. Render Pages
    for (let pageIdx = 0; pageIdx < totalPages; pageIdx++) {
      doc.addPage();
      const currentPageNo = pageIdx + 1;
      const pageVoters = voters.slice(pageIdx * VOTERS_PER_PAGE, (pageIdx + 1) * VOTERS_PER_PAGE);

      // Determine section number and name for this page
      const currentSectionNo = pageVoters[0]?.sectionNo || 1;
      const currentSectionName = pageVoters[0]?.village || pageVoters[0]?.fullAddress || boothMetadata.name || '';

      // --- PAGE HEADER ---
      // Line 1: AC No/Name + Logo + Booth No
      const acLabel = isGujarati ? 'વિધાનસભા મત વિભાગનો નંબર અને નામ' : 'Assembly Constituency No. and Name';
      const acText = `${acLabel} : ${boothMetadata.acNumber ? boothMetadata.acNumber + '-' : ''}${boothMetadata.acName || ''}`;
      const partLabel = isGujarati ? 'ભાગ નંબર' : 'Part No';
      const partText = `${partLabel} : ${boothMetadata.boothNumber || 1}`;

      doc.font(fontBold).fontSize(8.5);
      doc.text(acText, 18, 16, { ...textOptions, width: 320, lineBreak: false });

      if (fs.existsSync(logoPath)) {
        try {
          doc.image(logoPath, 345, 12, { fit: [75, 18] });
        } catch (_) { }
      }

      doc.font(fontBold).fontSize(8.5);
      doc.text(partText, 420, 16, { ...textOptions, width: 157, align: 'right', lineBreak: false });

      // Line 2: Section No and Name
      const secLabel = isGujarati ? 'વિભાગનો નંબર અને નામ' : 'Section No. and Name';
      const secText = `${secLabel} : ${currentSectionNo}-${currentSectionName}`;
      doc.font(fontBold).fontSize(8);
      doc.text(secText, 18, 31, { ...textOptions, width: 559, lineBreak: false });

      // Header divider line
      doc.moveTo(18, 45).lineTo(577, 45).lineWidth(0.5).stroke('#000000');

      // --- VOTER GRID (3 Columns x 10 Rows) ---
      for (let i = 0; i < pageVoters.length; i++) {
        const v = pageVoters[i];
        const col = i % 3;
        const row = Math.floor(i / 3);

        const cx = gridStartX + col * (cardWidth + colGap);
        const cy = gridStartY + row * (cardHeight + rowGap);

        // 1. Card outer border
        doc.rect(cx, cy, cardWidth, cardHeight).lineWidth(0.5).stroke('#000000');

        // 2. Serial number box (top-left)
        const serialBoxWidth = 32;
        const serialBoxHeight = 12.5;
        doc.rect(cx, cy, serialBoxWidth, serialBoxHeight).lineWidth(0.5).stroke('#000000');

        const serialText = String(v.serialNo || (pageIdx * VOTERS_PER_PAGE + i + 1));
        doc.font(fontLatinBold).fontSize(7.5);
        doc.text(serialText, cx, cy + 2.5, { width: serialBoxWidth, align: 'center', lineBreak: false });

        // 3. EPIC No (top-right, Latin alphanumeric font)
        const epicText = v.epicNo || '';
        doc.font(fontLatinBold).fontSize(7.5);
        doc.text(epicText, cx + serialBoxWidth + 4, cy + 2.5, { width: cardWidth - serialBoxWidth - 8, align: 'right', lineBreak: false });

        // 4. Photo Box (right column inside card)
        const px = cx + cardWidth - photoWidth - 4;
        const py = cy + 16;
        doc.rect(px, py, photoWidth, photoHeight).lineWidth(0.5).stroke('#000000');

        let photoDrawn = false;
        if (includePhotos && v.avatar) {
          try {
            const localAvatarPath = path.resolve(__dirname, '../../../backend', v.avatar.replace(/^\//, ''));
            if (fs.existsSync(localAvatarPath)) {
              doc.image(localAvatarPath, px + 1, py + 1, { fit: [photoWidth - 2, photoHeight - 2], align: 'center', valign: 'center' });
              photoDrawn = true;
            }
          } catch (_) {
            photoDrawn = false;
          }
        }

        if (!photoDrawn) {
          const photoPlaceholder = isGujarati ? 'ફોટો ઉપલબ્ધ' : 'Photo Available';
          doc.font(fontNormal).fontSize(6);
          doc.text(photoPlaceholder, px + 1, py + (photoHeight / 2) - 4, { ...textOptions, width: photoWidth - 2, align: 'center', lineBreak: false });
        }

        // 5. Voter Details (left area inside card)
        const textStartX = cx + 3;
        const textWidth = cardWidth - photoWidth - 10;
        let lineY = cy + 15;

        // Voter Name
        const nameLabel = isGujarati ? 'મતદારનું નામ : ' : 'Name: ';
        const voterName = isGujarati
          ? [v.firstName, v.middleName, v.surname].filter(Boolean).join(' ') || [v.engFirstName, v.engMiddleName, v.engSurname].filter(Boolean).join(' ')
          : [v.engFirstName, v.engMiddleName, v.engSurname].filter(Boolean).join(' ') || [v.firstName, v.middleName, v.surname].filter(Boolean).join(' ');

        doc.font(fontNormal).fontSize(6.8);
        doc.text(`${nameLabel}${voterName}`, textStartX, lineY, { ...textOptions, width: textWidth, height: 13, ellipsis: true, lineBreak: false });
        lineY += 13.5;

        // Relative / Guardian Name
        const relType = (v.relation || '').toLowerCase();
        let relLabel = isGujarati ? 'પિતાનું નામ : ' : "Father's Name: ";
        if (relType.includes('husband') || relType.includes('પતિ')) {
          relLabel = isGujarati ? 'પતિનું નામ : ' : "Husband's Name: ";
        } else if (relType.includes('mother') || relType.includes('માતા')) {
          relLabel = isGujarati ? 'માતાનું નામ : ' : "Mother's Name: ";
        } else if (relType.includes('other') || relType.includes('અન્ય')) {
          relLabel = isGujarati ? 'અન્ય : ' : 'Other: ';
        }

        const guardianName = v.guardianName || '';
        doc.text(`${relLabel}${guardianName}`, textStartX, lineY, { ...textOptions, width: textWidth, height: 13, ellipsis: true, lineBreak: false });
        lineY += 13.5;

        // House Number
        const houseLabel = isGujarati ? 'ઘર નંબર : ' : 'House No: ';
        const houseNo = v.houseNo || '-';
        doc.text(`${houseLabel}${houseNo}`, textStartX, lineY, { ...textOptions, width: textWidth, height: 13, ellipsis: true, lineBreak: false });
        lineY += 13.5;

        // Age & Gender
        let genderText = v.gender || '-';
        if (isGujarati) {
          const gLower = (v.gender || '').toLowerCase();
          if (gLower === 'male' || gLower === 'પુરૂષ') genderText = 'પુરૂષ';
          else if (gLower === 'female' || gLower === 'સ્ત્રી') genderText = 'સ્ત્રી';
          else if (gLower.includes('third') || gLower.includes('અન્ય')) genderText = 'ત્રીજી જાતિ';
        }

        const ageLabel = isGujarati ? 'ઉંમર : ' : 'Age: ';
        const genderLabel = isGujarati ? 'જાતિ : ' : 'Gender: ';
        doc.text(`${ageLabel}${v.age ?? '-'}  ${genderLabel}${genderText}`, textStartX, lineY, {
          ...textOptions,
          width: textWidth,
          height: 12,
          lineBreak: false,
        });
      }

      // --- PAGE FOOTER ---
      const footerY = 822;
      doc.font(fontNormal).fontSize(7.5);

      const asOfText = isGujarati ? `તા. 01-01-${new Date().getFullYear()} ના રોજ ઉંમર` : `Age as of 01-01-${new Date().getFullYear()}`;
      const revText = isGujarati ? `# પુરવણીમાં સુધાર્યા મુજબ. પ્રસિદ્ધિની તારીખ :- ${todayDate}` : `# As modified in supplements. Date of publication: ${todayDate}`;
      const pageCounterText = isGujarati ? `કુલ પૃષ્ઠ ${totalPages} - પૃષ્ઠ ${currentPageNo}` : `Total Pages ${totalPages} - Page ${currentPageNo}`;

      doc.text(asOfText, 18, footerY, { ...textOptions, width: 180, lineBreak: false });
      doc.text(revText, 180, footerY, { ...textOptions, width: 260, align: 'center', lineBreak: false });
      doc.text(pageCounterText, 440, footerY, { ...textOptions, width: 137, align: 'right', lineBreak: false });
    }

    doc.end();
  }
}
