import { Module } from '@nestjs/common';
import { PdfService } from './service';

@Module({
  providers: [PdfService],
  exports: [PdfService],
})
export class PdfModule {}