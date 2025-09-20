export class SEPAParserService {
    transactions = [];
    async parseCAMT(fileContent) {
        try {
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(fileContent, 'text/xml');
            const transactions = [];
            const errors = [];
            const entries = xmlDoc.querySelectorAll('Ntry');
            for (let i = 0; i < entries.length; i++) {
                const entry = entries[i];
                try {
                    const transaction = this.parseCAMTEntry(entry);
                    if (transaction) {
                        transactions.push(transaction);
                    }
                }
                catch (error) {
                    errors.push(`Error parsing entry: ${error.message}`);
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
        }
        catch (error) {
            return {
                fileId: `camt_error_${Date.now()}`,
                fileName: 'camt_file.xml',
                transactionsCount: 0,
                processedCount: 0,
                errorsCount: 1,
                status: 'failed',
                errors: [`Parse error: ${error.message}`],
                createdAt: new Date()
            };
        }
    }
    async parseMT940(fileContent) {
        try {
            const lines = fileContent.split('\n');
            const transactions = [];
            const errors = [];
            let currentTransaction = {};
            let inTransaction = false;
            for (const line of lines) {
                const trimmedLine = line.trim();
                if (trimmedLine.startsWith(':61:')) {
                    if (inTransaction) {
                        const transaction = this.finalizeMT940Transaction(currentTransaction);
                        if (transaction) {
                            transactions.push(transaction);
                        }
                    }
                    currentTransaction = this.parseMT940TransactionLine(trimmedLine);
                    inTransaction = true;
                }
                else if (trimmedLine.startsWith(':86:')) {
                    if (inTransaction) {
                        this.parseMT940DetailsLine(trimmedLine, currentTransaction);
                    }
                }
            }
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
        }
        catch (error) {
            return {
                fileId: `mt940_error_${Date.now()}`,
                fileName: 'mt940_file.txt',
                transactionsCount: 0,
                processedCount: 0,
                errorsCount: 1,
                status: 'failed',
                errors: [`Parse error: ${error.message}`],
                createdAt: new Date()
            };
        }
    }
    parseCAMTEntry(entry) {
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
        }
        catch (error) {
            return null;
        }
    }
    parseMT940TransactionLine(line) {
        const match = line.match(/:61:(\d{6})(\d{4})?([CD])(\d{1,15})/);
        if (!match) {
            throw new Error('Invalid MT940 transaction line format');
        }
        const [, dateStr, valueDateStr, debitCredit, amountStr] = match;
        const amount = parseFloat(amountStr) / 100;
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
    parseMT940DetailsLine(line, transaction) {
        const details = line.substring(4);
        const referenceMatch = details.match(/(\d{10,})/);
        if (referenceMatch) {
            transaction.reference = referenceMatch[1];
            transaction.transactionId = referenceMatch[1];
        }
        transaction.description = details;
    }
    finalizeMT940Transaction(transaction) {
        if (!transaction.id || !transaction.amount || !transaction.date) {
            return null;
        }
        return transaction;
    }
    parseMT940Date(dateStr) {
        const year = 2000 + parseInt(dateStr.substring(0, 2));
        const month = parseInt(dateStr.substring(2, 4)) - 1;
        const day = parseInt(dateStr.substring(4, 6));
        return new Date(year, month, day);
    }
    getTransactions() {
        return this.transactions;
    }
    clearTransactions() {
        this.transactions = [];
    }
}
//# sourceMappingURL=sepa-parser.service.js.map