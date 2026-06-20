import test from 'node:test';
import assert from 'node:assert/strict';
import {
  effectiveStudentSearch,
  isExactStudentLookup,
  studentSearchHint,
  STUDENT_SEARCH_MIN_LENGTH,
} from './studentSearch';

test('isExactStudentLookup recognizes reg no, mobile, email', () => {
  assert.equal(isExactStudentLookup('1234567'), true);
  assert.equal(isExactStudentLookup('01712345678'), true);
  assert.equal(isExactStudentLookup('user@example.com'), true);
  assert.equal(isExactStudentLookup('ab'), false);
});

test('effectiveStudentSearch skips short non-exact queries', () => {
  assert.equal(effectiveStudentSearch(''), '');
  assert.equal(effectiveStudentSearch('a'), '');
  assert.equal(effectiveStudentSearch('ab'), '');
  assert.equal(effectiveStudentSearch('abc'), 'abc');
  assert.equal(effectiveStudentSearch('1234567'), '1234567');
});

test('studentSearchHint guides short queries', () => {
  assert.equal(studentSearchHint('ab'), `Type at least ${STUDENT_SEARCH_MIN_LENGTH} characters (or full mobile / reg no)`);
  assert.equal(studentSearchHint('abc'), null);
  assert.equal(studentSearchHint('1234567'), null);
});
