export interface BaseRequest {
    organizationId: string;
    createdBy?: string;
    updatedBy?: string;
}
export interface BaseResponse {
    success: true;
    data: any;
    message?: string;
}
export interface BaseError {
    success: false;
    error: {
        code: string;
        message: string;
        details?: any;
    };
}
export declare abstract class BaseUseCase<RequestType extends BaseRequest, ResponseType extends BaseResponse> {
    protected validateBaseRequest(request: RequestType): void;
    protected validateId(id: string, fieldName?: string): void;
    protected validateString(value: string, fieldName: string, minLength?: number, maxLength?: number): void;
    protected validateEmail(email: string): void;
    protected validateUrl(url: string, fieldName?: string): void;
    protected validateUuid(uuid: string, fieldName?: string): void;
    protected generateId(): string;
    protected getCurrentTimestamp(): Date;
    protected sanitizeString(value: string): string;
    protected createSuccessResponse(data: any, message?: string): ResponseType;
    protected createErrorResponse(code: string, message: string, details?: any): BaseError;
    abstract execute(request: RequestType): Promise<ResponseType>;
}
//# sourceMappingURL=base.use-case.d.ts.map