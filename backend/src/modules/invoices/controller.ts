import { Controller, Get, Param, Res, NotFoundException, Post, Body } from '@nestjs/common';
import { Response } from 'express';
import { InvoiceService } from './service';
import * as fs from 'fs';
@Controller('invoices')
export class InvoiceController {
    constructor(private readonly invoiceService: InvoiceService) {}

    /**
     * Generates an invoice for a specific transaction
     * @param transactionId ID of the transaction
     */
    @Post('generate/:transactionId')
    async generateInvoice(@Param('transactionId') transactionId: string) {
        try {
            const pdfPath = await this.invoiceService.generateInvoiceForTransaction(transactionId);
            return {
                success: true,
                message: 'Invoice generated successfully',
                filePath: pdfPath,
            };
        } catch (error) {
            return {
                success: false,
                message: error.message,
            };
        }
    }

    /**
     * Downloads an invoice by transaction ID
     * @param transactionId ID of the transaction
     * @param res Express response object
     */
    @Get('download/:transactionId')
    async downloadInvoice(@Param('transactionId') transactionId: string, @Res() res: Response) {
        try {
            // Generate or retrieve the invoice
            const pdfPath = await this.invoiceService.generateInvoiceForTransaction(transactionId);
            
            // Verify that the file exists
            if (!fs.existsSync(pdfPath)) throw new NotFoundException('Invoice not found');
            
            const fileName = pdfPath.split('/').pop();
            
            // Set headers for the download
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
            
            // Send the file as a stream
            const fileStream = fs.createReadStream(pdfPath);
            fileStream.pipe(res);
        } catch (error) {
            res.status(404).json({
                success: false,
                message: error.message,
            });
        }
    }
}
