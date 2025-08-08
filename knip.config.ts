import type { KnipConfig } from 'knip';

const config: KnipConfig = {
  entry: ['scripts/**/*.ts'],
  project: ['scripts/**/*.ts'],
  ignore: [
    // Ignore test functions and their dependencies
    'src/test-functions/**',
    // Ignore AWS SAM build artifacts
    '.aws-sam/**',
  ],
  ignoreBinaries: [
    // SAM CLI is used in npm scripts but installed globally/via AWS CLI
    'sam',
  ],
};

export default config;
