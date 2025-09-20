export interface AddressProps {
    street: string;
    city: string;
    state?: string;
    postalCode: string;
    country: string;
    countryCode: string;
}
export declare class Address {
    private readonly props;
    private constructor();
    static create(props: AddressProps): Address;
    static fromString(addressString: string): Address;
    private static validate;
    getStreet(): string;
    getCity(): string;
    getState(): string | undefined;
    getPostalCode(): string;
    getCountry(): string;
    getCountryCode(): string;
    getFullAddress(): string;
    getShortAddress(): string;
    getFormattedAddress(): string;
    isInEU(): boolean;
    isInUS(): boolean;
    isInUK(): boolean;
    isInCanada(): boolean;
    isInAustralia(): boolean;
    getTimezone(): string;
    toJSON(): AddressProps;
    toString(): string;
    equals(other: Address): boolean;
    hashCode(): string;
}
//# sourceMappingURL=address.vo.d.ts.map