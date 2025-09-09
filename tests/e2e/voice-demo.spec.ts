/**
 * E2E tests for voice recognition demo
 */

import { test, expect } from '@playwright/test';

test.describe('Voice Recognition Demo', () => {
  test('Voice button toggles listening state', async ({ page }) => {
    // Navigate to cockpit
    await page.goto('http://localhost:3000');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Switch to IA department
    await page.click('[data-testid="dept-ia"]');

    // Check if voice button is visible
    const voiceButton = await page.locator('[data-testid="voice-button"]');
    await expect(voiceButton).toBeVisible();

    // Click to start listening
    await voiceButton.click();
    await expect(voiceButton).toHaveClass(/listening/);

    // Click to stop listening
    await voiceButton.click();
    await expect(voiceButton).not.toHaveClass(/listening/);
  });

  test('Voice recognition sends text to NEURA', async ({ page }) => {
    // Navigate to cockpit
    await page.goto('http://localhost:3000');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Switch to IA department
    await page.click('[data-testid="dept-ia"]');

    // Mock speech recognition result
    await page.evaluate(() => {
      const mockRecognition = {
        start: () => {
          setTimeout(() => {
            const event = new Event('result');
            event.results = [{
              isFinal: true,
              [0]: { transcript: 'Ejecuta el agente de Dunning' }
            }];
            window.dispatchEvent(event);
          }, 100);
        },
        stop: () => {},
        abort: () => {}
      };

      // @ts-ignore
      window.SpeechRecognition = () => mockRecognition;
    });

    // Click voice button
    await page.click('[data-testid="voice-button"]');

    // Wait for speech recognition result
    await page.waitForTimeout(200);

    // Check if text was sent to NEURA
    const neuraInput = await page.locator('[data-testid="neura-chat-input"]');
    await expect(neuraInput).toHaveValue('Ejecuta el agente de Dunning');
  });

  test('Voice recognition handles errors gracefully', async ({ page }) => {
    // Navigate to cockpit
    await page.goto('http://localhost:3000');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Switch to IA department
    await page.click('[data-testid="dept-ia"]');

    // Mock speech recognition error
    await page.evaluate(() => {
      const mockRecognition = {
        start: () => {
          setTimeout(() => {
            const event = new Event('error');
            event.error = 'no-speech';
            window.dispatchEvent(event);
          }, 100);
        },
        stop: () => {},
        abort: () => {}
      };

      // @ts-ignore
      window.SpeechRecognition = () => mockRecognition;
    });

    // Click voice button
    await page.click('[data-testid="voice-button"]');

    // Wait for error
    await page.waitForTimeout(200);

    // Check if error was handled gracefully
    const errorMessage = await page.locator('[data-testid="voice-error"]');
    await expect(errorMessage).toBeVisible();
  });
});

