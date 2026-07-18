# AngularPractice

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 21.2.2.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Docker

This project can run as two containers composed together:

- `frontend`: Angular production build served by Nginx
- `backend`: Node WebSocket server

Nginx also proxies `/ws` to the backend container, so the browser uses a same-origin WebSocket URL instead of a hardcoded localhost port.

Build and run everything:

```bash
npm run docker:up
```

Then open:

```text
http://localhost:8080
```

Useful Docker commands:

```bash
npm run docker:build
npm run docker:down
npm run docker:logs
```

Run the published GHCR images:

```bash
npm run docker:prod:pull
npm run docker:prod:up
```

Then open:

```text
http://localhost:8080
```

By default this uses the `latest` image tag. To run a specific CI image tag:

```bash
IMAGE_TAG=sha-<commit-sha> npm run docker:prod:up
```

PowerShell:

```powershell
$env:IMAGE_TAG = 'sha-<commit-sha>'
npm run docker:prod:up
```

Useful production-image commands:

```bash
npm run docker:prod:config
npm run docker:prod:smoke
npm run docker:prod:down
npm run docker:prod:logs
```

The CI workflow also validates `docker-compose.prod.yml` on pull requests. After a merge to
`main`, it pulls the published GHCR images, starts them, checks `http://localhost:8080`, and
then stops the smoke-test stack.

## CI/CD

This repository uses GitHub Actions as the main automation system:

- `CI`: validates formatting, linting, production dependency audit, tests, Angular build,
  Docker image build, artifact upload, GHCR publish, and production-image smoke tests.
- `CodeQL`: scans JavaScript and TypeScript for security issues.
- `Deploy`: manually validates a selected GHCR image tag against `staging` or `production`
  environments. It currently runs as a dry-run/local smoke test until real server secrets are
  added.
- `GHCR Retention Report`: reports old container package versions and can delete old sha-only
  versions when explicitly confirmed.
- `Dependabot`: opens update PRs for npm dependencies, GitHub Actions, and Docker base images.

Create a versioned release image:

```bash
git tag v1.0.0
git push origin v1.0.0
```

The CI workflow publishes Docker images with tags like:

```text
latest
sha-<commit-sha>
v1.0.0
```

Manual deploy dry run:

```text
GitHub Actions -> Deploy -> Run workflow
```

Choose an environment and image tag. To protect production, create GitHub Environments named
`staging` and `production`, then add required reviewers to `production`.

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
