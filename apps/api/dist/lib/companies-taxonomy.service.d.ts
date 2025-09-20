export interface CompanyTaxonomy {
    id: string;
    name: string;
    description: string;
    metadata: {
        industry?: string;
        tags: string[];
        keywords: string[];
    };
    isActive: boolean;
    createdAt: string;
}
export interface CompanyView {
    id: string;
    name: string;
    description: string;
    organizationId: string;
    filters: any[];
    sorting: any;
    columns: any[];
    isDefault: boolean;
    createdAt: string;
}
export declare class CompaniesTaxonomyService {
    private taxonomies;
    private views;
    constructor();
    private initializeDefaultTaxonomies;
    private initializeDefaultViews;
    classifyCompany(companyData: any): Promise<any[]>;
    getCompaniesByView(viewId: string, organizationId: string, options?: any): Promise<any>;
    createView(viewData: any): Promise<CompanyView>;
    private getView;
    private generateMockCompanies;
    getTaxonomies(): CompanyTaxonomy[];
    getViews(organizationId: string): CompanyView[];
}
export declare const companiesTaxonomyService: CompaniesTaxonomyService;
//# sourceMappingURL=companies-taxonomy.service.d.ts.map