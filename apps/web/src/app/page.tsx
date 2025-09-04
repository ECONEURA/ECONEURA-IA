import { Metadata } from 'next';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

export const metadata: Metadata = {
  title: 'ECONEURA - ERP+CRM Platform',
  description: 'Modern ERP and CRM platform with AI capabilities',
};

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-secondary-900 mb-4">
            Welcome to ECONEURA
          </h1>
          <p className="text-xl text-secondary-600 mb-8">
            Modern ERP and CRM platform with AI capabilities
          </p>
          <div className="flex gap-4 justify-center">
            <Button size="lg">
              Get Started
            </Button>
            <Button variant="outline" size="lg">
              Learn More
            </Button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>ERP Management</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-secondary-600">
                Complete enterprise resource planning with inventory, finance, and operations management.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>CRM System</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-secondary-600">
                Customer relationship management with leads, contacts, and sales pipeline tracking.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>AI Integration</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-secondary-600">
                Advanced AI capabilities for automation, analytics, and intelligent insights.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
