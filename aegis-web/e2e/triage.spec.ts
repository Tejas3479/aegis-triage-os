// @ts-ignore
import { test, expect } from '@playwright/test';

// @ts-ignore
test('Patient triage flow', async ({ page }: any) => {
  await page.goto('/patient/wizard');
  
  // Accept consent
  await page.click('button:has-text("I understand")');
  
  // Step 1: Chief Complaint
  await page.fill('input[placeholder="Describe your main symptom..."]', 'Chest pain');
  await page.click('button:has-text("Next")');
  
  // Step 2: Pain Scale
  // Click on the face corresponding to high pain
  await page.click('button:has-text("😭")');
  await page.click('button:has-text("Next")');
  
  // Step 3: Duration
  await page.fill('input[placeholder="e.g., 2 hours, 3 days..."]', '2 hours');
  await page.click('button:has-text("Next")');
  
  // Step 4: Risk Factors
  await page.click('text=Chest pain or tightness');
  
  // Check emergency banner
  await expect(page.locator('text=Immediate Care Recommended')).toBeVisible();
  
  // Submit
  await page.click('button:has-text("Submit Triage")');
  
  // Check success
  await expect(page.locator('text=Triage submitted successfully')).toBeVisible();
});

// @ts-ignore
test('Offline syncing queue', async ({ page }: any) => {
  const context = page.context();

  await page.goto('/patient/wizard');
  
  // 1. Accept consent
  await page.click('button:has-text("I understand")');

  // 2. Trigger offline state in the browser context
  await context.setOffline(true);

  // 3. Fill out triage form
  await page.fill('input[placeholder="Describe your main symptom..."]', 'Dull ache in stomach');
  await page.click('button:has-text("Next")');

  await page.click('button:has-text("😐")'); // Pain scale 4
  await page.click('button:has-text("Next")');

  await page.fill('input[placeholder="e.g., 2 hours, 3 days..."]', '3 days');
  await page.click('button:has-text("Next")');

  // Submit
  await page.click('button:has-text("Submit Triage")');

  // 4. Verify offline queue contains the item and SyncStatus says "Offline"
  await expect(page.locator('text=Offline')).toBeVisible();

  // 5. Trigger online state
  await context.setOffline(false);

  // 6. Verify request is replayed and SyncStatus goes to idle (disappears)
  await expect(page.locator('text=Offline')).not.toBeVisible();
});

// @ts-ignore
test('Doctor login and queue view', async ({ page }: any) => {
  await page.goto('/login');
  
  // Fill in credentials
  await page.fill('input[placeholder="Enter ID_SECURE"]', 'doctor_smith');
  await page.fill('input[placeholder="••••"]', 'doctor-password');
  
  // Submit
  await page.click('button:has-text("Initialize Session")');
  
  // Verify redirect to queue
  await expect(page).toHaveURL(/\/doctor\/queue/);
  
  // Assert either the empty state or an loaded queue row is present
  const emptyState = page.locator('text=No active clinical encounters');
  const reviewButton = page.locator('text=Review Assessment');
  
  await expect(emptyState.or(reviewButton).first()).toBeVisible();
});

// @ts-ignore
test('Consent revocation validation', async ({ page }: any) => {
  await page.goto('/patient/wizard');
  
  // 1. Accept consent
  await page.click('button:has-text("I understand")');
  
  // Assert consent gate is gone and wizard is visible
  await expect(page.locator('text=Clinical Triage Wizard')).toBeVisible();
  
  // 2. Click "Revoke Consent" in the footer
  await page.click('button:has-text("Revoke Consent")');
  
  // 3. Verify page redirects back to pre-consent state (ConsentGate modal is visible again)
  await expect(page.locator('text=Privacy & Clinical Consent')).toBeVisible();
});
