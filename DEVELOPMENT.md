# Databus Development and Release Process

The Databus system is developed and released through a GitHub-based workflow. The process separates ongoing development from stable production releases and keeps the source code, Docker images, releases, and deployed instances aligned.

## 1. Branches

The repository uses three types of branches:

* **`main`** — production branch containing the currently released and production-ready version.
* **`dev`** — development branch containing the current integration and development version.
* **`feature branches`** — temporary branches created from `dev` for individual features, fixes, or other changes.

### Feature development

1. A developer creates a feature branch from `dev`.
2. Changes are developed and tested on the feature branch.
3. A Pull Request (PR) is created to merge the feature branch into `dev`.
4. After review and successful checks, the PR is merged into `dev`.
5. The feature branch can then be deleted.

Direct changes to `main` are avoided; changes reach `main` through the release process.

Direct changes to `dev` are acceptable for small/minor changes.

## 2. Development Deployment

The `dev` branch represents the current development state of Databus.

A deployable Docker image is built from `dev` and deployed to the **Databus development instance**:

**https://databus.dev.dbpedia.link/**

**Open question:** How frequently should the development instance be deployed — on every commit, daily, weekly, or according to another schedule?

The development deployment is used to integrate and test changes before they become part of a production release.

> **IMPORTANT:** The development instance is considered **unstable** and should be used for testing purposes. Data published on the development instance may be removed or reset.

## 3. Release to Production

When the state of `dev` is considered stable and ready for release:

1. The current `dev` state is reviewed and tested.
2. A release is prepared, including the appropriate version/tag.
3. `dev` is merged into `main`.
4. A production Docker image is built from the released `main` version.
5. The image is deployed to the **Databus production instance**:

**https://databus.dbpedia.org/**

The production deployment therefore corresponds to a specific released state of `main`.

## 4. Versioning and Releases

Each production release should be uniquely identifiable by a version and/or Git tag. The release should provide a clear relationship between:

**Git commit/tag → Docker image → deployed service**

This makes it possible to determine exactly which source-code version is running in production and to reproduce or roll back a deployment if necessary.

The same principle applies to the development deployment:

**`dev` commit → development Docker image → development service**

## 5. Continuous Consistency and Audit

The Databus system is monitored at two levels: the **application layer** and the **deployed service layer**.

### Application Layer — Repository and Release Audit

An **Application Audit** checks the Databus repositories and release artifacts for consistency. It can verify, for example:

* consistency of `dev` and `main` branches;
* Git tags and releases;
* Dockerfiles and Docker image definitions;
* Docker image versions/tags;
* build and release configuration;
* relationship between source-code commits, releases, and Docker images;
* whether the documented release process is reflected in the repositories.

The audit identifies inconsistencies and produces a list of issues or TODOs for Databus developers.

The Application Audit can be implemented as an automated agent that continuously checks the repositories, releases, Docker configuration, and related artifacts.

### Deployed Service Layer — Deployment and Runtime Audit

A **Deployed Service Audit** checks the actual running Databus instances:

* development instance: **https://databus.dev.dbpedia.link/**
* production instance: **https://databus.dbpedia.org/**

It can verify that the deployed services are operational and consistent with the expected application and release state. It may:

* inspect the deployed version;
* verify that the expected Docker image is running;
* run functional or integration tests;
* check the availability and behavior of the service;
* compare the deployed state with the corresponding Docker image and Git release;
* identify inconsistencies between the expected and actual deployed state.

Detected inconsistencies are reported as issues or TODOs for the Databus developers.

## 6. Overall Release Flow

The complete development and release process can be summarized as:

**Feature branch → PR → `dev` → development Docker image → development deployment → testing/audit → release → `main` → production Docker image → production deployment → deployed-service audit**

The goal is to maintain traceability and consistency across the complete lifecycle:

**Source Code → Release → Docker Image → Deployment → Running Service**

The **Application Audit** verifies the consistency of the repository, releases, and Docker artifacts, while the **Deployed Service Audit** verifies the state and behavior of the actual deployed services. Together, they provide automated feedback when inconsistencies occur and identify issues or TODOs for the Databus development team.
