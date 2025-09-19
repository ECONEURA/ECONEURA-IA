export interface AIPrediction {
    value: number;
    confidence: number;
    timeframe: string;
}
export declare class NextAIPlatformService {
    private logger;
    constructor();
    getPrediction(type: string): Promise<AIPrediction>;
    analyze(data: any): Promise<any>;
}
export declare const nextAIPlatformService: NextAIPlatformService;
//# sourceMappingURL=next-ai-platform.service.d.ts.map