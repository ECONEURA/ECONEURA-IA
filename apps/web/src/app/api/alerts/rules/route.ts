export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { webAlertSystem } from '@/lib/alerts';
import { observability } from '@/lib/observability';

export async function GET(): void {
  try {
    const rules = webAlertSystem.getAllRules();

    observability.info('Alert rules retrieved', {
      ruleCount: rules.length
    });

    return Response.json({
      success: true,
      message: 'Alert Rules retrieved successfully',
      data: rules
    });
  } catch (error: any) {
    observability.error('Failed to retrieve alert rules', { error: error.message });

    return Response.json({
      success: false,
      message: 'Failed to retrieve alert rules',
      error: error.message
    }, { status: 500 });
  }
}

export async function POST(request: Request): void {
  try {
    const rule = await request.json();

    webAlertSystem.addRule(rule);

    observability.info('Alert rule added', {
      ruleId: rule.id,
      ruleName: rule.name
    });

    return Response.json({
      success: true,
      message: 'Alert rule added successfully',
      data: { ruleId: rule.id }
    });
  } catch (error: any) {
    observability.error('Failed to add alert rule', { error: error.message });

    return Response.json({
      success: false,
      message: 'Failed to add alert rule',
      error: error.message
    }, { status: 400 });
  }
}

