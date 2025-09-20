import { db } from '../connection.js';
import { products, suppliers } from '../schema.js';

export async function seedInventoryData(orgId: string) {
  

  // Create suppliers first
  const suppliersData = [
    {
      orgId,
      name: 'TechSupply Pro',
      contact_person: 'María González',
      email: 'maria@techsupplypro.com',
      phone: '+34 91 123 4567',
      website: 'https://techsupplypro.com',
      address: {
        street: 'Calle Gran Vía 123',
        city: 'Madrid',
        state: 'Madrid',
        postal_code: '28013',
        country: 'Spain'
      },
      tax_id: 'B12345678',
      payment_terms: '30 days',
      credit_limit: 50000.00,
      currency: 'EUR',
      is_active: true,
      rating: 5,
      notes: 'Proveedor principal de equipos tecnológicos',
      metadata: {
        category: 'technology',
        preferred: true
      }
    },
    {
      orgId,
      name: 'Office Solutions Plus',
      contact_person: 'Carlos Rodríguez',
      email: 'carlos@officesolutionsplus.com',
      phone: '+34 93 987 6543',
      website: 'https://officesolutionsplus.com',
      address: {
        street: 'Avinguda Diagonal 456',
        city: 'Barcelona',
        state: 'Barcelona',
        postal_code: '08013',
        country: 'Spain'
      },
      tax_id: 'B87654321',
      payment_terms: '15 days',
      credit_limit: 25000.00,
      currency: 'EUR',
      is_active: true,
      rating: 4,
      notes: 'Especialistas en mobiliario de oficina',
      metadata: {
        category: 'furniture',
        preferred: false
      }
    },
    {
      orgId,
      name: 'Digital Marketing Tools',
      contact_person: 'Ana Martínez',
      email: 'ana@digitalmarketingtools.com',
      phone: '+34 95 555 1234',
      website: 'https://digitalmarketingtools.com',
      address: {
        street: 'Calle Sierpes 789',
        city: 'Sevilla',
        state: 'Sevilla',
        postal_code: '41004',
        country: 'Spain'
      },
      tax_id: 'B11223344',
      payment_terms: 'Net 30',
      credit_limit: 15000.00,
      currency: 'EUR',
      is_active: true,
      rating: 4,
      notes: 'Herramientas de marketing digital y software',
      metadata: {
        category: 'software',
        preferred: false
      }
    },
    {
      orgId,
      name: 'Green Energy Solutions',
      contact_person: 'Luis Fernández',
      email: 'luis@greenenergysolutions.com',
      phone: '+34 94 444 5678',
      website: 'https://greenenergysolutions.com',
      address: {
        street: 'Calle Ledesma 321',
        city: 'Bilbao',
        state: 'Vizcaya',
        postal_code: '48001',
        country: 'Spain'
      },
      tax_id: 'B55667788',
      payment_terms: '45 days',
      credit_limit: 75000.00,
      currency: 'EUR',
      is_active: true,
      rating: 5,
      notes: 'Soluciones de energía renovable',
      metadata: {
        category: 'energy',
        preferred: true
      }
    }
  ];

  const createdSuppliers = await db.insert(suppliers).values(suppliersData).returning();
  

  // Create products
  const productsData = [
    {
      orgId,
      name: 'Laptop Dell XPS 13',
      description: 'Laptop ultrabook de 13 pulgadas con procesador Intel i7',
      sku: 'LAP-DELL-XPS13-001',
      category: 'Laptops',
      unit_price: 1299.99,
      cost_price: 899.99,
      currency: 'EUR',
      unit: 'piece',
      stock_quantity: 25,
      min_stock_level: 5,
      supplier_id: createdSuppliers[0].id,
      is_active: true,
      metadata: {
        brand: 'Dell',
        model: 'XPS 13',
        warranty: '2 years'
      }
    },
    {
      orgId,
      name: 'Monitor LG 27" 4K',
      description: 'Monitor profesional de 27 pulgadas con resolución 4K',
      sku: 'MON-LG-27-4K-001',
      category: 'Monitors',
      unit_price: 449.99,
      cost_price: 299.99,
      currency: 'EUR',
      unit: 'piece',
      stock_quantity: 15,
      min_stock_level: 3,
      supplier_id: createdSuppliers[0].id,
      is_active: true,
      metadata: {
        brand: 'LG',
        size: '27"',
        resolution: '4K'
      }
    },
    {
      orgId,
      name: 'Silla de Oficina Ergonómica',
      description: 'Silla ergonómica con soporte lumbar ajustable',
      sku: 'CHAIR-ERG-001',
      category: 'Furniture',
      unit_price: 299.99,
      cost_price: 199.99,
      currency: 'EUR',
      unit: 'piece',
      stock_quantity: 30,
      min_stock_level: 8,
      supplier_id: createdSuppliers[1].id,
      is_active: true,
      metadata: {
        brand: 'OfficePro',
        material: 'Mesh',
        weight_capacity: '120kg'
      }
    },
    {
      orgId,
      name: 'Escritorio Ejecutivo',
      description: 'Escritorio de madera maciza con cajones',
      sku: 'DESK-EXEC-001',
      category: 'Furniture',
      unit_price: 599.99,
      cost_price: 399.99,
      currency: 'EUR',
      unit: 'piece',
      stock_quantity: 12,
      min_stock_level: 2,
      supplier_id: createdSuppliers[1].id,
      is_active: true,
      metadata: {
        brand: 'OfficePro',
        material: 'Solid Wood',
        dimensions: '180x80x75cm'
      }
    },
    {
      orgId,
      name: 'Software CRM Premium',
      description: 'Licencia anual de software CRM empresarial',
      sku: 'SW-CRM-PREM-001',
      category: 'Software',
      unit_price: 999.99,
      cost_price: 699.99,
      currency: 'EUR',
      unit: 'license',
      stock_quantity: 100,
      min_stock_level: 20,
      supplier_id: createdSuppliers[2].id,
      is_active: true,
      metadata: {
        brand: 'EcoNeura',
        license_type: 'Annual',
        users: 'Unlimited'
      }
    },
    {
      orgId,
      name: 'Herramienta de Marketing Automation',
      description: 'Plataforma completa de automatización de marketing',
      sku: 'SW-MARKETING-AUTO-001',
      category: 'Software',
      unit_price: 1499.99,
      cost_price: 999.99,
      currency: 'EUR',
      unit: 'license',
      stock_quantity: 50,
      min_stock_level: 10,
      supplier_id: createdSuppliers[2].id,
      is_active: true,
      metadata: {
        brand: 'MarketingPro',
        license_type: 'Annual',
        features: ['Email Marketing', 'Social Media', 'Analytics']
      }
    },
    {
      orgId,
      name: 'Panel Solar 400W',
      description: 'Panel solar monocristalino de 400W para instalaciones comerciales',
      sku: 'SOLAR-PANEL-400W-001',
      category: 'Energy',
      unit_price: 299.99,
      cost_price: 199.99,
      currency: 'EUR',
      unit: 'piece',
      stock_quantity: 40,
      min_stock_level: 10,
      supplier_id: createdSuppliers[3].id,
      is_active: true,
      metadata: {
        brand: 'SolarTech',
        power: '400W',
        efficiency: '20.5%',
        warranty: '25 years'
      }
    },
    {
      orgId,
      name: 'Inversor Solar 5kW',
      description: 'Inversor solar de 5kW con monitoreo inteligente',
      sku: 'SOLAR-INVERTER-5KW-001',
      category: 'Energy',
      unit_price: 899.99,
      cost_price: 599.99,
      currency: 'EUR',
      unit: 'piece',
      stock_quantity: 20,
      min_stock_level: 5,
      supplier_id: createdSuppliers[3].id,
      is_active: true,
      metadata: {
        brand: 'SolarTech',
        power: '5kW',
        efficiency: '98%',
        warranty: '10 years'
      }
    },
    {
      orgId,
      name: 'Teclado Mecánico RGB',
      description: 'Teclado mecánico gaming con switches Cherry MX y RGB',
      sku: 'KB-MECH-RGB-001',
      category: 'Peripherals',
      unit_price: 149.99,
      cost_price: 99.99,
      currency: 'EUR',
      unit: 'piece',
      stock_quantity: 35,
      min_stock_level: 7,
      supplier_id: createdSuppliers[0].id,
      is_active: true,
      metadata: {
        brand: 'GamingPro',
        switches: 'Cherry MX Red',
        backlight: 'RGB'
      }
    },
    {
      orgId,
      name: 'Mouse Inalámbrico Profesional',
      description: 'Mouse inalámbrico con sensor de alta precisión',
      sku: 'MOUSE-WIRELESS-001',
      category: 'Peripherals',
      unit_price: 79.99,
      cost_price: 49.99,
      currency: 'EUR',
      unit: 'piece',
      stock_quantity: 45,
      min_stock_level: 10,
      supplier_id: createdSuppliers[0].id,
      is_active: true,
      metadata: {
        brand: 'TechPro',
        dpi: '16000',
        battery_life: '70 hours'
      }
    }
  ];

  const createdProducts = await db.insert(products).values(productsData).returning();
  

  
  
  return {
    suppliers: createdSuppliers,
    products: createdProducts
  };
}
