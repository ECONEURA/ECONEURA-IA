/**
 * E2E tests for NEURA↔Comet + Agentes↔Make integration
 */

import { test, expect } from '@playwright/test';

test.describe('NEURA↔Comet + Agentes↔Make E2E', () => {
  test('NEURA chat with agent execution', async ({ page }) => {
    // Navigate to cockpit
    await page.goto('http://localhost:3000');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Switch to IA department
    await page.click('[data-testid="dept-ia"]');
    
    // Type message in NEURA chat
    await page.fill('[data-testid="neura-chat-input"]', 'Ejecuta el agente de Dunning para el cliente ABC123');
    
    // Send message
    await page.click('[data-testid="neura-chat-send"]');
    
    // Wait for NEURA response
    await page.waitForSelector('[data-testid="neura-response"]');
    
    // Check if tool call was triggered
    const toolCall = await page.locator('[data-testid="tool-call"]');
    await expect(toolCall).toBeVisible();
    
    // Check if agent execution was triggered
    const agentEvent = await page.locator('[data-testid="agent-event"]');
    await expect(agentEvent).toBeVisible();
  });

  test('Voice recognition demo', async ({ page }) => {
    // Navigate to cockpit
    await page.goto('http://localhost:3000');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Switch to IA department
    await page.click('[data-testid="dept-ia"]');
    
    // Check if voice button is visible
    const voiceButton = await page.locator('[data-testid="voice-button"]');
    await expect(voiceButton).toBeVisible();
    
    // Click voice button
    await voiceButton.click();
    
    // Check if listening state is active
    await expect(voiceButton).toHaveClass(/listening/);
  });

  test('Agent execution with HITL approval', async ({ page }) => {
    // Navigate to cockpit
    await page.goto('http://localhost:3000');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Switch to CFO department (requires HITL)
    await page.click('[data-testid="dept-cfo"]');
    
    // Click execute button on an agent
    await page.click('[data-testid="agent-execute-button"]');
    
    // Check if HITL approval dialog appears
    const hitlDialog = await page.locator('[data-testid="hitl-approval-dialog"]');
    await expect(hitlDialog).toBeVisible();
    
    // Approve the action
    await page.click('[data-testid="hitl-approve"]');
    
    // Check if agent execution was triggered
    const agentEvent = await page.locator('[data-testid="agent-event"]');
    await expect(agentEvent).toBeVisible();
  });

  test('Budget guard blocks execution', async ({ page }) => {
    // Navigate to cockpit
    await page.goto('http://localhost:3000');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Mock high budget usage
    await page.evaluate(() => {
      window.localStorage.setItem('budget-pct', '95');
    });
    
    // Try to execute an agent
    await page.click('[data-testid="agent-execute-button"]');
    
    // Check if budget warning appears
    const budgetWarning = await page.locator('[data-testid="budget-warning"]');
    await expect(budgetWarning).toBeVisible();
    
    // Check if agent execution was blocked
    const agentEvent = await page.locator('[data-testid="agent-event"]');
    await expect(agentEvent).not.toBeVisible();
  });

  test('Timeline updates with events', async ({ page }) => {
    // Navigate to cockpit
    await page.goto('http://localhost:3000');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Get initial timeline count
    const initialCount = await page.locator('[data-testid="timeline-event"]').count();
    
    // Execute an agent
    await page.click('[data-testid="agent-execute-button"]');
    
    // Wait for timeline update
    await page.waitForTimeout(1000);
    
    // Check if timeline was updated
    const newCount = await page.locator('[data-testid="timeline-event"]').count();
    expect(newCount).toBeGreaterThan(initialCount);
  });
});

