import Link from 'next/link'
import {
  ChartBarIcon,
  UserGroupIcon,
  BuildingOfficeIcon,
  CurrencyEuroIcon,
  CpuChipIcon,
  ArrowRightIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline'
import { cn } from '@/lib/utils'
import {
  MediterraneanButton,
  MediterraneanStatsCard,
  MediterraneanFeatureCard
} from '@/components/ui/mediterranean'

const features = [
  {
    name: 'CRM Avanzado',
    description: 'Gestiona contactos, empresas y oportunidades de negocio con elegancia mediterránea',
    icon: UserGroupIcon,
    href: '/crm',
    color: 'from-coral-400 to-terracotta-500',
    bgColor: 'from-coral-50 to-terracotta-50',
  },
  {
    name: 'ERP Completo',
    description: 'Sistema integral de gestión empresarial con facturación y control de inventario',
    icon: BuildingOfficeIcon,
    href: '/erp',
    color: 'from-olive-400 to-olive-600',
    bgColor: 'from-olive-50 to-olive-100',
  },
  {
    name: 'Finanzas Inteligentes',
    description: 'Panel CFO con análisis financiero avanzado y reportes en tiempo real',
    icon: CurrencyEuroIcon,
    href: '/finance',
    color: 'from-mediterranean-400 to-mediterranean-600',
    bgColor: 'from-mediterranean-50 to-mediterranean-100',
  },
  {
    name: 'Suite de IA',
    description: 'Herramientas de inteligencia artificial para automatizar y optimizar procesos',
    icon: CpuChipIcon,
    href: '/ai',
    color: 'from-sand-400 to-sand-600',
    bgColor: 'from-sand-50 to-sand-100',
  },
]

const stats = [
  { name: 'Contactos Activos', value: '2,847', change: '+12%', changeType: 'positive' },
  { name: 'Facturación Mensual', value: '€45,230', change: '+8.2%', changeType: 'positive' },
  { name: 'Productos en Stock', value: '1,234', change: '-3.1%', changeType: 'negative' },
  { name: 'Oportunidades Abiertas', value: '89', change: '+15%', changeType: 'positive' },
]

export default function HomePage(): void {
  return (;
    <div className="min-h-full">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-mediterranean-50 via-white to-sand-50 border-b border-sand-200/50">
        <div className="absolute inset-0 bg-gradient-to-r from-mediterranean-500/5 via-transparent to-coral-500/5" />

        <div className="relative px-6 py-16 sm:py-24">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="flex items-center space-x-3 px-4 py-2 bg-gradient-to-r from-coral-100 to-terracotta-100 rounded-full border border-coral-200/50">
                <SparklesIcon className="h-5 w-5 text-coral-600 animate-pulse" />
                <span className="text-sm font-medium text-coral-700">Bienvenido a EcoNeura</span>
                <SparklesIcon className="h-5 w-5 text-coral-600 animate-pulse" />
              </div>
            </div>
            <h1 className="text-5xl sm:text-6xl font-bold font-display">
              <span className="bg-gradient-to-r from-mediterranean-600 via-coral-500 to-terracotta-600 bg-clip-text text-transparent">
                Mediterranean
              </span>
              <br />
              <span className="text-mediterranean-900">Business Suite</span>
            </h1>
            <p className="mt-6 text-lg text-mediterranean-600 max-w-2xl mx-auto leading-relaxed">
              Experimenta la elegancia del Mediterráneo en tu gestión empresarial.
              CRM, ERP e IA unificados en una plataforma diseñada para el éxito.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <MediterraneanButton
                variant="primary"
                color="mediterranean"
                size="lg"
                icon={<ArrowRightIcon className="h-5 w-5" />}
                iconPosition="right"
                asChild
              >
                <Link href="/dashboard">
                  Ver Dashboard
                </Link>
              </MediterraneanButton>

              <MediterraneanButton
                variant="outline"
                color="mediterranean"
                size="lg"
                icon={<CpuChipIcon className="h-5 w-5" />}
                iconPosition="right"
                asChild
              >
                <Link href="/ai/playground">
                  Explorar IA
                </Link>
              </MediterraneanButton>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-white py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
              <MediterraneanStatsCard
                key={stat.name}
                title={stat.name}
                value={stat.value}
                change={stat.change}
                changeType={stat.changeType}
                color="mediterranean"
              />
            ))}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-gradient-to-br from-sand-50 via-white to-mediterranean-50 py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-mediterranean-900 sm:text-4xl font-display">
              Suite Completa de Herramientas
            </h2>
            <p className="mt-4 text-lg text-mediterranean-600 max-w-2xl mx-auto">
              Todo lo que necesitas para gestionar tu empresa, diseñado con la elegancia
              y simplicidad del estilo mediterráneo.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
            {features.map((feature) => (
              <MediterraneanFeatureCard
                key={feature.name}
                title={feature.name}
                description={feature.description}
                icon={<feature.icon className="h-8 w-8" />}
                href={feature.href}
                color="mediterranean"
                gradientFrom={feature.color.split('-')[1]}
                gradientTo={feature.color.split('-')[3]}
              />
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-mediterranean-800 via-mediterranean-700 to-mediterranean-800 py-16">
        <div className="max-w-4xl mx-auto text-center px-6">
          <h2 className="text-3xl font-bold text-white sm:text-4xl font-display">
            Comienza tu Experiencia Mediterránea
          </h2>
          <p className="mt-4 text-lg text-mediterranean-200 max-w-2xl mx-auto">
            Descubre cómo la elegancia mediterránea puede transformar la gestión de tu empresa.
          </p>
          <div className="mt-8">
            <MediterraneanButton
              variant="gradient"
              color="sand"
              size="xl"
              icon={<ChartBarIcon className="h-6 w-6" />}
              iconPosition="left"
              asChild
            >
              <Link href="/dashboard">
                Ir al Dashboard
              </Link>
            </MediterraneanButton>
          </div>
        </div>
      </div>
    </div>
  )
}
