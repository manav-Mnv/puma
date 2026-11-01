import { expect, test, type Browser, type Page } from '@playwright/test';
import { execFileSync } from 'node:child_process';

// R1 exit condition (PRD §10): a Parul-email organizer and an ID-only student
// complete the loop on the website: sign up → profile → event → register →
// ticket → check-in → complete → certificate → public verify.

const DB_URL = process.env.E2E_DB_URL ?? 'postgresql://postgres:postgres@127.0.0.1:54322/postgres';
const PASSWORD = 'correct-horse-battery-9';
const run = Date.now().toString(36);

function sql(query: string) {
  execFileSync('psql', [DB_URL, '-v', 'ON_ERROR_STOP=1', '-c', query], { stdio: 'pipe' });
}

/** Current IST wall clock as the Create form expects it. */
function istNow() {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    })
      .formatToParts(new Date())
      .map((p) => [p.type, p.value])
  );
  const hour = Number(parts.hour);
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    start: `${parts.hour}:${parts.minute}`,
    // Stay on the same day: the form takes one date for start and end.
    end: hour >= 22 ? '23:59' : `${String(hour + 2).padStart(2, '0')}:${parts.minute}`,
  };
}

async function signUp(page: Page, email: string) {
  await page.goto('/');
  await expect(page.getByText('Sign in to EDGE')).toBeVisible();
  await page.getByRole('button', { name: 'New here? Create an account' }).click();
  await page.getByLabel('Email', { exact: true }).fill(email);
  await page.getByLabel('Password', { exact: true }).fill(PASSWORD);
  await page.getByRole('button', { name: 'Create account' }).click();
  await expect(page.getByText('Step 1 of 3')).toBeVisible();
}

async function completeProfile(
  page: Page,
  { name, studentId, personalEmail }: { name: string; studentId: string; personalEmail?: string }
) {
  await page.getByLabel('Full name').fill(name);
  await page.getByLabel('Enrollment / student ID').fill(studentId);
  await page.getByRole('button', { name: 'Next' }).click();

  await page.getByRole('radio', { name: 'Parul Institute of Technology' }).click();
  await page.getByLabel('Course / program').fill('B.Tech CSE');
  await page.getByRole('radio', { name: '1', exact: true }).nth(0).click(); // year
  await page.getByRole('radio', { name: '1', exact: true }).nth(1).click(); // semester
  await page.getByRole('radio', { name: 'Hosteller' }).click();
  await page.getByRole('button', { name: 'Next' }).click();

  await page.getByRole('radio', { name: 'Prefer not to say' }).click();
  await page.getByLabel('Mobile number').fill('9876543210');
  if (personalEmail) await page.getByLabel('Personal email').fill(personalEmail);
  await page.getByRole('checkbox').click();
  await page.getByRole('button', { name: 'Finish' }).click();
  await expect(page.getByRole('heading', { name: 'Explore' })).toBeVisible();
}

async function newPage(browser: Browser) {
  const context = await browser.newContext();
  return context.newPage();
}

test('golden path: register → check-in → certificate → verify', async ({ browser }) => {
  const organizerEmail = `prof.${run}@paruluniversity.ac.in`;
  const studentEmail = `fresher.${run}@gmail.com`;
  const studentId = `25UG${run.slice(-6).replace(/\D/g, '1').padStart(6, '0')}`;
  const title = `Swift Workshop ${run}`;

  // 1. Organizer (Path A: Parul email → Verified) signs up and is made Faculty.
  const organizer = await newPage(browser);
  await signUp(organizer, organizerEmail);
  await completeProfile(organizer, { name: 'Prof Mehta', studentId: '20FAC000001', personalEmail: `mehta.${run}@gmail.com` });
  sql(`update public.profiles set role = 'faculty' where parul_email = '${organizerEmail}'`);

  // 2. Faculty creates an event that is live now → published + Verified.
  const when = istNow();
  await organizer.goto('/create');
  await organizer.getByLabel('Title').fill(title);
  await organizer.getByLabel('Description').fill('Intro to SwiftUI');
  await organizer.getByLabel('Venue').fill('Seminar Hall 2');
  await organizer.getByLabel('Date (YYYY-MM-DD)').fill(when.date);
  await organizer.getByLabel('Starts (HH:MM, 24h)').fill(when.start);
  await organizer.getByLabel('Ends (HH:MM, 24h)').fill(when.end);
  await organizer.getByRole('button', { name: 'Publish event' }).click();
  await expect(organizer.getByRole('heading', { name: title })).toBeVisible();
  await expect(organizer.getByLabel(/^Verified/)).toBeVisible();
  const eventUrl = new URL(organizer.url()).pathname;

  // 3. ID-only student (Path B: personal email → Unverified) registers.
  const student = await newPage(browser);
  await signUp(student, studentEmail);
  await completeProfile(student, { name: 'Ravi Shah', studentId });
  await student.getByText(title).click();
  await student.getByRole('button', { name: 'Register' }).click();
  await expect(student.getByText(/You’re registered/)).toBeVisible();

  await student.goto('/tickets');
  const ticketCode = (await student.getByTestId('ticket-code').innerText()).trim();
  expect(ticketCode).toMatch(/^[2-9A-HJKMNP-Z]{3}-[2-9A-HJKMNP-Z]{3}$/); // short entry code

  // 4. Organizer checks the student in (manual code: no camera in CI).
  await organizer.goto(eventUrl);
  await organizer.getByRole('button', { name: 'Scan tickets' }).click();
  await organizer.getByLabel('Or type the entry code').fill(ticketCode);
  await organizer.getByRole('button', { name: 'Check in' }).click();
  await expect(organizer.getByText('✓ Checked in')).toBeVisible();
  await expect(organizer.getByText('Ravi Shah')).toBeVisible();
  await expect(organizer.getByText(`${studentId} · Unverified`)).toBeVisible();

  // Duplicate scan never creates a second attendance.
  await organizer.getByRole('button', { name: 'Scan next' }).click();
  await organizer.getByLabel('Or type the entry code').fill(ticketCode);
  await organizer.getByRole('button', { name: 'Check in' }).click();
  await expect(organizer.getByText('⚠ Already checked in')).toBeVisible();

  // 5. Organizer completes the event → one certificate.
  await organizer.goto(eventUrl);
  await organizer.getByRole('button', { name: 'Mark event complete' }).click();
  await organizer.getByRole('button', { name: 'Yes, complete and issue certificates' }).click();
  await expect(organizer.getByText('Event completed. 1 certificate issued.')).toBeVisible();

  // 6. Student opens the certificate.
  await student.goto('/certificates');
  await student.getByText(title).click();
  await expect(student.getByText(`Ravi Shah (${studentId})`)).toBeVisible();
  const serial = (await student.getByText(/^EDGE-[0-9A-F]{10}$/).first().innerText()).trim();

  // 7. Anyone (signed out) can verify it from the QR link.
  const visitor = await newPage(browser);
  await visitor.goto(`/verify/${serial}`);
  await expect(visitor.getByText('✓ Genuine EDGE certificate')).toBeVisible();
  await expect(visitor.getByText('Ravi Shah')).toBeVisible();
  await visitor.goto('/verify/EDGE-0000000000');
  await expect(visitor.getByText('✕ No certificate with this ID')).toBeVisible();
});
