require('jest-preset-angular/ngcc-jest-processor');
const { pathsToModuleNameMapper } = require('ts-jest/utils');
const { paths } = require('./tsconfig.json').compilerOptions;

/** @type {import('@jest/types').Config.InitialOptions} */
module.exports = {
  preset: 'jest-preset-angular',
  moduleNameMapper: pathsToModuleNameMapper(paths, { prefix: '<rootDir>' }),
  setupFilesAfterEnv: ['<rootDir>/setup-jest.ts'],
};
