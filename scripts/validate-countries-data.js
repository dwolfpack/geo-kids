#!/usr/bin/env node
// Validates geo-kids/js/countries-data.js (schema, uniqueness) and,
// with --levels, cross-checks index.html's LEVELS array against it.
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.join(__dirname, "..");
const REQUIRED_FIELDS = ["name", "capital", "continent", "pop", "lang", "landmark", "fact"];

function loadCountriesData() {
  const file = path.join(ROOT, "geo-kids/js/countries-data.js");
  return require(file);
}

function loadLevels() {
  const file = path.join(ROOT, "geo-kids/index.html");
  const html = fs.readFileSync(file, "utf8");
  const match = html.match(/const LEVELS = (\[[\s\S]*?\]);/);
  if (!match) throw new Error("LEVELS array not found in geo-kids/index.html");
  const sandbox = {};
  vm.createContext(sandbox);
  vm.runInContext(`this.LEVELS = ${match[1]};`, sandbox);
  return sandbox.LEVELS;
}

function validateCountries(countries) {
  const errors = [];
  if (!Array.isArray(countries) || countries.length === 0) {
    errors.push("COUNTRIES is missing or empty");
    return errors;
  }
  const seenCodes = new Set();
  countries.forEach((c, i) => {
    if (!c.code || typeof c.code !== "string" || c.code !== c.code.toLowerCase()) {
      errors.push(`entry ${i}: missing/invalid lowercase "code"`);
    } else if (seenCodes.has(c.code)) {
      errors.push(`duplicate code "${c.code}"`);
    } else {
      seenCodes.add(c.code);
    }
    REQUIRED_FIELDS.forEach(field => {
      const v = c[field];
      if (!v || typeof v.he !== "string" || !v.he || typeof v.en !== "string" || !v.en) {
        errors.push(`entry ${c.code || i}: field "${field}" missing he/en text`);
      }
    });
    if (typeof c.lat !== "number" || typeof c.lon !== "number") {
      errors.push(`entry ${c.code || i}: lat/lon must be numbers`);
    }
  });
  return errors;
}

function validateLevels(levels, countries) {
  const errors = [];
  const countryCodes = new Set(countries.map(c => c.code));
  const seenInLevels = new Set();
  levels.forEach(level => {
    level.codes.forEach(code => {
      if (seenInLevels.has(code)) errors.push(`code "${code}" appears in more than one level`);
      seenInLevels.add(code);
      if (!countryCodes.has(code)) errors.push(`level ${level.key}: code "${code}" not found in COUNTRIES`);
    });
  });
  countryCodes.forEach(code => {
    if (!seenInLevels.has(code)) errors.push(`COUNTRIES code "${code}" is not assigned to any level`);
  });
  return errors;
}

function main() {
  const checkLevels = process.argv.includes("--levels");
  const { COUNTRIES } = loadCountriesData();
  let errors = validateCountries(COUNTRIES);

  if (checkLevels) {
    const LEVELS = loadLevels();
    errors = errors.concat(validateLevels(LEVELS, COUNTRIES));
  }

  if (errors.length > 0) {
    errors.forEach(e => console.error(`FAIL: ${e}`));
    console.error(`\n${errors.length} problem(s) found across ${COUNTRIES.length} countries.`);
    process.exit(1);
  }
  console.log(`PASS: ${COUNTRIES.length} countries valid${checkLevels ? ", LEVELS coverage valid" : ""}.`);
}

main();
