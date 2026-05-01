const ROLES = [
  { slug: 'field-service-tech',    displayName: 'Field Service Technician' },
  { slug: 'field-sales-rep',       displayName: 'Field Sales Representative' },
  { slug: 'field-and-sales-tech',  displayName: 'Field & Sales Technician' },
  { slug: 'field-manager',         displayName: 'Senior Manager / Field Manager' },
];

const ROLE_SLUGS = new Set(ROLES.map(r => r.slug));

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ZIP_RE = /^\d{5}$/;
const PHONE_RE = /^[\d().\-+\s]{7,}$/;

function validateApplication(input) {
  const errors = {};

  if (!input.firstName || !String(input.firstName).trim()) errors.firstName = 'First name is required.';
  if (!input.lastName || !String(input.lastName).trim()) errors.lastName = 'Last name is required.';

  if (!input.email || !EMAIL_RE.test(String(input.email).trim())) errors.email = 'Enter a valid email address.';
  if (!input.phone || !PHONE_RE.test(String(input.phone).trim())) errors.phone = 'Enter a valid phone number.';

  if (!input.role || !ROLE_SLUGS.has(input.role)) errors.role = 'Pick a role.';

  if (!input.zip || !ZIP_RE.test(String(input.zip).trim())) errors.zip = 'Enter a 5-digit ZIP code.';

  if (input.yearsExperience === undefined || input.yearsExperience === null || input.yearsExperience === '') {
    errors.yearsExperience = 'Years of experience is required.';
  } else if (Number.isNaN(Number(input.yearsExperience))) {
    errors.yearsExperience = 'Years of experience must be a number.';
  }

  if (!input.tellUsAboutYou || !String(input.tellUsAboutYou).trim()) {
    errors.tellUsAboutYou = 'Tell us about yourself.';
  } else if (String(input.tellUsAboutYou).length > 500) {
    errors.tellUsAboutYou = 'Keep it under 500 characters.';
  }

  for (const field of ['hasMdLicense', 'hasVehicle', 'comfortableFieldWork']) {
    if (input[field] !== 'yes' && input[field] !== 'no') {
      errors[field] = 'Answer yes or no.';
    }
  }

  return { ok: Object.keys(errors).length === 0, errors };
}

function getRoleDisplayName(slug) {
  const r = ROLES.find(x => x.slug === slug);
  return r ? r.displayName : slug;
}

module.exports = { ROLES, validateApplication, getRoleDisplayName };
