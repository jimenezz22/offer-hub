import * as PDFKit from 'pdfkit';
import { Injectable, Logger } from '@nestjs/common';
import { createWriteStream } from 'fs';
import { join } from 'path';
import * as fs from 'fs';

export interface InvoiceData {
  id: string;
  invoiceNumber: string;
  createdAt: Date;
  dueDate?: Date;
  
  transactionId: string;
  transactionHash: string;
  amount: number;
  currency: string;
  status: string;
  
  client: {
    id: string;
    name: string;
    email: string;
    address?: string;
  };
  
  freelancer: {
    id: string;
    name: string;
    email: string;
    address?: string;
    walletAddress?: string;
  };
  
  project: {
    id: string;
    title: string;
    description: string;
  };
  
  items: {
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }[];
  
  subtotal: number;
  tax?: number;
  taxRate?: number;
  total: number;
}

@Injectable()
export class PdfService {
  private readonly logger = new Logger(PdfService.name);

  /**
   * Generate a PDF invoice from the provided data
   * @param invoiceData Invoice data to include in the PDF
   * @param outputPath Route to save the generated PDF
   * @returns Promise with the path to the generated PDF
   */
  async generateInvoice(invoiceData: InvoiceData, outputPath?: string): Promise<string> {
    if (!outputPath) {
      const uploadsDir = join(process.cwd(), 'uploads', 'invoices');
      
      if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
      
      outputPath = join(uploadsDir, `invoice-${invoiceData.id}-${Date.now()}.pdf`);
    }

    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFKit({ margin: 50 });
        
        doc.pipe(createWriteStream(outputPath));
        
        this.addHeader(doc, invoiceData);
        this.addPartyInformation(doc, invoiceData);
        this.addInvoiceInformation(doc, invoiceData);
        this.addItems(doc, invoiceData);
        this.addTotals(doc, invoiceData);
        this.addFooter(doc, invoiceData);
        
        doc.end();
        
        doc.on('end', () => {
          this.logger.log(`Invoice generated successfully: ${outputPath}`);
          resolve(outputPath);
        });
      } catch (error) {
        this.logger.error(`Error generating invoice: ${error.message}`);
        reject(error);
      }
    });
  }

 /**
 * Adds a header to the PDF document.
 */
  private addHeader(doc: PDFKit.PDFDocument, invoiceData: InvoiceData): void {
    doc.fontSize(20).font('Helvetica-Bold').text('INVOICE', { align: 'center' });
    doc.moveDown();
    doc.fontSize(10).font('Helvetica');
  }

 /**
 * Adds the party information (freelancer and client) to the provided PDF document.
 */
  private addPartyInformation(doc: PDFKit.PDFDocument, invoiceData: InvoiceData): void {
    const startY = doc.y;

    doc.font('Helvetica-Bold').text('De:', 50, startY);
    doc.font('Helvetica').text(invoiceData.freelancer.name);
    doc.text(invoiceData.freelancer.email);

    if (invoiceData.freelancer.address) doc.text(invoiceData.freelancer.address);

    if (invoiceData.freelancer.walletAddress) doc.text(`Wallet: ${invoiceData.freelancer.walletAddress}`);

    doc.font('Helvetica-Bold').text('Para:', 300, startY);
    doc.font('Helvetica').text(invoiceData.client.name);
    doc.text(invoiceData.client.email);

    if (invoiceData.client.address) doc.text(invoiceData.client.address);

    doc.moveDown(2);
  }

  /**
   * Adds the invoice information to the provided PDF document.
   */
  private addInvoiceInformation(doc: PDFKit.PDFDocument, invoiceData: InvoiceData): void {
    doc.font('Helvetica-Bold').text('Invoice Information:');
    doc.font('Helvetica');
    
    const invoiceInfoY = doc.y;
    
    doc.text('Invoice Number:', 50, invoiceInfoY);
    doc.text('Issue Date:', 50, doc.y + 15);

    if (invoiceData.dueDate) doc.text('Expiration Date:', 50, doc.y + 15);

    doc.text('Transaction ID:', 50, doc.y + 15);
    doc.text('Transaction HASH:', 50, doc.y + 15);
    
    doc.text(invoiceData.invoiceNumber, 200, invoiceInfoY);
    doc.text(this.formatDate(invoiceData.createdAt), 200, invoiceInfoY + 15);
    
    if (invoiceData.dueDate) {
      doc.text(this.formatDate(invoiceData.dueDate), 200, doc.y);
      doc.moveUp();
    }

    doc.text(invoiceData.transactionId, 200, doc.y + 15);
    doc.text(invoiceData.transactionHash, 200, doc.y + 15);
    
    doc.moveDown(2);
    
    doc.font('Helvetica-Bold').text('Project:');
    doc.font('Helvetica').text(invoiceData.project.title);
    doc.font('Helvetica').text(invoiceData.project.description, {
      width: 500,
      align: 'left'
    });
    
    doc.moveDown(2);
  }

  /**
   * Add items to the invoice
   */
  private addItems(doc: PDFKit.PDFDocument, invoiceData: InvoiceData): void {
    this.drawTableHeader(doc);

    const items = invoiceData.items;
    let y = doc.y;
    
    items.forEach((item, index) => {

      if (index % 2 === 0) doc.fillColor('#f6f6f6').rect(50, y, 500, 20).fill();

      doc.fillColor('#000000');
      doc.text(item.description, 55, y + 5, { width: 240 });
      doc.text(item.quantity.toString(), 300, y + 5, { width: 70, align: 'center' });
      doc.text(this.formatCurrency(item.unitPrice, invoiceData.currency), 370, y + 5, { width: 70, align: 'right' });
      doc.text(this.formatCurrency(item.total, invoiceData.currency), 440, y + 5, { width: 70, align: 'right' });
      
      y += 20;
    });
    
    doc.moveDown(2);
  }

  /**
   * Draw the table header
   */
  private drawTableHeader(doc: PDFKit.PDFDocument): void {
    doc.font('Helvetica-Bold');
    
    doc.fillColor('#e6e6e6').rect(50, doc.y, 500, 20).fill();
    doc.fillColor('#000000');
    
    doc.text('Description', 55, doc.y + 5, { width: 240 });
    doc.text('Amount', 300, doc.y + 5, { width: 70, align: 'center' });
    doc.text('Price', 370, doc.y + 5, { width: 70, align: 'right' });
    doc.text('Total', 440, doc.y + 5, { width: 70, align: 'right' });
    
    doc.font('Helvetica');
    doc.moveDown();
  }

  /**
   * Add totals to the invoice
   */
  private addTotals(doc: PDFKit.PDFDocument, invoiceData: InvoiceData): void {
    
    // Separator line
    const y = doc.y;
    doc.strokeColor('#aaaaaa').lineWidth(1).moveTo(50, y).lineTo(550, y).stroke();
    doc.moveDown();
    
    doc.font('Helvetica').text('Subtotal:', 400, doc.y);
    doc.text(this.formatCurrency(invoiceData.subtotal, invoiceData.currency), 500, doc.y, { align: 'right' });
    doc.moveDown(0.5);
    
    if (invoiceData.tax && invoiceData.taxRate) {
      doc.text(`Tax(${invoiceData.taxRate}%):`, 400, doc.y);
      doc.text(this.formatCurrency(invoiceData.tax, invoiceData.currency), 500, doc.y, { align: 'right' });
      doc.moveDown(0.5);
    }
    
    doc.font('Helvetica-Bold').text('Total:', 400, doc.y);
    doc.text(this.formatCurrency(invoiceData.total, invoiceData.currency), 500, doc.y, { align: 'right' });
    
    doc.moveDown(2);
  }

  /**
   * Add the footer to the invoice
   */
  private addFooter(doc: PDFKit.PDFDocument, invoiceData: InvoiceData): void {
    doc.font('Helvetica');
    
    doc.fontSize(10).text(`Status: ${this.formatStatus(invoiceData.status)}`, { align: 'center' });
    
    doc.moveDown();
    doc.text('Thank you for using OFFER-HUB - The decentralized freelance platform', {
      align: 'center'
    });
    
    doc.moveDown();
    doc.fontSize(8).text(
      `This invoice has been recorded on the blockchain with the transaction hash: ${invoiceData.transactionHash}`,
      { align: 'center' }
    );
  }

  /**
   * Formats the transaction status to display on the invoice
   */
  private formatStatus(status: string): string {
    const statusMap = {
      pending: 'Pending',
      completed: 'Completed',
      failed: 'Failed',
      cancelled: 'Cancelled'
    };
    
    return statusMap[status] || status;
  }

  /**
   * Format dates to display on the invoice
   */
  private formatDate(date: Date): string {
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  /**
   * Format amounts with currency symbols
   */
  private formatCurrency(amount: number, currency: string): string {
    const currencySymbols = {
      USD: '$',
      ETH: 'Ξ',
      BTC: '₿',
    };
    
    const symbol = currencySymbols[currency] || currency;
    return `${symbol}${amount.toFixed(2)}`;
  }
}