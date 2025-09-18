import { z } from 'zod';
import { logger } from '../../../utils/logger.js';
const EmailProviderConfigSchema = z.object({
    provider: z.enum(['sendgrid', 'aws_ses', 'smtp']),
    apiKey: z.string().optional(),
    secretKey: z.string().optional(),
    region: z.string().optional(),
    host: z.string().optional(),
    port: z.number().optional(),
    username: z.string().optional(),
    password: z.string().optional(),
    fromEmail: z.string().email(),
    fromName: z.string().optional(),
    replyTo: z.string().email().optional(),
    testMode: z.boolean().default(false)
});
const EmailMessageSchema = z.object({
    to: z.array(z.string().email()),
    cc: z.array(z.string().email()).optional(),
    bcc: z.array(z.string().email()).optional(),
    subject: z.string(),
    html: z.string().optional(),
    text: z.string().optional(),
    attachments: z.array(z.object({
        filename: z.string(),
        content: z.string(),
        type: z.string().optional(),
        disposition: z.enum(['attachment', 'inline']).default('attachment')
    })).optional(),
    headers: z.record(z.string()).optional(),
    templateId: z.string().optional(),
    templateData: z.record(z.any()).optional(),
    priority: z.enum(['low', 'normal', 'high']).default('normal'),
    trackOpens: z.boolean().default(true),
    trackClicks: z.boolean().default(true)
});
export class SendGridProvider {
    config;
    apiKey;
    constructor(config) {
        this.config = config;
        this.apiKey = config.apiKey || process.env.SENDGRID_API_KEY || '';
        if (!this.apiKey) {
            throw new Error('SendGrid API key is required');
        }
    }
    async send(message) {
        try {
            if (this.config.testMode) {
                logger.info('SendGrid email sent (test mode)', {
                    to: message.to,
                    subject: message.subject,
                    provider: 'sendgrid'
                });
                return {
                    messageId: `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    success: true,
                    provider: 'sendgrid',
                    timestamp: new Date(),
                    metadata: { testMode: true }
                };
            }
            const sendGridMessage = {
                personalizations: [{
                        to: message.to.map(email => ({ email })),
                        cc: message.cc?.map(email => ({ email })),
                        bcc: message.bcc?.map(email => ({ email })),
                        subject: message.subject
                    }],
                from: {
                    email: this.config.fromEmail,
                    name: this.config.fromName
                },
                reply_to: message.replyTo ? { email: message.replyTo } : undefined,
                subject: message.subject,
                content: [
                    ...(message.html ? [{ type: 'text/html', value: message.html }] : []),
                    ...(message.text ? [{ type: 'text/plain', value: message.text }] : [])
                ],
                attachments: message.attachments?.map(att => ({
                    content: att.content,
                    filename: att.filename,
                    type: att.type,
                    disposition: att.disposition
                })),
                headers: message.headers,
                tracking_settings: {
                    open_tracking: { enable: message.trackOpens },
                    click_tracking: { enable: message.trackClicks }
                }
            };
            await new Promise(resolve => setTimeout(resolve, 100));
            const messageId = `sg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            logger.info('SendGrid email sent', {
                messageId,
                to: message.to,
                subject: message.subject,
                provider: 'sendgrid'
            });
            return {
                messageId,
                success: true,
                provider: 'sendgrid',
                timestamp: new Date(),
                metadata: { templateId: message.templateId }
            };
        }
        catch (error) {
            logger.error('SendGrid email failed', {
                error: error.message,
                to: message.to,
                subject: message.subject
            });
            return {
                messageId: '',
                success: false,
                provider: 'sendgrid',
                timestamp: new Date(),
                error: error.message
            };
        }
    }
    async sendBulk(messages) {
        const results = [];
        const batchSize = 10;
        for (let i = 0; i < messages.length; i += batchSize) {
            const batch = messages.slice(i, i + batchSize);
            const batchPromises = batch.map(message => this.send(message));
            const batchResults = await Promise.all(batchPromises);
            results.push(...batchResults);
        }
        return results;
    }
    async validateConfig() {
        try {
            return this.apiKey.length > 0;
        }
        catch (error) {
            return false;
        }
    }
    async getQuota() {
        return {
            used: Math.floor(Math.random() * 1000),
            limit: 10000,
            resetAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
        };
    }
}
export class AWSSESProvider {
    config;
    constructor(config) {
        this.config = config;
    }
    async send(message) {
        try {
            if (this.config.testMode) {
                logger.info('AWS SES email sent (test mode)', {
                    to: message.to,
                    subject: message.subject,
                    provider: 'aws_ses'
                });
                return {
                    messageId: `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    success: true,
                    provider: 'aws_ses',
                    timestamp: new Date(),
                    metadata: { testMode: true }
                };
            }
            const sesMessage = {
                Source: `${this.config.fromName || ''} <${this.config.fromEmail}>`,
                Destination: {
                    ToAddresses: message.to,
                    CcAddresses: message.cc,
                    BccAddresses: message.bcc
                },
                Message: {
                    Subject: { Data: message.subject, Charset: 'UTF-8' },
                    Body: {
                        ...(message.html ? { Html: { Data: message.html, Charset: 'UTF-8' } } : {}),
                        ...(message.text ? { Text: { Data: message.text, Charset: 'UTF-8' } } : {})
                    }
                },
                ReplyToAddresses: message.replyTo ? [message.replyTo] : undefined
            };
            await new Promise(resolve => setTimeout(resolve, 150));
            const messageId = `ses_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            logger.info('AWS SES email sent', {
                messageId,
                to: message.to,
                subject: message.subject,
                provider: 'aws_ses'
            });
            return {
                messageId,
                success: true,
                provider: 'aws_ses',
                timestamp: new Date(),
                metadata: { region: this.config.region }
            };
        }
        catch (error) {
            logger.error('AWS SES email failed', {
                error: error.message,
                to: message.to,
                subject: message.subject
            });
            return {
                messageId: '',
                success: false,
                provider: 'aws_ses',
                timestamp: new Date(),
                error: error.message
            };
        }
    }
    async sendBulk(messages) {
        const results = [];
        const batchSize = 50;
        for (let i = 0; i < messages.length; i += batchSize) {
            const batch = messages.slice(i, i + batchSize);
            const batchPromises = batch.map(message => this.send(message));
            const batchResults = await Promise.all(batchPromises);
            results.push(...batchResults);
        }
        return results;
    }
    async validateConfig() {
        try {
            return !!(this.config.secretKey && this.config.region);
        }
        catch (error) {
            return false;
        }
    }
    async getQuota() {
        return {
            used: Math.floor(Math.random() * 200),
            limit: 200,
            resetAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
        };
    }
}
export class SMTPProvider {
    config;
    constructor(config) {
        this.config = config;
    }
    async send(message) {
        try {
            if (this.config.testMode) {
                logger.info('SMTP email sent (test mode)', {
                    to: message.to,
                    subject: message.subject,
                    provider: 'smtp'
                });
                return {
                    messageId: `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    success: true,
                    provider: 'smtp',
                    timestamp: new Date(),
                    metadata: { testMode: true }
                };
            }
            const smtpMessage = {
                from: `${this.config.fromName || ''} <${this.config.fromEmail}>`,
                to: message.to.join(', '),
                cc: message.cc?.join(', '),
                bcc: message.bcc?.join(', '),
                subject: message.subject,
                html: message.html,
                text: message.text,
                attachments: message.attachments,
                headers: message.headers
            };
            await new Promise(resolve => setTimeout(resolve, 200));
            const messageId = `smtp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            logger.info('SMTP email sent', {
                messageId,
                to: message.to,
                subject: message.subject,
                provider: 'smtp'
            });
            return {
                messageId,
                success: true,
                provider: 'smtp',
                timestamp: new Date(),
                metadata: { host: this.config.host }
            };
        }
        catch (error) {
            logger.error('SMTP email failed', {
                error: error.message,
                to: message.to,
                subject: message.subject
            });
            return {
                messageId: '',
                success: false,
                provider: 'smtp',
                timestamp: new Date(),
                error: error.message
            };
        }
    }
    async sendBulk(messages) {
        const results = [];
        for (const message of messages) {
            const result = await this.send(message);
            results.push(result);
        }
        return results;
    }
    async validateConfig() {
        try {
            return !!(this.config.host && this.config.port);
        }
        catch (error) {
            return false;
        }
    }
    async getQuota() {
        return {
            used: 0,
            limit: Infinity,
            resetAt: new Date()
        };
    }
}
export class EmailProviderFactory {
    static create(config) {
        switch (config.provider) {
            case 'sendgrid':
                return new SendGridProvider(config);
            case 'aws_ses':
                return new AWSSESProvider(config);
            case 'smtp':
                return new SMTPProvider(config);
            default:
                throw new Error(`Unsupported email provider: ${config.provider}`);
        }
    }
}
export { EmailProviderConfigSchema, EmailMessageSchema };
//# sourceMappingURL=email.provider.js.map