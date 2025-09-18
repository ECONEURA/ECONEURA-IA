import { z } from 'zod';
declare const SMSProviderConfigSchema: z.ZodObject<{
    provider: z.ZodEnum<["twilio", "aws_sns", "vonage"]>;
    accountSid: z.ZodOptional<z.ZodString>;
    authToken: z.ZodOptional<z.ZodString>;
    apiKey: z.ZodOptional<z.ZodString>;
    apiSecret: z.ZodOptional<z.ZodString>;
    region: z.ZodOptional<z.ZodString>;
    fromNumber: z.ZodString;
    testMode: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    provider?: "twilio" | "aws_sns" | "vonage";
    region?: string;
    apiKey?: string;
    testMode?: boolean;
    accountSid?: string;
    authToken?: string;
    apiSecret?: string;
    fromNumber?: string;
}, {
    provider?: "twilio" | "aws_sns" | "vonage";
    region?: string;
    apiKey?: string;
    testMode?: boolean;
    accountSid?: string;
    authToken?: string;
    apiSecret?: string;
    fromNumber?: string;
}>;
declare const SMSMessageSchema: z.ZodObject<{
    to: z.ZodString;
    message: z.ZodString;
    mediaUrl: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    statusCallback: z.ZodOptional<z.ZodString>;
    maxPrice: z.ZodOptional<z.ZodNumber>;
    provideFeedback: z.ZodDefault<z.ZodBoolean>;
    validityPeriod: z.ZodOptional<z.ZodNumber>;
    scheduleTime: z.ZodOptional<z.ZodDate>;
}, "strip", z.ZodTypeAny, {
    message?: string;
    maxPrice?: number;
    to?: string;
    mediaUrl?: string[];
    statusCallback?: string;
    provideFeedback?: boolean;
    validityPeriod?: number;
    scheduleTime?: Date;
}, {
    message?: string;
    maxPrice?: number;
    to?: string;
    mediaUrl?: string[];
    statusCallback?: string;
    provideFeedback?: boolean;
    validityPeriod?: number;
    scheduleTime?: Date;
}>;
export interface SMSProviderConfig {
    provider: 'twilio' | 'aws_sns' | 'vonage';
    accountSid?: string;
    authToken?: string;
    apiKey?: string;
    apiSecret?: string;
    region?: string;
    fromNumber: string;
    testMode?: boolean;
}
export interface SMSMessage {
    to: string;
    message: string;
    mediaUrl?: string[];
    statusCallback?: string;
    maxPrice?: number;
    provideFeedback?: boolean;
    validityPeriod?: number;
    scheduleTime?: Date;
}
export interface SMSResult {
    messageId: string;
    success: boolean;
    provider: string;
    timestamp: Date;
    error?: string;
    metadata?: {
        price?: string;
        currency?: string;
        segments?: number;
        status?: string;
    };
}
export interface ISMSProvider {
    send(message: SMSMessage): Promise<SMSResult>;
    sendBulk(messages: SMSMessage[]): Promise<SMSResult[]>;
    validateConfig(): Promise<boolean>;
    getQuota(): Promise<{
        used: number;
        limit: number;
        resetAt: Date;
    }>;
    getMessageStatus(messageId: string): Promise<{
        status: string;
        errorCode?: string;
    }>;
}
export declare class TwilioProvider implements ISMSProvider {
    private config;
    private accountSid;
    private authToken;
    constructor(config: SMSProviderConfig);
    send(message: SMSMessage): Promise<SMSResult>;
    sendBulk(messages: SMSMessage[]): Promise<SMSResult[]>;
    validateConfig(): Promise<boolean>;
    getQuota(): Promise<{
        used: number;
        limit: number;
        resetAt: Date;
    }>;
    getMessageStatus(messageId: string): Promise<{
        status: string;
        errorCode?: string;
    }>;
}
export declare class AWSSNSProvider implements ISMSProvider {
    private config;
    constructor(config: SMSProviderConfig);
    send(message: SMSMessage): Promise<SMSResult>;
    sendBulk(messages: SMSMessage[]): Promise<SMSResult[]>;
    validateConfig(): Promise<boolean>;
    getQuota(): Promise<{
        used: number;
        limit: number;
        resetAt: Date;
    }>;
    getMessageStatus(messageId: string): Promise<{
        status: string;
        errorCode?: string;
    }>;
}
export declare class VonageProvider implements ISMSProvider {
    private config;
    private apiKey;
    private apiSecret;
    constructor(config: SMSProviderConfig);
    send(message: SMSMessage): Promise<SMSResult>;
    sendBulk(messages: SMSMessage[]): Promise<SMSResult[]>;
    validateConfig(): Promise<boolean>;
    getQuota(): Promise<{
        used: number;
        limit: number;
        resetAt: Date;
    }>;
    getMessageStatus(messageId: string): Promise<{
        status: string;
        errorCode?: string;
    }>;
}
export declare class SMSProviderFactory {
    static create(config: SMSProviderConfig): ISMSProvider;
}
export { SMSProviderConfigSchema, SMSMessageSchema };
//# sourceMappingURL=sms.provider.d.ts.map