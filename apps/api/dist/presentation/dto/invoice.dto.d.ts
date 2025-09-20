import { z } from 'zod';
export declare const CreateInvoiceRequestSchema: z.ZodEffects<z.ZodObject<{
    organizationId: z.ZodString;
    invoiceNumber: z.ZodString;
    type: z.ZodEnum<["invoice", "credit_note", "debit_note", "proforma", "quote", "receipt"]>;
    status: z.ZodEnum<["draft", "sent", "paid", "overdue", "cancelled", "refunded", "partially_paid"]>;
    paymentStatus: z.ZodEnum<["pending", "paid", "partial", "overdue", "cancelled"]>;
    companyId: z.ZodString;
    contactId: z.ZodOptional<z.ZodString>;
    issueDate: z.ZodDate;
    dueDate: z.ZodDate;
    paidDate: z.ZodOptional<z.ZodDate>;
    items: z.ZodArray<z.ZodObject<{
        productId: z.ZodOptional<z.ZodString>;
        description: z.ZodString;
        quantity: z.ZodNumber;
        unitPrice: z.ZodObject<{
            amount: z.ZodNumber;
            currency: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            amount?: number;
            currency?: string;
        }, {
            amount?: number;
            currency?: string;
        }>;
        totalPrice: z.ZodObject<{
            amount: z.ZodNumber;
            currency: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            amount?: number;
            currency?: string;
        }, {
            amount?: number;
            currency?: string;
        }>;
        taxRate: z.ZodOptional<z.ZodNumber>;
        taxAmount: z.ZodOptional<z.ZodObject<{
            amount: z.ZodNumber;
            currency: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            amount?: number;
            currency?: string;
        }, {
            amount?: number;
            currency?: string;
        }>>;
        discountRate: z.ZodOptional<z.ZodNumber>;
        discountAmount: z.ZodOptional<z.ZodObject<{
            amount: z.ZodNumber;
            currency: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            amount?: number;
            currency?: string;
        }, {
            amount?: number;
            currency?: string;
        }>>;
        notes: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        description?: string;
        notes?: string;
        quantity?: number;
        taxAmount?: {
            amount?: number;
            currency?: string;
        };
        taxRate?: number;
        unitPrice?: {
            amount?: number;
            currency?: string;
        };
        discountAmount?: {
            amount?: number;
            currency?: string;
        };
        productId?: string;
        totalPrice?: {
            amount?: number;
            currency?: string;
        };
        discountRate?: number;
    }, {
        description?: string;
        notes?: string;
        quantity?: number;
        taxAmount?: {
            amount?: number;
            currency?: string;
        };
        taxRate?: number;
        unitPrice?: {
            amount?: number;
            currency?: string;
        };
        discountAmount?: {
            amount?: number;
            currency?: string;
        };
        productId?: string;
        totalPrice?: {
            amount?: number;
            currency?: string;
        };
        discountRate?: number;
    }>, "many">;
    paymentMethod: z.ZodOptional<z.ZodEnum<["cash", "credit_card", "bank_transfer", "check", "paypal", "stripe", "other"]>>;
    reference: z.ZodOptional<z.ZodString>;
    notes: z.ZodDefault<z.ZodString>;
    settings: z.ZodObject<{
        currency: z.ZodString;
        taxInclusive: z.ZodDefault<z.ZodBoolean>;
        defaultTaxRate: z.ZodDefault<z.ZodNumber>;
        paymentTerms: z.ZodDefault<z.ZodNumber>;
        lateFeeRate: z.ZodOptional<z.ZodNumber>;
        lateFeeAmount: z.ZodOptional<z.ZodObject<{
            amount: z.ZodNumber;
            currency: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            amount?: number;
            currency?: string;
        }, {
            amount?: number;
            currency?: string;
        }>>;
        notes: z.ZodOptional<z.ZodString>;
        footer: z.ZodOptional<z.ZodString>;
        customFields: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodAny>>;
        tags: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        tags?: string[];
        currency?: string;
        notes?: string;
        footer?: string;
        customFields?: Record<string, any>;
        paymentTerms?: number;
        taxInclusive?: boolean;
        defaultTaxRate?: number;
        lateFeeRate?: number;
        lateFeeAmount?: {
            amount?: number;
            currency?: string;
        };
    }, {
        tags?: string[];
        currency?: string;
        notes?: string;
        footer?: string;
        customFields?: Record<string, any>;
        paymentTerms?: number;
        taxInclusive?: boolean;
        defaultTaxRate?: number;
        lateFeeRate?: number;
        lateFeeAmount?: {
            amount?: number;
            currency?: string;
        };
    }>;
    attachments: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    type?: "invoice" | "credit_note" | "debit_note" | "proforma" | "quote" | "receipt";
    status?: "cancelled" | "draft" | "sent" | "paid" | "overdue" | "refunded" | "partially_paid";
    organizationId?: string;
    companyId?: string;
    contactId?: string;
    notes?: string;
    settings?: {
        tags?: string[];
        currency?: string;
        notes?: string;
        footer?: string;
        customFields?: Record<string, any>;
        paymentTerms?: number;
        taxInclusive?: boolean;
        defaultTaxRate?: number;
        lateFeeRate?: number;
        lateFeeAmount?: {
            amount?: number;
            currency?: string;
        };
    };
    invoiceNumber?: string;
    issueDate?: Date;
    dueDate?: Date;
    paidDate?: Date;
    items?: {
        description?: string;
        notes?: string;
        quantity?: number;
        taxAmount?: {
            amount?: number;
            currency?: string;
        };
        taxRate?: number;
        unitPrice?: {
            amount?: number;
            currency?: string;
        };
        discountAmount?: {
            amount?: number;
            currency?: string;
        };
        productId?: string;
        totalPrice?: {
            amount?: number;
            currency?: string;
        };
        discountRate?: number;
    }[];
    reference?: string;
    paymentStatus?: "pending" | "cancelled" | "paid" | "overdue" | "partial";
    paymentMethod?: "cash" | "bank_transfer" | "credit_card" | "paypal" | "stripe" | "check" | "other";
    attachments?: string[];
}, {
    type?: "invoice" | "credit_note" | "debit_note" | "proforma" | "quote" | "receipt";
    status?: "cancelled" | "draft" | "sent" | "paid" | "overdue" | "refunded" | "partially_paid";
    organizationId?: string;
    companyId?: string;
    contactId?: string;
    notes?: string;
    settings?: {
        tags?: string[];
        currency?: string;
        notes?: string;
        footer?: string;
        customFields?: Record<string, any>;
        paymentTerms?: number;
        taxInclusive?: boolean;
        defaultTaxRate?: number;
        lateFeeRate?: number;
        lateFeeAmount?: {
            amount?: number;
            currency?: string;
        };
    };
    invoiceNumber?: string;
    issueDate?: Date;
    dueDate?: Date;
    paidDate?: Date;
    items?: {
        description?: string;
        notes?: string;
        quantity?: number;
        taxAmount?: {
            amount?: number;
            currency?: string;
        };
        taxRate?: number;
        unitPrice?: {
            amount?: number;
            currency?: string;
        };
        discountAmount?: {
            amount?: number;
            currency?: string;
        };
        productId?: string;
        totalPrice?: {
            amount?: number;
            currency?: string;
        };
        discountRate?: number;
    }[];
    reference?: string;
    paymentStatus?: "pending" | "cancelled" | "paid" | "overdue" | "partial";
    paymentMethod?: "cash" | "bank_transfer" | "credit_card" | "paypal" | "stripe" | "check" | "other";
    attachments?: string[];
}>, {
    type?: "invoice" | "credit_note" | "debit_note" | "proforma" | "quote" | "receipt";
    status?: "cancelled" | "draft" | "sent" | "paid" | "overdue" | "refunded" | "partially_paid";
    organizationId?: string;
    companyId?: string;
    contactId?: string;
    notes?: string;
    settings?: {
        tags?: string[];
        currency?: string;
        notes?: string;
        footer?: string;
        customFields?: Record<string, any>;
        paymentTerms?: number;
        taxInclusive?: boolean;
        defaultTaxRate?: number;
        lateFeeRate?: number;
        lateFeeAmount?: {
            amount?: number;
            currency?: string;
        };
    };
    invoiceNumber?: string;
    issueDate?: Date;
    dueDate?: Date;
    paidDate?: Date;
    items?: {
        description?: string;
        notes?: string;
        quantity?: number;
        taxAmount?: {
            amount?: number;
            currency?: string;
        };
        taxRate?: number;
        unitPrice?: {
            amount?: number;
            currency?: string;
        };
        discountAmount?: {
            amount?: number;
            currency?: string;
        };
        productId?: string;
        totalPrice?: {
            amount?: number;
            currency?: string;
        };
        discountRate?: number;
    }[];
    reference?: string;
    paymentStatus?: "pending" | "cancelled" | "paid" | "overdue" | "partial";
    paymentMethod?: "cash" | "bank_transfer" | "credit_card" | "paypal" | "stripe" | "check" | "other";
    attachments?: string[];
}, {
    type?: "invoice" | "credit_note" | "debit_note" | "proforma" | "quote" | "receipt";
    status?: "cancelled" | "draft" | "sent" | "paid" | "overdue" | "refunded" | "partially_paid";
    organizationId?: string;
    companyId?: string;
    contactId?: string;
    notes?: string;
    settings?: {
        tags?: string[];
        currency?: string;
        notes?: string;
        footer?: string;
        customFields?: Record<string, any>;
        paymentTerms?: number;
        taxInclusive?: boolean;
        defaultTaxRate?: number;
        lateFeeRate?: number;
        lateFeeAmount?: {
            amount?: number;
            currency?: string;
        };
    };
    invoiceNumber?: string;
    issueDate?: Date;
    dueDate?: Date;
    paidDate?: Date;
    items?: {
        description?: string;
        notes?: string;
        quantity?: number;
        taxAmount?: {
            amount?: number;
            currency?: string;
        };
        taxRate?: number;
        unitPrice?: {
            amount?: number;
            currency?: string;
        };
        discountAmount?: {
            amount?: number;
            currency?: string;
        };
        productId?: string;
        totalPrice?: {
            amount?: number;
            currency?: string;
        };
        discountRate?: number;
    }[];
    reference?: string;
    paymentStatus?: "pending" | "cancelled" | "paid" | "overdue" | "partial";
    paymentMethod?: "cash" | "bank_transfer" | "credit_card" | "paypal" | "stripe" | "check" | "other";
    attachments?: string[];
}>;
export declare const UpdateInvoiceRequestSchema: z.ZodObject<{
    invoiceNumber: z.ZodOptional<z.ZodString>;
    type: z.ZodOptional<z.ZodEnum<["invoice", "credit_note", "debit_note", "proforma", "quote", "receipt"]>>;
    status: z.ZodOptional<z.ZodEnum<["draft", "sent", "paid", "overdue", "cancelled", "refunded", "partially_paid"]>>;
    paymentStatus: z.ZodOptional<z.ZodEnum<["pending", "paid", "partial", "overdue", "cancelled"]>>;
    companyId: z.ZodOptional<z.ZodString>;
    contactId: z.ZodOptional<z.ZodString>;
    issueDate: z.ZodOptional<z.ZodDate>;
    dueDate: z.ZodOptional<z.ZodDate>;
    paidDate: z.ZodOptional<z.ZodDate>;
    items: z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodOptional<z.ZodString>;
        productId: z.ZodOptional<z.ZodString>;
        description: z.ZodString;
        quantity: z.ZodNumber;
        unitPrice: z.ZodObject<{
            amount: z.ZodNumber;
            currency: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            amount?: number;
            currency?: string;
        }, {
            amount?: number;
            currency?: string;
        }>;
        totalPrice: z.ZodObject<{
            amount: z.ZodNumber;
            currency: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            amount?: number;
            currency?: string;
        }, {
            amount?: number;
            currency?: string;
        }>;
        taxRate: z.ZodOptional<z.ZodNumber>;
        taxAmount: z.ZodOptional<z.ZodObject<{
            amount: z.ZodNumber;
            currency: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            amount?: number;
            currency?: string;
        }, {
            amount?: number;
            currency?: string;
        }>>;
        discountRate: z.ZodOptional<z.ZodNumber>;
        discountAmount: z.ZodOptional<z.ZodObject<{
            amount: z.ZodNumber;
            currency: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            amount?: number;
            currency?: string;
        }, {
            amount?: number;
            currency?: string;
        }>>;
        notes: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        id?: string;
        description?: string;
        notes?: string;
        quantity?: number;
        taxAmount?: {
            amount?: number;
            currency?: string;
        };
        taxRate?: number;
        unitPrice?: {
            amount?: number;
            currency?: string;
        };
        discountAmount?: {
            amount?: number;
            currency?: string;
        };
        productId?: string;
        totalPrice?: {
            amount?: number;
            currency?: string;
        };
        discountRate?: number;
    }, {
        id?: string;
        description?: string;
        notes?: string;
        quantity?: number;
        taxAmount?: {
            amount?: number;
            currency?: string;
        };
        taxRate?: number;
        unitPrice?: {
            amount?: number;
            currency?: string;
        };
        discountAmount?: {
            amount?: number;
            currency?: string;
        };
        productId?: string;
        totalPrice?: {
            amount?: number;
            currency?: string;
        };
        discountRate?: number;
    }>, "many">>;
    paymentMethod: z.ZodOptional<z.ZodEnum<["cash", "credit_card", "bank_transfer", "check", "paypal", "stripe", "other"]>>;
    reference: z.ZodOptional<z.ZodString>;
    notes: z.ZodOptional<z.ZodDefault<z.ZodString>>;
    settings: z.ZodOptional<z.ZodObject<{
        currency: z.ZodOptional<z.ZodString>;
        taxInclusive: z.ZodOptional<z.ZodBoolean>;
        defaultTaxRate: z.ZodOptional<z.ZodNumber>;
        paymentTerms: z.ZodOptional<z.ZodNumber>;
        lateFeeRate: z.ZodOptional<z.ZodNumber>;
        lateFeeAmount: z.ZodOptional<z.ZodObject<{
            amount: z.ZodNumber;
            currency: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            amount?: number;
            currency?: string;
        }, {
            amount?: number;
            currency?: string;
        }>>;
        notes: z.ZodOptional<z.ZodString>;
        footer: z.ZodOptional<z.ZodString>;
        customFields: z.ZodOptional<z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodAny>>>;
        tags: z.ZodOptional<z.ZodDefault<z.ZodArray<z.ZodString, "many">>>;
    }, "strip", z.ZodTypeAny, {
        tags?: string[];
        currency?: string;
        notes?: string;
        footer?: string;
        customFields?: Record<string, any>;
        paymentTerms?: number;
        taxInclusive?: boolean;
        defaultTaxRate?: number;
        lateFeeRate?: number;
        lateFeeAmount?: {
            amount?: number;
            currency?: string;
        };
    }, {
        tags?: string[];
        currency?: string;
        notes?: string;
        footer?: string;
        customFields?: Record<string, any>;
        paymentTerms?: number;
        taxInclusive?: boolean;
        defaultTaxRate?: number;
        lateFeeRate?: number;
        lateFeeAmount?: {
            amount?: number;
            currency?: string;
        };
    }>>;
    attachments: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    type?: "invoice" | "credit_note" | "debit_note" | "proforma" | "quote" | "receipt";
    status?: "cancelled" | "draft" | "sent" | "paid" | "overdue" | "refunded" | "partially_paid";
    companyId?: string;
    contactId?: string;
    notes?: string;
    settings?: {
        tags?: string[];
        currency?: string;
        notes?: string;
        footer?: string;
        customFields?: Record<string, any>;
        paymentTerms?: number;
        taxInclusive?: boolean;
        defaultTaxRate?: number;
        lateFeeRate?: number;
        lateFeeAmount?: {
            amount?: number;
            currency?: string;
        };
    };
    invoiceNumber?: string;
    issueDate?: Date;
    dueDate?: Date;
    paidDate?: Date;
    items?: {
        id?: string;
        description?: string;
        notes?: string;
        quantity?: number;
        taxAmount?: {
            amount?: number;
            currency?: string;
        };
        taxRate?: number;
        unitPrice?: {
            amount?: number;
            currency?: string;
        };
        discountAmount?: {
            amount?: number;
            currency?: string;
        };
        productId?: string;
        totalPrice?: {
            amount?: number;
            currency?: string;
        };
        discountRate?: number;
    }[];
    reference?: string;
    paymentStatus?: "pending" | "cancelled" | "paid" | "overdue" | "partial";
    paymentMethod?: "cash" | "bank_transfer" | "credit_card" | "paypal" | "stripe" | "check" | "other";
    attachments?: string[];
}, {
    type?: "invoice" | "credit_note" | "debit_note" | "proforma" | "quote" | "receipt";
    status?: "cancelled" | "draft" | "sent" | "paid" | "overdue" | "refunded" | "partially_paid";
    companyId?: string;
    contactId?: string;
    notes?: string;
    settings?: {
        tags?: string[];
        currency?: string;
        notes?: string;
        footer?: string;
        customFields?: Record<string, any>;
        paymentTerms?: number;
        taxInclusive?: boolean;
        defaultTaxRate?: number;
        lateFeeRate?: number;
        lateFeeAmount?: {
            amount?: number;
            currency?: string;
        };
    };
    invoiceNumber?: string;
    issueDate?: Date;
    dueDate?: Date;
    paidDate?: Date;
    items?: {
        id?: string;
        description?: string;
        notes?: string;
        quantity?: number;
        taxAmount?: {
            amount?: number;
            currency?: string;
        };
        taxRate?: number;
        unitPrice?: {
            amount?: number;
            currency?: string;
        };
        discountAmount?: {
            amount?: number;
            currency?: string;
        };
        productId?: string;
        totalPrice?: {
            amount?: number;
            currency?: string;
        };
        discountRate?: number;
    }[];
    reference?: string;
    paymentStatus?: "pending" | "cancelled" | "paid" | "overdue" | "partial";
    paymentMethod?: "cash" | "bank_transfer" | "credit_card" | "paypal" | "stripe" | "check" | "other";
    attachments?: string[];
}>;
export declare const InvoiceIdParamSchema: z.ZodObject<{
    id: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id?: string;
}, {
    id?: string;
}>;
export declare const InvoiceOrganizationIdParamSchema: z.ZodObject<{
    organizationId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    organizationId?: string;
}, {
    organizationId?: string;
}>;
export declare const InvoiceSearchQuerySchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
    sortBy: z.ZodDefault<z.ZodString>;
    sortOrder: z.ZodDefault<z.ZodEnum<["asc", "desc"]>>;
} & {
    search: z.ZodOptional<z.ZodString>;
} & {
    type: z.ZodOptional<z.ZodEnum<["invoice", "credit_note", "debit_note", "proforma", "quote", "receipt"]>>;
    status: z.ZodOptional<z.ZodEnum<["draft", "sent", "paid", "overdue", "cancelled", "refunded", "partially_paid"]>>;
    paymentStatus: z.ZodOptional<z.ZodEnum<["pending", "paid", "partial", "overdue", "cancelled"]>>;
    companyId: z.ZodOptional<z.ZodString>;
    contactId: z.ZodOptional<z.ZodString>;
    issueDateFrom: z.ZodOptional<z.ZodDate>;
    issueDateTo: z.ZodOptional<z.ZodDate>;
    dueDateFrom: z.ZodOptional<z.ZodDate>;
    dueDateTo: z.ZodOptional<z.ZodDate>;
    minAmount: z.ZodOptional<z.ZodNumber>;
    maxAmount: z.ZodOptional<z.ZodNumber>;
    isOverdue: z.ZodOptional<z.ZodBoolean>;
    isPaid: z.ZodOptional<z.ZodBoolean>;
    isPartiallyPaid: z.ZodOptional<z.ZodBoolean>;
    isPending: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    type?: "invoice" | "credit_note" | "debit_note" | "proforma" | "quote" | "receipt";
    status?: "cancelled" | "draft" | "sent" | "paid" | "overdue" | "refunded" | "partially_paid";
    page?: number;
    limit?: number;
    companyId?: string;
    contactId?: string;
    minAmount?: number;
    maxAmount?: number;
    search?: string;
    paymentStatus?: "pending" | "cancelled" | "paid" | "overdue" | "partial";
    issueDateFrom?: Date;
    issueDateTo?: Date;
    dueDateFrom?: Date;
    dueDateTo?: Date;
    isOverdue?: boolean;
    isPaid?: boolean;
    isPartiallyPaid?: boolean;
    isPending?: boolean;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
}, {
    type?: "invoice" | "credit_note" | "debit_note" | "proforma" | "quote" | "receipt";
    status?: "cancelled" | "draft" | "sent" | "paid" | "overdue" | "refunded" | "partially_paid";
    page?: number;
    limit?: number;
    companyId?: string;
    contactId?: string;
    minAmount?: number;
    maxAmount?: number;
    search?: string;
    paymentStatus?: "pending" | "cancelled" | "paid" | "overdue" | "partial";
    issueDateFrom?: Date;
    issueDateTo?: Date;
    dueDateFrom?: Date;
    dueDateTo?: Date;
    isOverdue?: boolean;
    isPaid?: boolean;
    isPartiallyPaid?: boolean;
    isPending?: boolean;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
}>;
export declare const InvoiceBulkUpdateSchema: z.ZodObject<{
    ids: z.ZodArray<z.ZodString, "many">;
    updates: z.ZodObject<{
        status: z.ZodOptional<z.ZodEnum<["draft", "sent", "paid", "overdue", "cancelled", "refunded", "partially_paid"]>>;
        paymentStatus: z.ZodOptional<z.ZodEnum<["pending", "paid", "partial", "overdue", "cancelled"]>>;
        tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        status?: "cancelled" | "draft" | "sent" | "paid" | "overdue" | "refunded" | "partially_paid";
        tags?: string[];
        paymentStatus?: "pending" | "cancelled" | "paid" | "overdue" | "partial";
    }, {
        status?: "cancelled" | "draft" | "sent" | "paid" | "overdue" | "refunded" | "partially_paid";
        tags?: string[];
        paymentStatus?: "pending" | "cancelled" | "paid" | "overdue" | "partial";
    }>;
}, "strip", z.ZodTypeAny, {
    updates?: {
        status?: "cancelled" | "draft" | "sent" | "paid" | "overdue" | "refunded" | "partially_paid";
        tags?: string[];
        paymentStatus?: "pending" | "cancelled" | "paid" | "overdue" | "partial";
    };
    ids?: string[];
}, {
    updates?: {
        status?: "cancelled" | "draft" | "sent" | "paid" | "overdue" | "refunded" | "partially_paid";
        tags?: string[];
        paymentStatus?: "pending" | "cancelled" | "paid" | "overdue" | "partial";
    };
    ids?: string[];
}>;
export declare const InvoiceBulkDeleteSchema: z.ZodObject<{
    ids: z.ZodArray<z.ZodString, "many">;
}, "strip", z.ZodTypeAny, {
    ids?: string[];
}, {
    ids?: string[];
}>;
export declare const InvoiceItemResponseSchema: z.ZodObject<{
    id: z.ZodString;
    productId: z.ZodOptional<z.ZodString>;
    description: z.ZodString;
    quantity: z.ZodNumber;
    unitPrice: z.ZodObject<{
        amount: z.ZodNumber;
        currency: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        amount?: number;
        currency?: string;
    }, {
        amount?: number;
        currency?: string;
    }>;
    totalPrice: z.ZodObject<{
        amount: z.ZodNumber;
        currency: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        amount?: number;
        currency?: string;
    }, {
        amount?: number;
        currency?: string;
    }>;
    taxRate: z.ZodOptional<z.ZodNumber>;
    taxAmount: z.ZodOptional<z.ZodObject<{
        amount: z.ZodNumber;
        currency: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        amount?: number;
        currency?: string;
    }, {
        amount?: number;
        currency?: string;
    }>>;
    discountRate: z.ZodOptional<z.ZodNumber>;
    discountAmount: z.ZodOptional<z.ZodObject<{
        amount: z.ZodNumber;
        currency: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        amount?: number;
        currency?: string;
    }, {
        amount?: number;
        currency?: string;
    }>>;
    notes: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    id?: string;
    description?: string;
    notes?: string;
    quantity?: number;
    taxAmount?: {
        amount?: number;
        currency?: string;
    };
    taxRate?: number;
    unitPrice?: {
        amount?: number;
        currency?: string;
    };
    discountAmount?: {
        amount?: number;
        currency?: string;
    };
    productId?: string;
    totalPrice?: {
        amount?: number;
        currency?: string;
    };
    discountRate?: number;
}, {
    id?: string;
    description?: string;
    notes?: string;
    quantity?: number;
    taxAmount?: {
        amount?: number;
        currency?: string;
    };
    taxRate?: number;
    unitPrice?: {
        amount?: number;
        currency?: string;
    };
    discountAmount?: {
        amount?: number;
        currency?: string;
    };
    productId?: string;
    totalPrice?: {
        amount?: number;
        currency?: string;
    };
    discountRate?: number;
}>;
export declare const InvoiceResponseSchema: z.ZodObject<{
    id: z.ZodString;
    organizationId: z.ZodString;
    invoiceNumber: z.ZodString;
    type: z.ZodEnum<["invoice", "credit_note", "debit_note", "proforma", "quote", "receipt"]>;
    status: z.ZodEnum<["draft", "sent", "paid", "overdue", "cancelled", "refunded", "partially_paid"]>;
    paymentStatus: z.ZodEnum<["pending", "paid", "partial", "overdue", "cancelled"]>;
    companyId: z.ZodString;
    contactId: z.ZodOptional<z.ZodString>;
    issueDate: z.ZodDate;
    dueDate: z.ZodDate;
    paidDate: z.ZodOptional<z.ZodDate>;
    subtotal: z.ZodObject<{
        amount: z.ZodNumber;
        currency: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        amount?: number;
        currency?: string;
    }, {
        amount?: number;
        currency?: string;
    }>;
    taxAmount: z.ZodObject<{
        amount: z.ZodNumber;
        currency: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        amount?: number;
        currency?: string;
    }, {
        amount?: number;
        currency?: string;
    }>;
    discountAmount: z.ZodObject<{
        amount: z.ZodNumber;
        currency: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        amount?: number;
        currency?: string;
    }, {
        amount?: number;
        currency?: string;
    }>;
    totalAmount: z.ZodObject<{
        amount: z.ZodNumber;
        currency: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        amount?: number;
        currency?: string;
    }, {
        amount?: number;
        currency?: string;
    }>;
    paidAmount: z.ZodObject<{
        amount: z.ZodNumber;
        currency: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        amount?: number;
        currency?: string;
    }, {
        amount?: number;
        currency?: string;
    }>;
    balanceAmount: z.ZodObject<{
        amount: z.ZodNumber;
        currency: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        amount?: number;
        currency?: string;
    }, {
        amount?: number;
        currency?: string;
    }>;
    items: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        productId: z.ZodOptional<z.ZodString>;
        description: z.ZodString;
        quantity: z.ZodNumber;
        unitPrice: z.ZodObject<{
            amount: z.ZodNumber;
            currency: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            amount?: number;
            currency?: string;
        }, {
            amount?: number;
            currency?: string;
        }>;
        totalPrice: z.ZodObject<{
            amount: z.ZodNumber;
            currency: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            amount?: number;
            currency?: string;
        }, {
            amount?: number;
            currency?: string;
        }>;
        taxRate: z.ZodOptional<z.ZodNumber>;
        taxAmount: z.ZodOptional<z.ZodObject<{
            amount: z.ZodNumber;
            currency: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            amount?: number;
            currency?: string;
        }, {
            amount?: number;
            currency?: string;
        }>>;
        discountRate: z.ZodOptional<z.ZodNumber>;
        discountAmount: z.ZodOptional<z.ZodObject<{
            amount: z.ZodNumber;
            currency: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            amount?: number;
            currency?: string;
        }, {
            amount?: number;
            currency?: string;
        }>>;
        notes: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        id?: string;
        description?: string;
        notes?: string;
        quantity?: number;
        taxAmount?: {
            amount?: number;
            currency?: string;
        };
        taxRate?: number;
        unitPrice?: {
            amount?: number;
            currency?: string;
        };
        discountAmount?: {
            amount?: number;
            currency?: string;
        };
        productId?: string;
        totalPrice?: {
            amount?: number;
            currency?: string;
        };
        discountRate?: number;
    }, {
        id?: string;
        description?: string;
        notes?: string;
        quantity?: number;
        taxAmount?: {
            amount?: number;
            currency?: string;
        };
        taxRate?: number;
        unitPrice?: {
            amount?: number;
            currency?: string;
        };
        discountAmount?: {
            amount?: number;
            currency?: string;
        };
        productId?: string;
        totalPrice?: {
            amount?: number;
            currency?: string;
        };
        discountRate?: number;
    }>, "many">;
    paymentMethod: z.ZodOptional<z.ZodEnum<["cash", "credit_card", "bank_transfer", "check", "paypal", "stripe", "other"]>>;
    reference: z.ZodOptional<z.ZodString>;
    notes: z.ZodOptional<z.ZodString>;
    settings: z.ZodObject<{
        currency: z.ZodString;
        taxInclusive: z.ZodBoolean;
        defaultTaxRate: z.ZodNumber;
        paymentTerms: z.ZodNumber;
        lateFeeRate: z.ZodOptional<z.ZodNumber>;
        lateFeeAmount: z.ZodOptional<z.ZodObject<{
            amount: z.ZodNumber;
            currency: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            amount?: number;
            currency?: string;
        }, {
            amount?: number;
            currency?: string;
        }>>;
        notes: z.ZodOptional<z.ZodString>;
        footer: z.ZodOptional<z.ZodString>;
        customFields: z.ZodRecord<z.ZodString, z.ZodAny>;
        tags: z.ZodArray<z.ZodString, "many">;
    }, "strip", z.ZodTypeAny, {
        tags?: string[];
        currency?: string;
        notes?: string;
        footer?: string;
        customFields?: Record<string, any>;
        paymentTerms?: number;
        taxInclusive?: boolean;
        defaultTaxRate?: number;
        lateFeeRate?: number;
        lateFeeAmount?: {
            amount?: number;
            currency?: string;
        };
    }, {
        tags?: string[];
        currency?: string;
        notes?: string;
        footer?: string;
        customFields?: Record<string, any>;
        paymentTerms?: number;
        taxInclusive?: boolean;
        defaultTaxRate?: number;
        lateFeeRate?: number;
        lateFeeAmount?: {
            amount?: number;
            currency?: string;
        };
    }>;
    attachments: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    isActive: z.ZodBoolean;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    type?: "invoice" | "credit_note" | "debit_note" | "proforma" | "quote" | "receipt";
    status?: "cancelled" | "draft" | "sent" | "paid" | "overdue" | "refunded" | "partially_paid";
    organizationId?: string;
    id?: string;
    createdAt?: Date;
    updatedAt?: Date;
    companyId?: string;
    contactId?: string;
    notes?: string;
    isActive?: boolean;
    settings?: {
        tags?: string[];
        currency?: string;
        notes?: string;
        footer?: string;
        customFields?: Record<string, any>;
        paymentTerms?: number;
        taxInclusive?: boolean;
        defaultTaxRate?: number;
        lateFeeRate?: number;
        lateFeeAmount?: {
            amount?: number;
            currency?: string;
        };
    };
    invoiceNumber?: string;
    issueDate?: Date;
    dueDate?: Date;
    paidDate?: Date;
    items?: {
        id?: string;
        description?: string;
        notes?: string;
        quantity?: number;
        taxAmount?: {
            amount?: number;
            currency?: string;
        };
        taxRate?: number;
        unitPrice?: {
            amount?: number;
            currency?: string;
        };
        discountAmount?: {
            amount?: number;
            currency?: string;
        };
        productId?: string;
        totalPrice?: {
            amount?: number;
            currency?: string;
        };
        discountRate?: number;
    }[];
    reference?: string;
    subtotal?: {
        amount?: number;
        currency?: string;
    };
    taxAmount?: {
        amount?: number;
        currency?: string;
    };
    totalAmount?: {
        amount?: number;
        currency?: string;
    };
    paidAmount?: {
        amount?: number;
        currency?: string;
    };
    discountAmount?: {
        amount?: number;
        currency?: string;
    };
    paymentStatus?: "pending" | "cancelled" | "paid" | "overdue" | "partial";
    balanceAmount?: {
        amount?: number;
        currency?: string;
    };
    paymentMethod?: "cash" | "bank_transfer" | "credit_card" | "paypal" | "stripe" | "check" | "other";
    attachments?: string[];
}, {
    type?: "invoice" | "credit_note" | "debit_note" | "proforma" | "quote" | "receipt";
    status?: "cancelled" | "draft" | "sent" | "paid" | "overdue" | "refunded" | "partially_paid";
    organizationId?: string;
    id?: string;
    createdAt?: Date;
    updatedAt?: Date;
    companyId?: string;
    contactId?: string;
    notes?: string;
    isActive?: boolean;
    settings?: {
        tags?: string[];
        currency?: string;
        notes?: string;
        footer?: string;
        customFields?: Record<string, any>;
        paymentTerms?: number;
        taxInclusive?: boolean;
        defaultTaxRate?: number;
        lateFeeRate?: number;
        lateFeeAmount?: {
            amount?: number;
            currency?: string;
        };
    };
    invoiceNumber?: string;
    issueDate?: Date;
    dueDate?: Date;
    paidDate?: Date;
    items?: {
        id?: string;
        description?: string;
        notes?: string;
        quantity?: number;
        taxAmount?: {
            amount?: number;
            currency?: string;
        };
        taxRate?: number;
        unitPrice?: {
            amount?: number;
            currency?: string;
        };
        discountAmount?: {
            amount?: number;
            currency?: string;
        };
        productId?: string;
        totalPrice?: {
            amount?: number;
            currency?: string;
        };
        discountRate?: number;
    }[];
    reference?: string;
    subtotal?: {
        amount?: number;
        currency?: string;
    };
    taxAmount?: {
        amount?: number;
        currency?: string;
    };
    totalAmount?: {
        amount?: number;
        currency?: string;
    };
    paidAmount?: {
        amount?: number;
        currency?: string;
    };
    discountAmount?: {
        amount?: number;
        currency?: string;
    };
    paymentStatus?: "pending" | "cancelled" | "paid" | "overdue" | "partial";
    balanceAmount?: {
        amount?: number;
        currency?: string;
    };
    paymentMethod?: "cash" | "bank_transfer" | "credit_card" | "paypal" | "stripe" | "check" | "other";
    attachments?: string[];
}>;
export declare const InvoiceListResponseSchema: z.ZodObject<{
    pagination: z.ZodObject<{
        page: z.ZodNumber;
        limit: z.ZodNumber;
        total: z.ZodNumber;
        totalPages: z.ZodNumber;
        hasNext: z.ZodBoolean;
        hasPrev: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        page?: number;
        limit?: number;
        total?: number;
        totalPages?: number;
        hasNext?: boolean;
        hasPrev?: boolean;
    }, {
        page?: number;
        limit?: number;
        total?: number;
        totalPages?: number;
        hasNext?: boolean;
        hasPrev?: boolean;
    }>;
} & {
    data: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        organizationId: z.ZodString;
        invoiceNumber: z.ZodString;
        type: z.ZodEnum<["invoice", "credit_note", "debit_note", "proforma", "quote", "receipt"]>;
        status: z.ZodEnum<["draft", "sent", "paid", "overdue", "cancelled", "refunded", "partially_paid"]>;
        paymentStatus: z.ZodEnum<["pending", "paid", "partial", "overdue", "cancelled"]>;
        companyId: z.ZodString;
        contactId: z.ZodOptional<z.ZodString>;
        issueDate: z.ZodDate;
        dueDate: z.ZodDate;
        paidDate: z.ZodOptional<z.ZodDate>;
        subtotal: z.ZodObject<{
            amount: z.ZodNumber;
            currency: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            amount?: number;
            currency?: string;
        }, {
            amount?: number;
            currency?: string;
        }>;
        taxAmount: z.ZodObject<{
            amount: z.ZodNumber;
            currency: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            amount?: number;
            currency?: string;
        }, {
            amount?: number;
            currency?: string;
        }>;
        discountAmount: z.ZodObject<{
            amount: z.ZodNumber;
            currency: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            amount?: number;
            currency?: string;
        }, {
            amount?: number;
            currency?: string;
        }>;
        totalAmount: z.ZodObject<{
            amount: z.ZodNumber;
            currency: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            amount?: number;
            currency?: string;
        }, {
            amount?: number;
            currency?: string;
        }>;
        paidAmount: z.ZodObject<{
            amount: z.ZodNumber;
            currency: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            amount?: number;
            currency?: string;
        }, {
            amount?: number;
            currency?: string;
        }>;
        balanceAmount: z.ZodObject<{
            amount: z.ZodNumber;
            currency: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            amount?: number;
            currency?: string;
        }, {
            amount?: number;
            currency?: string;
        }>;
        items: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            productId: z.ZodOptional<z.ZodString>;
            description: z.ZodString;
            quantity: z.ZodNumber;
            unitPrice: z.ZodObject<{
                amount: z.ZodNumber;
                currency: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                amount?: number;
                currency?: string;
            }, {
                amount?: number;
                currency?: string;
            }>;
            totalPrice: z.ZodObject<{
                amount: z.ZodNumber;
                currency: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                amount?: number;
                currency?: string;
            }, {
                amount?: number;
                currency?: string;
            }>;
            taxRate: z.ZodOptional<z.ZodNumber>;
            taxAmount: z.ZodOptional<z.ZodObject<{
                amount: z.ZodNumber;
                currency: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                amount?: number;
                currency?: string;
            }, {
                amount?: number;
                currency?: string;
            }>>;
            discountRate: z.ZodOptional<z.ZodNumber>;
            discountAmount: z.ZodOptional<z.ZodObject<{
                amount: z.ZodNumber;
                currency: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                amount?: number;
                currency?: string;
            }, {
                amount?: number;
                currency?: string;
            }>>;
            notes: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            id?: string;
            description?: string;
            notes?: string;
            quantity?: number;
            taxAmount?: {
                amount?: number;
                currency?: string;
            };
            taxRate?: number;
            unitPrice?: {
                amount?: number;
                currency?: string;
            };
            discountAmount?: {
                amount?: number;
                currency?: string;
            };
            productId?: string;
            totalPrice?: {
                amount?: number;
                currency?: string;
            };
            discountRate?: number;
        }, {
            id?: string;
            description?: string;
            notes?: string;
            quantity?: number;
            taxAmount?: {
                amount?: number;
                currency?: string;
            };
            taxRate?: number;
            unitPrice?: {
                amount?: number;
                currency?: string;
            };
            discountAmount?: {
                amount?: number;
                currency?: string;
            };
            productId?: string;
            totalPrice?: {
                amount?: number;
                currency?: string;
            };
            discountRate?: number;
        }>, "many">;
        paymentMethod: z.ZodOptional<z.ZodEnum<["cash", "credit_card", "bank_transfer", "check", "paypal", "stripe", "other"]>>;
        reference: z.ZodOptional<z.ZodString>;
        notes: z.ZodOptional<z.ZodString>;
        settings: z.ZodObject<{
            currency: z.ZodString;
            taxInclusive: z.ZodBoolean;
            defaultTaxRate: z.ZodNumber;
            paymentTerms: z.ZodNumber;
            lateFeeRate: z.ZodOptional<z.ZodNumber>;
            lateFeeAmount: z.ZodOptional<z.ZodObject<{
                amount: z.ZodNumber;
                currency: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                amount?: number;
                currency?: string;
            }, {
                amount?: number;
                currency?: string;
            }>>;
            notes: z.ZodOptional<z.ZodString>;
            footer: z.ZodOptional<z.ZodString>;
            customFields: z.ZodRecord<z.ZodString, z.ZodAny>;
            tags: z.ZodArray<z.ZodString, "many">;
        }, "strip", z.ZodTypeAny, {
            tags?: string[];
            currency?: string;
            notes?: string;
            footer?: string;
            customFields?: Record<string, any>;
            paymentTerms?: number;
            taxInclusive?: boolean;
            defaultTaxRate?: number;
            lateFeeRate?: number;
            lateFeeAmount?: {
                amount?: number;
                currency?: string;
            };
        }, {
            tags?: string[];
            currency?: string;
            notes?: string;
            footer?: string;
            customFields?: Record<string, any>;
            paymentTerms?: number;
            taxInclusive?: boolean;
            defaultTaxRate?: number;
            lateFeeRate?: number;
            lateFeeAmount?: {
                amount?: number;
                currency?: string;
            };
        }>;
        attachments: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        isActive: z.ZodBoolean;
        createdAt: z.ZodDate;
        updatedAt: z.ZodDate;
    }, "strip", z.ZodTypeAny, {
        type?: "invoice" | "credit_note" | "debit_note" | "proforma" | "quote" | "receipt";
        status?: "cancelled" | "draft" | "sent" | "paid" | "overdue" | "refunded" | "partially_paid";
        organizationId?: string;
        id?: string;
        createdAt?: Date;
        updatedAt?: Date;
        companyId?: string;
        contactId?: string;
        notes?: string;
        isActive?: boolean;
        settings?: {
            tags?: string[];
            currency?: string;
            notes?: string;
            footer?: string;
            customFields?: Record<string, any>;
            paymentTerms?: number;
            taxInclusive?: boolean;
            defaultTaxRate?: number;
            lateFeeRate?: number;
            lateFeeAmount?: {
                amount?: number;
                currency?: string;
            };
        };
        invoiceNumber?: string;
        issueDate?: Date;
        dueDate?: Date;
        paidDate?: Date;
        items?: {
            id?: string;
            description?: string;
            notes?: string;
            quantity?: number;
            taxAmount?: {
                amount?: number;
                currency?: string;
            };
            taxRate?: number;
            unitPrice?: {
                amount?: number;
                currency?: string;
            };
            discountAmount?: {
                amount?: number;
                currency?: string;
            };
            productId?: string;
            totalPrice?: {
                amount?: number;
                currency?: string;
            };
            discountRate?: number;
        }[];
        reference?: string;
        subtotal?: {
            amount?: number;
            currency?: string;
        };
        taxAmount?: {
            amount?: number;
            currency?: string;
        };
        totalAmount?: {
            amount?: number;
            currency?: string;
        };
        paidAmount?: {
            amount?: number;
            currency?: string;
        };
        discountAmount?: {
            amount?: number;
            currency?: string;
        };
        paymentStatus?: "pending" | "cancelled" | "paid" | "overdue" | "partial";
        balanceAmount?: {
            amount?: number;
            currency?: string;
        };
        paymentMethod?: "cash" | "bank_transfer" | "credit_card" | "paypal" | "stripe" | "check" | "other";
        attachments?: string[];
    }, {
        type?: "invoice" | "credit_note" | "debit_note" | "proforma" | "quote" | "receipt";
        status?: "cancelled" | "draft" | "sent" | "paid" | "overdue" | "refunded" | "partially_paid";
        organizationId?: string;
        id?: string;
        createdAt?: Date;
        updatedAt?: Date;
        companyId?: string;
        contactId?: string;
        notes?: string;
        isActive?: boolean;
        settings?: {
            tags?: string[];
            currency?: string;
            notes?: string;
            footer?: string;
            customFields?: Record<string, any>;
            paymentTerms?: number;
            taxInclusive?: boolean;
            defaultTaxRate?: number;
            lateFeeRate?: number;
            lateFeeAmount?: {
                amount?: number;
                currency?: string;
            };
        };
        invoiceNumber?: string;
        issueDate?: Date;
        dueDate?: Date;
        paidDate?: Date;
        items?: {
            id?: string;
            description?: string;
            notes?: string;
            quantity?: number;
            taxAmount?: {
                amount?: number;
                currency?: string;
            };
            taxRate?: number;
            unitPrice?: {
                amount?: number;
                currency?: string;
            };
            discountAmount?: {
                amount?: number;
                currency?: string;
            };
            productId?: string;
            totalPrice?: {
                amount?: number;
                currency?: string;
            };
            discountRate?: number;
        }[];
        reference?: string;
        subtotal?: {
            amount?: number;
            currency?: string;
        };
        taxAmount?: {
            amount?: number;
            currency?: string;
        };
        totalAmount?: {
            amount?: number;
            currency?: string;
        };
        paidAmount?: {
            amount?: number;
            currency?: string;
        };
        discountAmount?: {
            amount?: number;
            currency?: string;
        };
        paymentStatus?: "pending" | "cancelled" | "paid" | "overdue" | "partial";
        balanceAmount?: {
            amount?: number;
            currency?: string;
        };
        paymentMethod?: "cash" | "bank_transfer" | "credit_card" | "paypal" | "stripe" | "check" | "other";
        attachments?: string[];
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    data?: {
        type?: "invoice" | "credit_note" | "debit_note" | "proforma" | "quote" | "receipt";
        status?: "cancelled" | "draft" | "sent" | "paid" | "overdue" | "refunded" | "partially_paid";
        organizationId?: string;
        id?: string;
        createdAt?: Date;
        updatedAt?: Date;
        companyId?: string;
        contactId?: string;
        notes?: string;
        isActive?: boolean;
        settings?: {
            tags?: string[];
            currency?: string;
            notes?: string;
            footer?: string;
            customFields?: Record<string, any>;
            paymentTerms?: number;
            taxInclusive?: boolean;
            defaultTaxRate?: number;
            lateFeeRate?: number;
            lateFeeAmount?: {
                amount?: number;
                currency?: string;
            };
        };
        invoiceNumber?: string;
        issueDate?: Date;
        dueDate?: Date;
        paidDate?: Date;
        items?: {
            id?: string;
            description?: string;
            notes?: string;
            quantity?: number;
            taxAmount?: {
                amount?: number;
                currency?: string;
            };
            taxRate?: number;
            unitPrice?: {
                amount?: number;
                currency?: string;
            };
            discountAmount?: {
                amount?: number;
                currency?: string;
            };
            productId?: string;
            totalPrice?: {
                amount?: number;
                currency?: string;
            };
            discountRate?: number;
        }[];
        reference?: string;
        subtotal?: {
            amount?: number;
            currency?: string;
        };
        taxAmount?: {
            amount?: number;
            currency?: string;
        };
        totalAmount?: {
            amount?: number;
            currency?: string;
        };
        paidAmount?: {
            amount?: number;
            currency?: string;
        };
        discountAmount?: {
            amount?: number;
            currency?: string;
        };
        paymentStatus?: "pending" | "cancelled" | "paid" | "overdue" | "partial";
        balanceAmount?: {
            amount?: number;
            currency?: string;
        };
        paymentMethod?: "cash" | "bank_transfer" | "credit_card" | "paypal" | "stripe" | "check" | "other";
        attachments?: string[];
    }[];
    pagination?: {
        page?: number;
        limit?: number;
        total?: number;
        totalPages?: number;
        hasNext?: boolean;
        hasPrev?: boolean;
    };
}, {
    data?: {
        type?: "invoice" | "credit_note" | "debit_note" | "proforma" | "quote" | "receipt";
        status?: "cancelled" | "draft" | "sent" | "paid" | "overdue" | "refunded" | "partially_paid";
        organizationId?: string;
        id?: string;
        createdAt?: Date;
        updatedAt?: Date;
        companyId?: string;
        contactId?: string;
        notes?: string;
        isActive?: boolean;
        settings?: {
            tags?: string[];
            currency?: string;
            notes?: string;
            footer?: string;
            customFields?: Record<string, any>;
            paymentTerms?: number;
            taxInclusive?: boolean;
            defaultTaxRate?: number;
            lateFeeRate?: number;
            lateFeeAmount?: {
                amount?: number;
                currency?: string;
            };
        };
        invoiceNumber?: string;
        issueDate?: Date;
        dueDate?: Date;
        paidDate?: Date;
        items?: {
            id?: string;
            description?: string;
            notes?: string;
            quantity?: number;
            taxAmount?: {
                amount?: number;
                currency?: string;
            };
            taxRate?: number;
            unitPrice?: {
                amount?: number;
                currency?: string;
            };
            discountAmount?: {
                amount?: number;
                currency?: string;
            };
            productId?: string;
            totalPrice?: {
                amount?: number;
                currency?: string;
            };
            discountRate?: number;
        }[];
        reference?: string;
        subtotal?: {
            amount?: number;
            currency?: string;
        };
        taxAmount?: {
            amount?: number;
            currency?: string;
        };
        totalAmount?: {
            amount?: number;
            currency?: string;
        };
        paidAmount?: {
            amount?: number;
            currency?: string;
        };
        discountAmount?: {
            amount?: number;
            currency?: string;
        };
        paymentStatus?: "pending" | "cancelled" | "paid" | "overdue" | "partial";
        balanceAmount?: {
            amount?: number;
            currency?: string;
        };
        paymentMethod?: "cash" | "bank_transfer" | "credit_card" | "paypal" | "stripe" | "check" | "other";
        attachments?: string[];
    }[];
    pagination?: {
        page?: number;
        limit?: number;
        total?: number;
        totalPages?: number;
        hasNext?: boolean;
        hasPrev?: boolean;
    };
}>;
export declare const InvoiceStatsResponseSchema: z.ZodObject<{
    total: z.ZodNumber;
    active: z.ZodNumber;
    inactive: z.ZodNumber;
    createdThisMonth: z.ZodNumber;
    createdThisYear: z.ZodNumber;
    updatedThisMonth: z.ZodNumber;
    updatedThisYear: z.ZodNumber;
} & {
    byType: z.ZodRecord<z.ZodString, z.ZodNumber>;
    byStatus: z.ZodRecord<z.ZodString, z.ZodNumber>;
    byPaymentStatus: z.ZodRecord<z.ZodString, z.ZodNumber>;
    totalAmount: z.ZodNumber;
    paidAmount: z.ZodNumber;
    outstandingAmount: z.ZodNumber;
    overdueAmount: z.ZodNumber;
    averageAmount: z.ZodNumber;
    averagePaymentTime: z.ZodNumber;
    overdueCount: z.ZodNumber;
    paidCount: z.ZodNumber;
    pendingCount: z.ZodNumber;
    partiallyPaidCount: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    active?: number;
    inactive?: number;
    total?: number;
    totalAmount?: number;
    paidAmount?: number;
    byStatus?: Record<string, number>;
    pendingCount?: number;
    createdThisMonth?: number;
    createdThisYear?: number;
    updatedThisMonth?: number;
    updatedThisYear?: number;
    byType?: Record<string, number>;
    byPaymentStatus?: Record<string, number>;
    outstandingAmount?: number;
    overdueAmount?: number;
    averageAmount?: number;
    averagePaymentTime?: number;
    overdueCount?: number;
    paidCount?: number;
    partiallyPaidCount?: number;
}, {
    active?: number;
    inactive?: number;
    total?: number;
    totalAmount?: number;
    paidAmount?: number;
    byStatus?: Record<string, number>;
    pendingCount?: number;
    createdThisMonth?: number;
    createdThisYear?: number;
    updatedThisMonth?: number;
    updatedThisYear?: number;
    byType?: Record<string, number>;
    byPaymentStatus?: Record<string, number>;
    outstandingAmount?: number;
    overdueAmount?: number;
    averageAmount?: number;
    averagePaymentTime?: number;
    overdueCount?: number;
    paidCount?: number;
    partiallyPaidCount?: number;
}>;
export declare const RecordPaymentRequestSchema: z.ZodObject<{
    amount: z.ZodObject<{
        amount: z.ZodNumber;
        currency: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        amount?: number;
        currency?: string;
    }, {
        amount?: number;
        currency?: string;
    }>;
    paymentMethod: z.ZodEnum<["cash", "credit_card", "bank_transfer", "check", "paypal", "stripe", "other"]>;
    paidDate: z.ZodOptional<z.ZodDate>;
    reference: z.ZodOptional<z.ZodString>;
    notes: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    amount?: {
        amount?: number;
        currency?: string;
    };
    notes?: string;
    paidDate?: Date;
    reference?: string;
    paymentMethod?: "cash" | "bank_transfer" | "credit_card" | "paypal" | "stripe" | "check" | "other";
}, {
    amount?: {
        amount?: number;
        currency?: string;
    };
    notes?: string;
    paidDate?: Date;
    reference?: string;
    paymentMethod?: "cash" | "bank_transfer" | "credit_card" | "paypal" | "stripe" | "check" | "other";
}>;
export declare const ApplyDiscountRequestSchema: z.ZodObject<{
    discountAmount: z.ZodObject<{
        amount: z.ZodNumber;
        currency: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        amount?: number;
        currency?: string;
    }, {
        amount?: number;
        currency?: string;
    }>;
    reason: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    reason?: string;
    discountAmount?: {
        amount?: number;
        currency?: string;
    };
}, {
    reason?: string;
    discountAmount?: {
        amount?: number;
        currency?: string;
    };
}>;
export declare const InvoiceReportRequestSchema: z.ZodObject<{
    organizationId: z.ZodString;
    filters: z.ZodOptional<z.ZodObject<{
        type: z.ZodOptional<z.ZodEnum<["invoice", "credit_note", "debit_note", "proforma", "quote", "receipt"]>>;
        status: z.ZodOptional<z.ZodEnum<["draft", "sent", "paid", "overdue", "cancelled", "refunded", "partially_paid"]>>;
        paymentStatus: z.ZodOptional<z.ZodEnum<["pending", "paid", "partial", "overdue", "cancelled"]>>;
        companyId: z.ZodOptional<z.ZodString>;
        contactId: z.ZodOptional<z.ZodString>;
        dateRange: z.ZodOptional<z.ZodEffects<z.ZodObject<{
            startDate: z.ZodOptional<z.ZodDate>;
            endDate: z.ZodOptional<z.ZodDate>;
        }, "strip", z.ZodTypeAny, {
            startDate?: Date;
            endDate?: Date;
        }, {
            startDate?: Date;
            endDate?: Date;
        }>, {
            startDate?: Date;
            endDate?: Date;
        }, {
            startDate?: Date;
            endDate?: Date;
        }>>;
    }, "strip", z.ZodTypeAny, {
        type?: "invoice" | "credit_note" | "debit_note" | "proforma" | "quote" | "receipt";
        status?: "cancelled" | "draft" | "sent" | "paid" | "overdue" | "refunded" | "partially_paid";
        companyId?: string;
        contactId?: string;
        paymentStatus?: "pending" | "cancelled" | "paid" | "overdue" | "partial";
        dateRange?: {
            startDate?: Date;
            endDate?: Date;
        };
    }, {
        type?: "invoice" | "credit_note" | "debit_note" | "proforma" | "quote" | "receipt";
        status?: "cancelled" | "draft" | "sent" | "paid" | "overdue" | "refunded" | "partially_paid";
        companyId?: string;
        contactId?: string;
        paymentStatus?: "pending" | "cancelled" | "paid" | "overdue" | "partial";
        dateRange?: {
            startDate?: Date;
            endDate?: Date;
        };
    }>>;
}, "strip", z.ZodTypeAny, {
    organizationId?: string;
    filters?: {
        type?: "invoice" | "credit_note" | "debit_note" | "proforma" | "quote" | "receipt";
        status?: "cancelled" | "draft" | "sent" | "paid" | "overdue" | "refunded" | "partially_paid";
        companyId?: string;
        contactId?: string;
        paymentStatus?: "pending" | "cancelled" | "paid" | "overdue" | "partial";
        dateRange?: {
            startDate?: Date;
            endDate?: Date;
        };
    };
}, {
    organizationId?: string;
    filters?: {
        type?: "invoice" | "credit_note" | "debit_note" | "proforma" | "quote" | "receipt";
        status?: "cancelled" | "draft" | "sent" | "paid" | "overdue" | "refunded" | "partially_paid";
        companyId?: string;
        contactId?: string;
        paymentStatus?: "pending" | "cancelled" | "paid" | "overdue" | "partial";
        dateRange?: {
            startDate?: Date;
            endDate?: Date;
        };
    };
}>;
export declare const PaymentReportRequestSchema: z.ZodObject<{
    organizationId: z.ZodString;
    startDate: z.ZodDate;
    endDate: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    organizationId?: string;
    startDate?: Date;
    endDate?: Date;
}, {
    organizationId?: string;
    startDate?: Date;
    endDate?: Date;
}>;
export declare const OverdueReportRequestSchema: z.ZodObject<{
    organizationId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    organizationId?: string;
}, {
    organizationId?: string;
}>;
export type CreateInvoiceRequest = z.infer<typeof CreateInvoiceRequestSchema>;
export type UpdateInvoiceRequest = z.infer<typeof UpdateInvoiceRequestSchema>;
export type InvoiceIdParam = z.infer<typeof InvoiceIdParamSchema>;
export type InvoiceOrganizationIdParam = z.infer<typeof InvoiceOrganizationIdParamSchema>;
export type InvoiceSearchQuery = z.infer<typeof InvoiceSearchQuerySchema>;
export type InvoiceBulkUpdate = z.infer<typeof InvoiceBulkUpdateSchema>;
export type InvoiceBulkDelete = z.infer<typeof InvoiceBulkDeleteSchema>;
export type InvoiceResponse = z.infer<typeof InvoiceResponseSchema>;
export type InvoiceListResponse = z.infer<typeof InvoiceListResponseSchema>;
export type InvoiceStatsResponse = z.infer<typeof InvoiceStatsResponseSchema>;
export type InvoiceItemResponse = z.infer<typeof InvoiceItemResponseSchema>;
export type RecordPaymentRequest = z.infer<typeof RecordPaymentRequestSchema>;
export type ApplyDiscountRequest = z.infer<typeof ApplyDiscountRequestSchema>;
export type InvoiceReportRequest = z.infer<typeof InvoiceReportRequestSchema>;
export type PaymentReportRequest = z.infer<typeof PaymentReportRequestSchema>;
export type OverdueReportRequest = z.infer<typeof OverdueReportRequestSchema>;
//# sourceMappingURL=invoice.dto.d.ts.map