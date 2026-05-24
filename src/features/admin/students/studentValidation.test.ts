import assert from 'node:assert/strict';
import test from 'node:test';
import {
  BLOOD_GROUP_OPTIONS,
  GENDER_OPTIONS,
  isValidBdMobile,
  isValidDob,
  isValidGpa,
  normalizeBdMobile,
  validateAdminStudentForm,
} from './studentValidation';

test('normalizes and validates Bangladesh mobile numbers', () => {
  assert.equal(normalizeBdMobile('+8801712345678'), '01712345678');
  assert.equal(normalizeBdMobile('88 01712-345678'), '01712345678');
  assert.equal(isValidBdMobile('01712345678'), true);
  assert.equal(isValidBdMobile('+8801712345678'), true);
  assert.equal(isValidBdMobile('01212345678'), false);
  assert.equal(isValidBdMobile('0171234567'), false);
});

test('validates GPA values as optional 0 to 5 numbers with two decimals', () => {
  ['', '0', '3.75', '5', '5.00'].forEach(value => assert.equal(isValidGpa(value), true));
  ['5.01', '-1', '4.123', 'abc'].forEach(value => assert.equal(isValidGpa(value), false));
});

test('validates DOB as a real non-future date', () => {
  assert.equal(isValidDob('2005-02-28'), true);
  assert.equal(isValidDob('2005-02-31'), false);
  assert.equal(isValidDob('2999-01-01'), false);
});

test('validates admin required and enum fields', () => {
  const errors = validateAdminStudentForm({
    fullName: '',
    mobile: '01234567890',
    branchId: '',
    email: 'bad-email',
    gender: 'male',
    bloodGroup: 'A1',
    sscGpa: '6',
  });

  assert.equal(errors.fullName, 'Name is required');
  assert.equal(errors.mobile, 'Invalid BD mobile (01XXXXXXXXX)');
  assert.equal(errors.branchId, 'Branch is required');
  assert.equal(errors.email, 'Invalid email');
  assert.equal(errors.gender, 'Select a valid gender');
  assert.equal(errors.bloodGroup, 'Select a valid blood group');
  assert.equal(errors.sscGpa, 'SSC GPA must be between 0.00 and 5.00');
});

test('documents accepted gender and blood group values', () => {
  assert.deepEqual(GENDER_OPTIONS, ['MALE', 'FEMALE', 'OTHER']);
  assert.deepEqual(BLOOD_GROUP_OPTIONS, ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']);
});
