import { SEPATransaction, SEPAUploadResult } from './sepa-types.js';
export declare class SEPAParserService {
    private transactions;
    parseCAMT(fileContent: string): Promise<SEPAUploadResult>;
    parseMT940(fileContent: string): Promise<SEPAUploadResult>;
    private parseCAMTEntry;
    private parseMT940TransactionLine;
    private parseMT940DetailsLine;
    private finalizeMT940Transaction;
    private parseMT940Date;
    getTransactions(): SEPATransaction[];
    clearTransactions(): void;
}
//# sourceMappingURL=sepa-parser.service.d.ts.map