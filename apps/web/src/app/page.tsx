import Link from 'next/link'
import { 
  BarChart3,
  Users,
  Building2,
  Euro,
  Cpu,
  ArrowRight,
  Sparkles,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const features = [
  {
    name: 'CRM Avanzado',
    description: 'Gestiona contactos, empresas y oportunidades de negocio con elegancia mediterránea',
    icon: Users,
    href: '/crm',
    color: 'from-coral-400 to-terracotta-500',
    bgColor: 'from-coral-50 to-terracotta-50',
  },
  {
    name: 'ERP Completo',
    description: 'Sistema integral de gestión empresarial con facturación y control de inventario',
    icon: Building2,
    href: '/erp',
    color: 'from-olive-400 to-olive-600',
    bgColor: 'from-olive-50 to-olive-100',
  },
  {
    name: 'Finanzas Inteligentes',
    description: 'Panel CFO con análisis financiero avanzado y reportes en tiempo real',
    icon: Euro,
    href: '/finance',
    color: 'from-mediterranean-400 to-mediterranean-600',
    bgColor: 'from-mediterranean-50 to-mediterranean-100',
  },
  {
    name: 'Suite de IA',
    description: 'Herramientas de inteligencia artificial para automatizar y optimizar procesos',
    icon: Cpu,
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

export default function HomePage() {
  return (
    <div className="min-h-full">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-mediterranean-50 via-white to-sand-50 border-b border-sand-200/50">
        <div className="absolute inset-0 bg-gradient-to-r from-mediterranean-500/5 via-transparent to-coral-500/5" />
        <div className="relative px-6 py-16 sm:py-24">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="flex items-center space-x-3 px-4 py-2 bg-gradient-to-r from-coral-100 to-terracotta-100 rounded-full border border-coral-200/50">
                <Sparkles className="h-5 w-5 text-coral-600 animate-pulse" />
                <span className="text-sm font-medium text-coral-700">Bienvenido a EcoNeura</span>
                <Sparkles className="h-5 w-5 text-coral-600 animate-pulse" />
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
              <Link
                href="/dashboard"
                className="inline-flex items-center px-8 py-3 border border-transparent text-base font-semibold rounded-xl text-white bg-gradient-to-r from-mediterranean-500 to-mediterranean-600 hover:from-mediterranean-600 hover:to-mediterranean-700 transform hover:scale-105 transition-all duration-300 shadow-mediterranean hover:shadow-lg"
              >
                Ver Dashboard
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <Link
                href="/ai/playground"
                className="inline-flex items-center px-8 py-3 border border-mediterranean-200 text-base font-semibold rounded-xl text-mediterranean-700 bg-white hover:bg-sand-50 transform hover:scale-105 transition-all duration-300 shadow-soft hover:shadow-mediterranean"
              >
                Explorar IA
                <Cpu className="ml-2 h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-white py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
              <div
                key={stat.name}
                className="bg-gradient-to-br from-white to-sand-50/50 border border-sand-200/50 rounded-2xl p-6 shadow-soft hover:shadow-mediterranean transition-all duration-300 transform hover:scale-[1.02]"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-mediterranean-600 truncate">
                      {stat.name}
                    </p>
                    <p className="text-2xl font-bold text-mediterranean-900 font-display">
                      {stat.value}
                    </p>
                  </div>
                  <div className={cn(
                    'px-2.5 py-1 rounded-full text-sm font-medium',
                    stat.changeType === 'positive'
                      ? 'bg-success-100 text-success-700'
                      : 'bg-danger-100 text-danger-700'
                  )}>
                    {stat.change}
                  </div>
                </div>
              </div>
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
              <Link
                key={feature.name}
                href={feature.href}
                className="group relative overflow-hidden bg-white rounded-3xl p-8 shadow-soft hover:shadow-2xl transition-all duration-500 transform hover:scale-[1.02] border border-sand-200/50"
              >
                <div className={cn(
                  'absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-5 transition-opacity duration-500',
                  feature.bgColor
                )} />
                
                <div className="relative">
                  <div className={cn(
                    'inline-flex p-4 rounded-2xl bg-gradient-to-br shadow-lg',
                    feature.color
                  )}>
                    <feature.icon className="h-8 w-8 text-white" />
                  </div>
                  
                  <h3 className="mt-6 text-xl font-bold text-mediterranean-900 font-display group-hover:text-mediterranean-700 transition-colors duration-300">
                    {feature.name}
                  </h3>
                  
                  <p className="mt-3 text-mediterranean-600 leading-relaxed">
                    {feature.description}
                  </p>
                  
                  <div className="mt-6 flex items-center text-mediterranean-500 group-hover:text-coral-500 transition-colors duration-300">
                    <span className="text-sm font-semibold">Explorar</span>
                    <ArrowRight className="ml-2 h-4 w-4 transform group-hover:translate-x-1 transition-transform duration-300" />
                  </div>
                </div>
              </Link>
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
            <Link
              href="/dashboard"
              className="inline-flex items-center px-8 py-4 border border-transparent text-lg font-semibold rounded-2xl text-mediterranean-900 bg-gradient-to-r from-sand-200 to-sand-300 hover:from-sand-300 hover:to-sand-400 transform hover:scale-105 transition-all duration-300 shadow-warm hover:shadow-2xl"
            >
              <BarChart3 className="mr-3 h-6 w-6" />
              Ir al Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}