// C:\creative-academy\backend\controllers\certificateController.js
const { PDFDocument, StandardFonts, PDFName, PDFString, PDFArray, PDFDict } = require('pdf-lib');
const fs = require('fs');
const path = require('path');
const Certificate = require('../models/Certificate');

exports.downloadPublicCertificatePDF = async (req, res, next) => {
  try {
    const { certId } = req.params;
    const formattedCertId = certId.trim().toLowerCase();

    // 1. Fetch certificate
    const certificate = await Certificate.findOne({ certificateId: formattedCertId })
      .populate('studentId', 'name')
      .populate({
        path: 'courseId',
        select: 'title category',
        populate: {
          path: 'category',
          select: 'name' 
        }
      });

    if (!certificate) {
      return res.status(404).json({ success: false, error: "Credential not found." });
    }

    // 2. Variable extraction & formatting
    const studentName = certificate.studentId?.name || "Academic Scholar";
    const courseTitle = certificate.courseId?.title || "Certified Course";
    const categoryLabel = certificate.courseId?.category?.name || "Specialization";
    const categoryName = `${categoryLabel}: ${courseTitle}`.trim();
    
    const issuedDateName = certificate.issuedAt 
      ? new Date(certificate.issuedAt).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
      : "Date of Issuance";
    
    // Dynamic URL logic
    const clientBaseUrl = process.env.FRONTEND_URL || `${req.protocol}://${req.get('host')}`;
    const targetUrl = `${clientBaseUrl.replace(/\/$/, '')}/verify/certificate/${formattedCertId}`;
    const displayDomain = clientBaseUrl.replace(/^https?:\/\//, '');
    const verifyName = `Verify at: ${displayDomain}/verify/certificate/${formattedCertId}`;

    // 3. Load PDF template
    const templatePath = path.join(__dirname, '../assets/certificates.pdf');
    const templateBytes = await fs.promises.readFile(templatePath);
    const pdfDoc = await PDFDocument.load(templateBytes);
    
    const form = pdfDoc.getForm();
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

    // 4. Inject Form Values
    const nameField = form.getTextField('student_name');
    nameField.setText(studentName);
    nameField.setFontSize(36);
    nameField.updateAppearances(boldFont); 
    nameField.acroField.dict.set(PDFName.of('DA'), PDFString.of(`/F1 36 Tf 0.09 0.23 0.53 rg`));

    const categoryField = form.getTextField('catagory_name');
    categoryField.setText(categoryName);
    categoryField.updateAppearances(boldFont);
    categoryField.acroField.dict.set(PDFName.of('DA'), PDFString.of(`/F1 0 Tf 0.09 0.23 0.53 rg`));

    const dateField = form.getTextField('issued_date_name');
    dateField.setText(issuedDateName);
    dateField.setFontSize(20);
    dateField.updateAppearances(regularFont);
    dateField.acroField.dict.set(PDFName.of('DA'), PDFString.of(`/F2 12 Tf 0.2 0.2 0.2 rg`));

    // VERIFICATION FIELD
    const verifyField = form.getTextField('verify_name');
    verifyField.setText(verifyName);
    verifyField.setFontSize(20);
    verifyField.updateAppearances(regularFont);
    verifyField.acroField.dict.set(PDFName.of('DA'), PDFString.of(`/F2 10 Tf 0.4 0.4 0.4 rg`));

    // --- 4b. GET FIELD BBOX & CREATE CLICKABLE LINK ANNOTATION ---
    // Retrieve coordinates of the verify_name field to overlay the link clickable area
    const widgets = verifyField.acroField.getWidgets();
    if (widgets.length > 0) {
      const rect = widgets[0].getRectangle();
      const page = pdfDoc.getPages()[0];

      // Create PDF Link Annotation dictionary
      const linkAnnotation = pdfDoc.context.obj({
        Type: 'Annot',
        Subtype: 'Link',
        Rect: [rect.x, rect.y, rect.x + rect.width, rect.y + rect.height],
        Border: [0, 0, 0], // Invisible border
        C: [0, 0, 1],      // Color fallback
        A: {
          Type: 'Action',
          S: 'URI',
          URI: PDFString.of(targetUrl) // Complete dynamic URL (e.g. http://localhost:5173/verify/...)
        }
      });

      // Attach annotation to page
      const annotations = page.node.get(PDFName.of('Annots')) || pdfDoc.context.obj([]);
      if (annotations instanceof PDFArray) {
        annotations.push(linkAnnotation);
      } else {
        page.node.set(PDFName.of('Annots'), pdfDoc.context.obj([linkAnnotation]));
      }
    }

    // 5. Flatten form fields
    form.flatten();

    const pdfBytesBuffer = await pdfDoc.save();

    // 6. Transmit PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Certificate-${formattedCertId.toUpperCase()}.pdf`);
    return res.end(Buffer.from(pdfBytesBuffer));

  } catch (err) {
    next(err);
  }
};