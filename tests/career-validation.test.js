const test = require('node:test');
const assert = require('node:assert/strict');
const { validateApplication, ROLES } = require('../api/lib/career-validation');

test('rejects missing first name', () => {
  const result = validateApplication({ lastName: 'Doe', email: 'a@b.com', phone: '301-555-1234', role: 'field-service-tech', zip: '21201', yearsExperience: '2', tellUsAboutYou: 'hi', hasMdLicense: 'yes', hasVehicle: 'yes', comfortableFieldWork: 'yes' });
  assert.equal(result.ok, false);
  assert.match(result.errors.firstName, /required/i);
});

test('rejects invalid email', () => {
  const result = validateApplication({ firstName: 'Jane', lastName: 'Doe', email: 'not-an-email', phone: '301-555-1234', role: 'field-service-tech', zip: '21201', yearsExperience: '2', tellUsAboutYou: 'hi', hasMdLicense: 'yes', hasVehicle: 'yes', comfortableFieldWork: 'yes' });
  assert.equal(result.ok, false);
  assert.match(result.errors.email, /valid email/i);
});

test('rejects unknown role', () => {
  const result = validateApplication({ firstName: 'Jane', lastName: 'Doe', email: 'a@b.com', phone: '301-555-1234', role: 'made-up-role', zip: '21201', yearsExperience: '2', tellUsAboutYou: 'hi', hasMdLicense: 'yes', hasVehicle: 'yes', comfortableFieldWork: 'yes' });
  assert.equal(result.ok, false);
  assert.match(result.errors.role, /role/i);
});

test('rejects ZIP that is not 5 digits', () => {
  const result = validateApplication({ firstName: 'Jane', lastName: 'Doe', email: 'a@b.com', phone: '301-555-1234', role: 'field-service-tech', zip: '212', yearsExperience: '2', tellUsAboutYou: 'hi', hasMdLicense: 'yes', hasVehicle: 'yes', comfortableFieldWork: 'yes' });
  assert.equal(result.ok, false);
  assert.match(result.errors.zip, /zip/i);
});

test('rejects tellUsAboutYou over 500 chars', () => {
  const longText = 'x'.repeat(501);
  const result = validateApplication({ firstName: 'Jane', lastName: 'Doe', email: 'a@b.com', phone: '301-555-1234', role: 'field-service-tech', zip: '21201', yearsExperience: '2', tellUsAboutYou: longText, hasMdLicense: 'yes', hasVehicle: 'yes', comfortableFieldWork: 'yes' });
  assert.equal(result.ok, false);
  assert.match(result.errors.tellUsAboutYou, /500/);
});

test('accepts valid application', () => {
  const result = validateApplication({ firstName: 'Jane', lastName: 'Doe', email: 'jane@example.com', phone: '301-555-1234', role: 'field-and-sales-tech', zip: '21201', yearsExperience: '5', tellUsAboutYou: 'I have HVAC and sales experience.', hasMdLicense: 'yes', hasVehicle: 'yes', comfortableFieldWork: 'yes', referralSource: 'Indeed' });
  assert.equal(result.ok, true);
  assert.deepEqual(result.errors, {});
});

test('ROLES list contains the four role slugs', () => {
  assert.deepEqual(ROLES.map(r => r.slug).sort(), [
    'field-and-sales-tech',
    'field-manager',
    'field-sales-rep',
    'field-service-tech',
  ]);
});

test('every role slug has a display name', () => {
  for (const r of ROLES) {
    assert.ok(r.displayName, `role ${r.slug} missing displayName`);
  }
});
