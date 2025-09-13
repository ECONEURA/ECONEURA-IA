// SEPA Parser Service for PR-42
import { SEPATransaction, SEPAUploadResult } from './sepa-types';

export class SEPAParserService {
  private transactions: SEPATransaction[] = [];

  async parseCAMT(fileContent: string): Promise<SEPAUploadResult> {
    try {
      // Parse CAMT.053/.054 XML
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(fileContent, 'text/xml');
      
      const transactions: SEPATransaction[] = [];
      const errors: string[] = [];

      // Extract transactions from CAMT structure
      const entries = xmlDoc.querySelectorAll('Ntry');
      
      for (let i = 0; i < entries.length; i++) {
        const entry = entries[i];
        try {
          const transaction = this.parseCAMTEntry(entry);
          if (transaction) {
            transactions.push(transaction);
          }
        } catch (error) {
          errors.push(`Error parsing entry: ${(error as Error).message}`);
        }
      }

      this.transactions = transactions;

      return {
        fileId: `camt_${Date.now()}`,
        fileName: 'camt_file.xml',
        transactionsCount: transactions.length,
        processedCount: transactions.length - errors.length,
        errorsCount: errors.length,
        status: errors.length === 0 ? 'success' : errors.length < transactions.length ? 'partial' : 'failed',
        errors,
        createdAt: new Date()
      };
    } catch (error) {
      return {
        fileId: `camt_error_${Date.now()}`,
        fileName: 'camt_file.xml',
        transactionsCount: 0,
        processedCount: 0,
        errorsCount: 1,
        status: 'failed',
        errors: [`Parse error: ${(error as Error).message}`],
        createdAt: new Date()
      };
    }
  }

  async parseMT940(fileContent: string): Promise<SEPAUploadResult> {
    try {
      // Parse MT940 EDIFACT format
      const lines = fileContent.split('\n');
      const transactions: SEPATransaction[] = [];
      const errors: string[] = [];

      let currentTransaction: Partial<SEPATransaction> = {};
      let inTransaction = false;

      for (const line of lines) {
        const trimmedLine = line.trim();
        
        if (trimmedLine.startsWith(':61:')) {
          // Transaction start
          if (inTransaction) {
            const transaction = this.finalizeMT940Transaction(currentTransaction);
            if (transaction) {
              transactions.push(transaction);
            }
          }
          currentTransaction = this.parseMT940TransactionLine(trimmedLine);
          inTransaction = true;
        } else if (trimmedLine.startsWith(':86:')) {
          // Transaction details
          if (inTransaction) {
            this.parseMT940DetailsLine(trimmedLine, currentTransaction);
          }
        }
      }

      // Process last transaction
      if (inTransaction) {
        const transaction = this.finalizeMT940Transaction(currentTransaction);
        if (transaction) {
          transactions.push(transaction);
        }
      }

      this.transactions = transactions;

      return {
        fileId: `mt940_${Date.now()}`,
        fileName: 'mt940_file.txt',
        transactionsCount: transactions.length,
        processedCount: transactions.length - errors.length,
        errorsCount: errors.length,
        status: errors.length === 0 ? 'success' : errors.length < transactions.length ? 'partial' : 'failed',
        errors,
        createdAt: new Date()
      };
    } catch (error) {
      return {
        fileId: `mt940_error_${Date.now()}`,
        fileName: 'mt940_file.txt',
        transactionsCount: 0,
        processedCount: 0,
        errorsCount: 1,
        status: 'failed',
        errors: [`Parse error: ${(error as Error).message}`],
        createdAt: new Date()
      };
    }
  }

  private parseCAMTEntry(entry: Element): SEPATransaction | null {
    try {
      const amount = entry.querySelector('Amt')?.textContent || '0';
      const currency = entry.querySelector('Amt')?.getAttribute('Ccy') || 'EUR';
      const date = entry.querySelector('BookgDt Dt')?.textContent || new Date().toISOString();
      const description = entry.querySelector('AddtlNtryInf')?.textContent || '';
      const reference = entry.querySelector('AcctSvcrRef')?.textContent || '';

      return {
        id: `camt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        accountId: 'default_account',
        transactionId: reference,
        amount: parseFloat(amount),
        currency,
        date: new Date(date),
        valueDate: new Date(date),
        description,
        reference,
        counterparty: {
          name: '',
          iban: '',
          bic: ''
        },
        category: 'unknown',
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date()
      };
    } catch (error) {
      return null;
    }
  }

  private parseMT940TransactionLine(line: string): Partial<SEPATransaction> {
    // Parse :61: line format
    const match = line.match(/:61:(\d{6})(\d{4})?([CD])(\d{1,15})/);
    if (!match) {
      throw new Error('Invalid MT940 transaction line format');
    }

    const [, dateStr, valueDateStr, debitCredit, amountStr] = match;
    const amount = parseFloat(amountStr) / 100; // MT940 amounts are in cents
    const isDebit = debitCredit === 'D';

    return {
      id: `mt940_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      accountId: 'default_account',
      transactionId: '',
      amount: isDebit ? -amount : amount,
      currency: 'EUR',
      date: this.parseMT940Date(dateStr),
      valueDate: valueDateStr ? this.parseMT940Date(valueDateStr) : this.parseMT940Date(dateStr),
      description: '',
      reference: '',
      counterparty: {
        name: '',
        iban: '',
        bic: ''
      },
      category: 'unknown',
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  private parseMT940DetailsLine(line: string, transaction: Partial<SEPATransaction>): void {
    // Parse :86: line for additional details
    const details = line.substring(4); // Remove :86: prefix
    
    // Extract reference, description, etc.
    const referenceMatch = details.match(/(\d{10,})/);
    if (referenceMatch) {
      transaction.reference = referenceMatch[1];
      transaction.transactionId = referenceMatch[1];
    }

    transaction.description = details;
  }

  private finalizeMT940Transaction(transaction: Partial<SEPATransaction>): SEPATransaction | null {
    if (!transaction.id || !transaction.amount || !transaction.date) {
      return null;
    }

    return transaction as SEPATransaction;
  }

  private parseMT940Date(dateStr: string): Date {
    // MT940 date format: YYMMDD
    const year = 2000 + parseInt(dateStr.substring(0, 2));
    const month = parseInt(dateStr.substring(2, 4)) - 1; // Month is 0-indexed
    const day = parseInt(dateStr.substring(4, 6));
    
    return new Date(year, month, day);
  }

  getTransactions(): SEPATransaction[] {
    return this.transactions;
  }

  clearTransactions(): void {
    this.transactions = [];
  }
}
