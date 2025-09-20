export class Address {
    props;
    constructor(props) {
        this.props = props;
    }
    static create(props) {
        Address.validate(props);
        return new Address(props);
    }
    static fromString(addressString) {
        const parts = addressString.split(',').map(part => part.trim());
        if (parts.length < 3) {
            throw new Error('Invalid address format');
        }
        const props = {
            street: parts[0],
            city: parts[1],
            postalCode: parts[2],
            country: parts[3] || '',
            countryCode: parts[4] || ''
        };
        return Address.create(props);
    }
    static validate(props) {
        if (!props.street || props.street.trim().length === 0) {
            throw new Error('Street is required');
        }
        if (!props.city || props.city.trim().length === 0) {
            throw new Error('City is required');
        }
        if (!props.postalCode || props.postalCode.trim().length === 0) {
            throw new Error('Postal code is required');
        }
        if (!props.country || props.country.trim().length === 0) {
            throw new Error('Country is required');
        }
        if (!props.countryCode || props.countryCode.trim().length === 0) {
            throw new Error('Country code is required');
        }
        if (props.countryCode.length !== 2) {
            throw new Error('Country code must be 2 characters');
        }
    }
    getStreet() {
        return this.props.street;
    }
    getCity() {
        return this.props.city;
    }
    getState() {
        return this.props.state;
    }
    getPostalCode() {
        return this.props.postalCode;
    }
    getCountry() {
        return this.props.country;
    }
    getCountryCode() {
        return this.props.countryCode;
    }
    getFullAddress() {
        const parts = [
            this.props.street,
            this.props.city,
            this.props.state,
            this.props.postalCode,
            this.props.country
        ].filter(Boolean);
        return parts.join(', ');
    }
    getShortAddress() {
        return `${this.props.city}, ${this.props.country}`;
    }
    getFormattedAddress() {
        const lines = [
            this.props.street,
            `${this.props.postalCode} ${this.props.city}`,
            this.props.state ? `${this.props.state}, ${this.props.country}` : this.props.country
        ];
        return lines.join('\n');
    }
    isInEU() {
        const euCountries = [
            'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR',
            'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL',
            'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE'
        ];
        return euCountries.includes(this.props.countryCode.toUpperCase());
    }
    isInUS() {
        return this.props.countryCode.toUpperCase() === 'US';
    }
    isInUK() {
        return this.props.countryCode.toUpperCase() === 'GB';
    }
    isInCanada() {
        return this.props.countryCode.toUpperCase() === 'CA';
    }
    isInAustralia() {
        return this.props.countryCode.toUpperCase() === 'AU';
    }
    getTimezone() {
        const timezoneMap = {
            'US': 'America/New_York',
            'CA': 'America/Toronto',
            'GB': 'Europe/London',
            'DE': 'Europe/Berlin',
            'FR': 'Europe/Paris',
            'IT': 'Europe/Rome',
            'ES': 'Europe/Madrid',
            'NL': 'Europe/Amsterdam',
            'BE': 'Europe/Brussels',
            'AT': 'Europe/Vienna',
            'CH': 'Europe/Zurich',
            'SE': 'Europe/Stockholm',
            'NO': 'Europe/Oslo',
            'DK': 'Europe/Copenhagen',
            'FI': 'Europe/Helsinki',
            'PL': 'Europe/Warsaw',
            'CZ': 'Europe/Prague',
            'HU': 'Europe/Budapest',
            'RO': 'Europe/Bucharest',
            'BG': 'Europe/Sofia',
            'HR': 'Europe/Zagreb',
            'SI': 'Europe/Ljubljana',
            'SK': 'Europe/Bratislava',
            'LT': 'Europe/Vilnius',
            'LV': 'Europe/Riga',
            'EE': 'Europe/Tallinn',
            'IE': 'Europe/Dublin',
            'PT': 'Europe/Lisbon',
            'GR': 'Europe/Athens',
            'CY': 'Europe/Nicosia',
            'MT': 'Europe/Malta',
            'LU': 'Europe/Luxembourg',
            'AU': 'Australia/Sydney',
            'NZ': 'Pacific/Auckland',
            'JP': 'Asia/Tokyo',
            'CN': 'Asia/Shanghai',
            'IN': 'Asia/Kolkata',
            'SG': 'Asia/Singapore',
            'HK': 'Asia/Hong_Kong',
            'KR': 'Asia/Seoul',
            'TH': 'Asia/Bangkok',
            'MY': 'Asia/Kuala_Lumpur',
            'ID': 'Asia/Jakarta',
            'PH': 'Asia/Manila',
            'VN': 'Asia/Ho_Chi_Minh',
            'TW': 'Asia/Taipei',
            'BR': 'America/Sao_Paulo',
            'MX': 'America/Mexico_City',
            'AR': 'America/Argentina/Buenos_Aires',
            'CL': 'America/Santiago',
            'CO': 'America/Bogota',
            'PE': 'America/Lima',
            'VE': 'America/Caracas',
            'ZA': 'Africa/Johannesburg',
            'EG': 'Africa/Cairo',
            'NG': 'Africa/Lagos',
            'KE': 'Africa/Nairobi',
            'MA': 'Africa/Casablanca',
            'TN': 'Africa/Tunis',
            'DZ': 'Africa/Algiers',
            'LY': 'Africa/Tripoli',
            'ET': 'Africa/Addis_Ababa',
            'GH': 'Africa/Accra',
            'UG': 'Africa/Kampala',
            'TZ': 'Africa/Dar_es_Salaam',
            'ZW': 'Africa/Harare',
            'ZM': 'Africa/Lusaka',
            'BW': 'Africa/Gaborone',
            'NA': 'Africa/Windhoek',
            'MW': 'Africa/Blantyre',
            'MZ': 'Africa/Maputo',
            'MG': 'Indian/Antananarivo',
            'MU': 'Indian/Mauritius',
            'SC': 'Indian/Mahe',
            'RE': 'Indian/Reunion',
            'YT': 'Indian/Mayotte',
            'KM': 'Indian/Comoro',
            'DJ': 'Africa/Djibouti',
            'SO': 'Africa/Mogadishu',
            'SD': 'Africa/Khartoum',
            'SS': 'Africa/Juba',
            'CF': 'Africa/Bangui',
            'TD': 'Africa/Ndjamena',
            'NE': 'Africa/Niamey',
            'BF': 'Africa/Ouagadougou',
            'ML': 'Africa/Bamako',
            'SN': 'Africa/Dakar',
            'GM': 'Africa/Banjul',
            'GN': 'Africa/Conakry',
            'SL': 'Africa/Freetown',
            'LR': 'Africa/Monrovia',
            'CI': 'Africa/Abidjan',
            'GH': 'Africa/Accra',
            'TG': 'Africa/Lome',
            'BJ': 'Africa/Porto-Novo',
            'NG': 'Africa/Lagos',
            'CM': 'Africa/Douala',
            'GQ': 'Africa/Malabo',
            'GA': 'Africa/Libreville',
            'CG': 'Africa/Brazzaville',
            'CD': 'Africa/Kinshasa',
            'AO': 'Africa/Luanda',
            'ZM': 'Africa/Lusaka',
            'ZW': 'Africa/Harare',
            'BW': 'Africa/Gaborone',
            'NA': 'Africa/Windhoek',
            'ZA': 'Africa/Johannesburg',
            'LS': 'Africa/Maseru',
            'SZ': 'Africa/Mbabane',
            'MG': 'Indian/Antananarivo',
            'MU': 'Indian/Mauritius',
            'SC': 'Indian/Mahe',
            'RE': 'Indian/Reunion',
            'YT': 'Indian/Mayotte',
            'KM': 'Indian/Comoro',
            'DJ': 'Africa/Djibouti',
            'SO': 'Africa/Mogadishu',
            'SD': 'Africa/Khartoum',
            'SS': 'Africa/Juba',
            'CF': 'Africa/Bangui',
            'TD': 'Africa/Ndjamena',
            'NE': 'Africa/Niamey',
            'BF': 'Africa/Ouagadougou',
            'ML': 'Africa/Bamako',
            'SN': 'Africa/Dakar',
            'GM': 'Africa/Banjul',
            'GN': 'Africa/Conakry',
            'SL': 'Africa/Freetown',
            'LR': 'Africa/Monrovia',
            'CI': 'Africa/Abidjan',
            'TG': 'Africa/Lome',
            'BJ': 'Africa/Porto-Novo',
            'CM': 'Africa/Douala',
            'GQ': 'Africa/Malabo',
            'GA': 'Africa/Libreville',
            'CG': 'Africa/Brazzaville',
            'CD': 'Africa/Kinshasa',
            'AO': 'Africa/Luanda'
        };
        return timezoneMap[this.props.countryCode.toUpperCase()] || 'UTC';
    }
    toJSON() {
        return { ...this.props };
    }
    toString() {
        return this.getFullAddress();
    }
    equals(other) {
        return (this.props.street === other.props.street &&
            this.props.city === other.props.city &&
            this.props.state === other.props.state &&
            this.props.postalCode === other.props.postalCode &&
            this.props.country === other.props.country &&
            this.props.countryCode === other.props.countryCode);
    }
    hashCode() {
        return `${this.props.street}:${this.props.city}:${this.props.postalCode}:${this.props.countryCode}`;
    }
}
//# sourceMappingURL=address.vo.js.map