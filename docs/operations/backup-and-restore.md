# Databus Backup and Restore

This document describes a **manual cold backup and restore** of a Databus instance deployed with the repository's root `docker-compose.yml`. The procedure was successfully tested on localhost on **11 November 2026**.

> **Scope:** This is a tested local recovery procedure, **not yet a production backup solution**. All Databus services must be stopped while the backup is created. Live backups, off-host recovery, and recovery across software versions have not been validated.

## Tested Databus revision

- **Repository:** [dbpedia/databus](https://github.com/dbpedia/databus)
- **Branch used:** `main`
- **Exact commit used:** [`bfb63951bc2f884c83f15117d93e3754489070fb`](https://github.com/dbpedia/databus/commit/bfb63951bc2f884c83f15117d93e3754489070fb)

This commit SHA was captured during the test in `../databus-recovery-test/git-commit.txt` using `git rev-parse HEAD`. To reproduce the tested repository state, use this fixed commit rather than the changing tip of `main`.

To check the recorded SHA:

```bash
cat ../databus-recovery-test/git-commit.txt
```

For an independent reproduction, check out that commit and use the backed-up `.env` and compatible container images. The image tags used in this local test include mutable `:dev` tags, so the Git commit alone does not guarantee identical containers; retain the recorded image information as well.

## Prerequisites

- Git, Docker Engine, and Docker Compose v2.
- A working Databus deployment using the **root** `docker-compose.yml` (not `devenv/`).
- Access to the Databus repository and its `.env` configuration.
- Enough free disk space for the backup and a second copy of the original data.
- A known test artifact or other data that can be checked after restoration.

Run all commands from the **root of the Databus repository**. The examples assume the local web interface is available at `http://localhost:3000`.

## Data to back up

The root Docker Compose configuration uses bind mounts under `data/`:

| Directory | Purpose |
| --- | --- |
| `data/sqlite/` | Local SQLite user database |
| `data/keypair/` | Cryptographic key material |
| `data/virtuoso/` | Virtuoso database |
| `data/gstore/repo/` | GStore Git-backed storage |
| `data/gstore/logs/` | GStore logs |
| `data/index/` | Lookup search index |
| `data/dav/` | Locally stored WebDAV files, if used |
| `data/tls/` | TLS certificates and Caddy state, if used |

**Back up the entire `data/` directory** rather than only selected subdirectories. Also preserve `.env`, the Git revision, and information about the Docker images. Depending on the deployment, additional externally mounted files, secrets, and configuration may require separate backup.

> **Security:** The backup may contain private keys, credentials, and user information. Keep it in a protected location; do not commit it to Git. For production, encrypt it and store a copy off-host.

## 1. Create a backup

### 1.1 Verify the instance

```bash
docker compose ps
```

Before stopping the services, verify that the web interface works and record the URL of a test artifact that can be checked after restoration.

### 1.2 Stop the services

```bash
docker compose stop
docker compose ps -a
```

Confirm that `databus`, `gstore`, `lookup`, and `virtuoso` are stopped. Do **not** archive database files while the containers are running.

### 1.3 Archive persistent data and configuration

```bash
mkdir -p ../databus-recovery-test

tar -czf ../databus-recovery-test/databus-data.tar.gz data/

cp .env ../databus-recovery-test/databus.env
git rev-parse HEAD > ../databus-recovery-test/git-commit.txt
docker compose images > ../databus-recovery-test/images.txt
```

The backup is saved outside the repository, in `../databus-recovery-test/`. Use a new, empty backup directory for each recovery test to avoid overwriting earlier backups.

### 1.4 Verify the archive

```bash
ls -lh ../databus-recovery-test/
tar -tzf ../databus-recovery-test/databus-data.tar.gz > /dev/null && echo "Backup archive OK"
```

Inspect the archived paths if needed:

```bash
tar -tzf ../databus-recovery-test/databus-data.tar.gz | head -30
```

Ensure the archive includes `data/sqlite/`, `data/keypair/`, `data/virtuoso/`, `data/gstore/`, `data/index/`, `data/dav/`, and `data/tls/`.

**Do not remove the original data until the archive has been verified.** Successfully listing an archive is an integrity check, but it does not by itself prove that the application can be restored.

## 2. Restore into a replacement instance (local test)

> **Destructive-operation warning:** The following steps replace the active `data/` directory. Use them only on a designated test instance. Keep the original data until recovery has been verified.

### 2.1 Remove the old containers and isolate the original data

```bash
docker compose down
mv data ../databus-recovery-test/original-data
```

This simulates the loss of the old deployment while preserving the original files for fallback. Do not use `docker compose down -v` or delete the `original-data/` directory.

### 2.2 Restore persistent data

From the same repository root, using the same compatible Compose configuration and `.env` values:

```bash
tar -xzf ../databus-recovery-test/databus-data.tar.gz -C .
du -sh data/*/
```

If the original configuration is no longer available, restore `databus.env` as `.env` **before** starting the containers. Review it for environment-specific settings and secrets. In this localhost test, the existing `.env` was retained.

### 2.3 Start the replacement instance

```bash
docker compose up -d
docker compose ps
```

Check startup logs if necessary:

```bash
docker compose logs --tail=100
```

Confirm that all four services are running and that the Databus UI is reachable.

## 3. Validate the restored instance

A successful container start is not sufficient evidence of recovery. Complete the following checks:

- [ ] Open a previously published artifact and verify its metadata, version, and file distribution.
- [ ] Log out and log in again with an existing test account.
- [ ] Find the restored artifact through Databus search.
- [ ] Confirm that a SPARQL query can retrieve the restored metadata.
- [ ] Publish a new artifact or version to confirm write operations still work.
- [ ] Review the container logs for errors affecting normal operation.

Additional checks, depending on the features used by the instance, should cover collections, API access, keys, WebDAV files, and download statistics.

### Verified localhost test (11 November 2026)

The manual procedure was tested with Docker Compose on the repository's `main` branch. All four services were restored and running. The following artifact remained accessible:

`http://localhost:3000/tester_one/backup-test/restore-check/2026.11.11`

The following were also successfully verified after restoration: account login, artifact discovery/search, SPARQL retrieval, and publishing new data.

**Result:** PASS — manual cold backup and restore on the same localhost machine and with the same application configuration.

## 4. Limitations and follow-up work

- **Downtime:** The procedure requires stopping all services. A consistent online-backup process has not been tested.
- **Recovery environment:** Recovery was verified on the same machine, not on a fresh host. Back up the deployment configuration and external secrets required to rebuild another host.
- **Image reproducibility:** Some Compose images use mutable `:dev` tags. For dependable recovery, use tested image versions or digests and preserve the exact configuration.
- **External dependencies:** The backup does not include data files hosted elsewhere or the external OIDC identity provider.
- **Operational safeguards:** Production backups need encrypted off-host storage, retention rules, monitored failures, regular restore tests, and clearly defined recovery objectives.
- **Automation:** The existing repository [`backup.sh`](../../backup.sh) uses `/devenv/data` and a placeholder destination. It should be reviewed and improved before operational use. A safe `restore.sh` and automated post-restore verification are also recommended.

## Related files

- [`docker-compose.yml`](../../docker-compose.yml) — service definitions and persistent-data mounts
- [`.env`](../../.env) — instance configuration (do not commit real credentials)
- [`backup.sh`](../../backup.sh) — existing backup script (not used for this verified procedure)
