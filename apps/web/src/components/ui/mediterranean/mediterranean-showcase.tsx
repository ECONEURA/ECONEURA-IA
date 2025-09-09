import {
  MediterraneanCard,
  MediterraneanButton,
  MediterraneanBadge,
  MediterraneanStatsCard,
  MediterraneanFeatureCard
} from './index'
import {
  ChartBarIcon,
  UserGroupIcon,
  BuildingOfficeIcon,
  CurrencyEuroIcon,
  CpuChipIcon,
  ArrowRightIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline'

export function MediterraneanShowcase(): void {
  return (;
    <div className="min-h-screen bg-gradient-to-br from-sand-50 via-white to-mediterranean-50 p-8">
      <div className="max-w-7xl mx-auto space-y-12">

        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-mediterranean-900 font-display mb-4">
            Mediterranean UI Components
          </h1>
          <p className="text-lg text-mediterranean-600 max-w-2xl mx-auto">
            Una colección completa de componentes UI inspirados en la elegancia mediterránea
          </p>
        </div>

        {/* Cards Section */}
        <section>
          <h2 className="text-2xl font-bold text-mediterranean-900 mb-6">Cards</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MediterraneanCard variant="default" color="mediterranean" className="p-6">
              <h3 className="font-semibold text-mediterranean-900 mb-2">Default Card</h3>
              <p className="text-mediterranean-600 text-sm">Card con estilo por defecto</p>
            </MediterraneanCard>

            <MediterraneanCard variant="elevated" color="coral" className="p-6">
              <h3 className="font-semibold text-coral-900 mb-2">Elevated Card</h3>
              <p className="text-coral-600 text-sm">Card con elevación</p>
            </MediterraneanCard>

            <MediterraneanCard variant="outlined" color="olive" className="p-6">
              <h3 className="font-semibold text-olive-900 mb-2">Outlined Card</h3>
              <p className="text-olive-600 text-sm">Card con borde</p>
            </MediterraneanCard>

            <MediterraneanCard variant="gradient" color="sand" className="p-6">
              <h3 className="font-semibold text-sand-900 mb-2">Gradient Card</h3>
              <p className="text-sand-600 text-sm">Card con gradiente</p>
            </MediterraneanCard>
          </div>
        </section>

        {/* Buttons Section */}
        <section>
          <h2 className="text-2xl font-bold text-mediterranean-900 mb-6">Buttons</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-4">
              <h3 className="font-semibold text-mediterranean-900">Primary</h3>
              <div className="space-y-2">
                <MediterraneanButton variant="primary" color="mediterranean" size="sm">
                  Small
                </MediterraneanButton>
                <MediterraneanButton variant="primary" color="mediterranean" size="md">
                  Medium
                </MediterraneanButton>
                <MediterraneanButton variant="primary" color="mediterranean" size="lg">
                  Large
                </MediterraneanButton>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-mediterranean-900">Secondary</h3>
              <div className="space-y-2">
                <MediterraneanButton variant="secondary" color="coral" size="sm">
                  Small
                </MediterraneanButton>
                <MediterraneanButton variant="secondary" color="coral" size="md">
                  Medium
                </MediterraneanButton>
                <MediterraneanButton variant="secondary" color="coral" size="lg">
                  Large
                </MediterraneanButton>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-mediterranean-900">With Icons</h3>
              <div className="space-y-2">
                <MediterraneanButton
                  variant="primary"
                  color="olive"
                  icon={<ArrowRightIcon className="h-4 w-4" />}
                  iconPosition="right"
                >
                  With Icon
                </MediterraneanButton>
                <MediterraneanButton
                  variant="gradient"
                  color="sand"
                  icon={<SparklesIcon className="h-4 w-4" />}
                  iconPosition="left"
                >
                  Gradient
                </MediterraneanButton>
              </div>
            </div>
          </div>
        </section>

        {/* Badges Section */}
        <section>
          <h2 className="text-2xl font-bold text-mediterranean-900 mb-6">Badges</h2>
          <div className="flex flex-wrap gap-4">
            <MediterraneanBadge variant="default" color="mediterranean">Default</MediterraneanBadge>
            <MediterraneanBadge variant="success">Success</MediterraneanBadge>
            <MediterraneanBadge variant="warning">Warning</MediterraneanBadge>
            <MediterraneanBadge variant="danger">Danger</MediterraneanBadge>
            <MediterraneanBadge variant="info">Info</MediterraneanBadge>
            <MediterraneanBadge variant="default" color="coral">Coral</MediterraneanBadge>
            <MediterraneanBadge variant="default" color="olive">Olive</MediterraneanBadge>
            <MediterraneanBadge variant="default" color="sand">Sand</MediterraneanBadge>
          </div>
        </section>

        {/* Stats Cards Section */}
        <section>
          <h2 className="text-2xl font-bold text-mediterranean-900 mb-6">Stats Cards</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MediterraneanStatsCard
              title="Total Users"
              value="2,847"
              change="+12%"
              changeType="positive"
              icon={<UserGroupIcon className="h-5 w-5" />}
              color="mediterranean"
            />
            <MediterraneanStatsCard
              title="Revenue"
              value="€45,230"
              change="+8.2%"
              changeType="positive"
              icon={<CurrencyEuroIcon className="h-5 w-5" />}
              color="coral"
            />
            <MediterraneanStatsCard
              title="Products"
              value="1,234"
              change="-3.1%"
              changeType="negative"
              icon={<BuildingOfficeIcon className="h-5 w-5" />}
              color="olive"
            />
            <MediterraneanStatsCard
              title="AI Tasks"
              value="89"
              change="+15%"
              changeType="positive"
              icon={<CpuChipIcon className="h-5 w-5" />}
              color="sand"
            />
          </div>
        </section>

        {/* Feature Cards Section */}
        <section>
          <h2 className="text-2xl font-bold text-mediterranean-900 mb-6">Feature Cards</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <MediterraneanFeatureCard
              title="CRM Avanzado"
              description="Gestiona contactos, empresas y oportunidades de negocio con elegancia mediterránea"
              icon={<UserGroupIcon className="h-8 w-8" />}
              href="/crm"
              color="mediterranean"
              gradientFrom="coral"
              gradientTo="terracotta"
            />
            <MediterraneanFeatureCard
              title="ERP Completo"
              description="Sistema integral de gestión empresarial con facturación y control de inventario"
              icon={<BuildingOfficeIcon className="h-8 w-8" />}
              href="/erp"
              color="olive"
              gradientFrom="olive"
              gradientTo="olive"
            />
          </div>
        </section>

        {/* Color Palette Section */}
        <section>
          <h2 className="text-2xl font-bold text-mediterranean-900 mb-6">Color Palette</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <h3 className="font-semibold text-mediterranean-900 mb-3">Mediterranean</h3>
              <div className="space-y-2">
                <div className="h-8 bg-mediterranean-500 rounded"></div>
                <div className="h-8 bg-mediterranean-400 rounded"></div>
                <div className="h-8 bg-mediterranean-300 rounded"></div>
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-coral-900 mb-3">Coral</h3>
              <div className="space-y-2">
                <div className="h-8 bg-coral-500 rounded"></div>
                <div className="h-8 bg-coral-400 rounded"></div>
                <div className="h-8 bg-coral-300 rounded"></div>
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-olive-900 mb-3">Olive</h3>
              <div className="space-y-2">
                <div className="h-8 bg-olive-500 rounded"></div>
                <div className="h-8 bg-olive-400 rounded"></div>
                <div className="h-8 bg-olive-300 rounded"></div>
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-sand-900 mb-3">Sand</h3>
              <div className="space-y-2">
                <div className="h-8 bg-sand-500 rounded"></div>
                <div className="h-8 bg-sand-400 rounded"></div>
                <div className="h-8 bg-sand-300 rounded"></div>
              </div>
            </div>
          </div>
        </section>

      </div>
    </div>
  )
}
