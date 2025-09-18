import { z } from 'zod';
declare const EmailProviderConfigSchema: z.ZodObject<{
    provider: z.ZodEnum<["sendgrid", "aws_ses", "smtp"]>;
    apiKey: z.ZodOptional<z.ZodString>;
    secretKey: z.ZodOptional<z.ZodString>;
    region: z.ZodOptional<z.ZodString>;
    host: z.ZodOptional<z.ZodString>;
    port: z.ZodOptional<z.ZodNumber>;
    username: z.ZodOptional<z.ZodString>;
    password: z.ZodOptional<z.ZodString>;
    fromEmail: z.ZodString;
    fromName: z.ZodOptional<z.ZodString>;
    replyTo: z.ZodOptional<z.ZodString>;
    testMode: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    password?: string;
    provider?: "sendgrid" | "aws_ses" | "smtp";
    region?: string;
    apiKey?: string;
    secretKey?: string;
    host?: string;
    port?: number;
    username?: string;
    fromEmail?: string;
    fromName?: string;
    replyTo?: string;
    testMode?: boolean;
}, {
    password?: string;
    provider?: "sendgrid" | "aws_ses" | "smtp";
    region?: string;
    apiKey?: string;
    secretKey?: string;
    host?: string;
    port?: number;
    username?: string;
    fromEmail?: string;
    fromName?: string;
    replyTo?: string;
    testMode?: boolean;
}>;
declare const EmailMessageSchema: z.ZodObject<{
    to: z.ZodArray<z.ZodString, "many">;
    cc: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    bcc: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    subject: z.ZodString;
    html: z.ZodOptional<z.ZodString>;
    text: z.ZodOptional<z.ZodString>;
    attachments: z.ZodOptional<z.ZodArray<z.ZodObject<{
        filename: z.ZodString;
        content: z.ZodString;
        type: z.ZodOptional<z.ZodString>;
        disposition: z.ZodDefault<z.ZodEnum<["attachment", "inline"]>>;
    }, "strip", z.ZodTypeAny, {
        type?: string;
        filename?: string;
        content?: string;
        disposition?: "attachment" | "inline";
    }, {
        type?: string;
        filename?: string;
        content?: string;
        disposition?: "attachment" | "inline";
    }>, "many">>;
    headers: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    templateId: z.ZodOptional<z.ZodString>;
    templateData: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    priority: z.ZodDefault<z.ZodEnum<["low", "normal", "high"]>>;
    trackOpens: z.ZodDefault<z.ZodBoolean>;
    trackClicks: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    headers?: Record<string, string>;
    subject?: string;
    text?: string;
    html?: string;
    to?: string[];
    cc?: string[];
    bcc?: string[];
    attachments?: {
        type?: string;
        filename?: string;
        content?: string;
        disposition?: "attachment" | "inline";
    }[];
    templateId?: string;
    templateData?: Record<string, any>;
    priority?: "low" | "high" | "normal";
    trackOpens?: boolean;
    trackClicks?: boolean;
}, {
    headers?: Record<string, string>;
    subject?: string;
    text?: string;
    html?: string;
    to?: string[];
    cc?: string[];
    bcc?: string[];
    attachments?: {
        type?: string;
        filename?: string;
        content?: string;
        disposition?: "attachment" | "inline";
    }[];
    templateId?: string;
    templateData?: Record<string, any>;
    priority?: "low" | "high" | "normal";
    trackOpens?: boolean;
    trackClicks?: boolean;
}>;
export interface EmailProviderConfig {
    provider: 'sendgrid' | 'aws_ses' | 'smtp';
    apiKey?: string;
    secretKey?: string;
    region?: string;
    host?: string;
    port?: number;
    username?: string;
    password?: string;
    fromEmail: string;
    fromName?: string;
    replyTo?: string;
    testMode?: boolean;
}
export interface EmailMessage {
    to: string[];
    cc?: string[];
    bcc?: string[];
    subject: string;
    html?: string;
    text?: string;
    attachments?: Array<{
        filename: string;
        content: string;
        type?: string;
        disposition?: 'attachment' | 'inline';
    }>;
    headers?: Record<string, string>;
    templateId?: string;
    templateData?: Record<string, any>;
    priority?: 'low' | 'normal' | 'high';
    trackOpens?: boolean;
    trackClicks?: boolean;
}
export interface EmailResult {
    messageId: string;
    success: boolean;
    provider: string;
    timestamp: Date;
    error?: string;
    metadata?: Record<string, any>;
}
export interface IEmailProvider {
    send(message: EmailMessage): Promise<EmailResult>;
    sendBulk(messages: EmailMessage[]): Promise<EmailResult[]>;
    validateConfig(): Promise<boolean>;
    getQuota(): Promise<{
        used: number;
        limit: number;
        resetAt: Date;
    }>;
}
export declare class SendGridProvider implements IEmailProvider {
    private config;
    private apiKey;
    constructor(config: EmailProviderConfig);
    send(message: EmailMessage): Promise<EmailResult>;
    sendBulk(messages: EmailMessage[]): Promise<EmailResult[]>;
    validateConfig(): Promise<boolean>;
    getQuota(): Promise<{
        used: number;
        limit: number;
        resetAt: Date;
    }>;
}
export declare class AWSSESProvider implements IEmailProvider {
    private config;
    constructor(config: EmailProviderConfig);
    send(message: EmailMessage): Promise<EmailResult>;
    sendBulk(messages: EmailMessage[]): Promise<EmailResult[]>;
    validateConfig(): Promise<boolean>;
    getQuota(): Promise<{
        used: number;
        limit: number;
        resetAt: Date;
    }>;
}
export declare class SMTPProvider implements IEmailProvider {
    private config;
    constructor(config: EmailProviderConfig);
    send(message: EmailMessage): Promise<EmailResult>;
    sendBulk(messages: EmailMessage[]): Promise<EmailResult[]>;
    validateConfig(): Promise<boolean>;
    getQuota(): Promise<{
        used: number;
        limit: number;
        resetAt: Date;
    }>;
}
export declare class EmailProviderFactory {
    static create(config: EmailProviderConfig): IEmailProvider;
}
export { EmailProviderConfigSchema, EmailMessageSchema };
//# sourceMappingURL=email.provider.d.ts.map