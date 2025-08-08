# Commit Message Guidelines

This project uses [Conventional Commits](https://www.conventionalcommits.org/) to ensure consistent and meaningful commit messages.

## Format

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

## Types

- **feat**: A new feature
- **fix**: A bug fix
- **docs**: Documentation only changes
- **style**: Changes that do not affect the meaning of the code (white-space, formatting, etc)
- **refactor**: A code change that neither fixes a bug nor adds a feature
- **perf**: A code change that improves performance
- **test**: Adding missing tests or correcting existing tests
- **build**: Changes that affect the build system or external dependencies
- **ci**: Changes to our CI configuration files and scripts
- **chore**: Other changes that don't modify src or test files
- **revert**: Reverts a previous commit
- **types**: Type definition changes
- **config**: Configuration changes

## Scopes (recommended)

- **deps**: Dependencies
- **types**: Type definitions
- **config**: Configuration
- **eslint**: ESLint related
- **prettier**: Prettier related
- **husky**: Git hooks
- **analysis**: Analysis scripts
- **reporting**: Reporting scripts
- **executor**: Test executor
- **runner**: Test runner
- **lambda**: Lambda functions
- **aws**: AWS related
- **cleanup**: Code cleanup
- **docs**: Documentation

## Examples

### Good ✅

```
feat(analysis): add cost optimization algorithm

Implement new algorithm to find optimal memory configurations
based on execution time and cost metrics.

Closes #123
```

```
fix(executor): handle timeout errors properly

- Add proper error handling for request timeouts
- Improve error messages for better debugging
- Add retry logic for transient failures
```

```
docs: update API documentation

Add examples for new cost analysis features.
```

### Bad ❌

```
fixed bug
```

```
Update files
```

```
WIP: working on new feature
```

## Git Hooks

This project uses Husky to enforce code quality:

### Pre-commit Hook
- Runs ESLint with auto-fix
- Runs Prettier to format code
- Runs TypeScript compiler check
- Runs knip to check for unused dependencies

### Commit-msg Hook
- Validates commit message format using commitlint
- Ensures conventional commit standards

## Commands

```bash
# Check commit message format manually
npm run commitlint

# Run all code quality checks
npm run code:check

# Auto-fix code quality issues
npm run code:fix

# Check for unused dependencies
npm run knip
```

## Setup for New Contributors

1. Clone the repository
2. Run `npm install` (this will set up git hooks automatically)
3. Start making commits following the conventional format

The git hooks will automatically run and prevent commits that don't meet our quality standards.
