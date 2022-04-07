---
description: Manage data dependencies like code
---

# Maven for Data

With the growing importance of transparent, reproducible, and FAIR publishing of data as well as the rise of knowledge graphs for digital twins in corporate and research environments in general, there is on the one hand an urging demand for (research) data infrastructure and management platforms to publish and organize produced data assets. On the other hand, there is a huge potential for plenty of applications or workflows that consume large amounts of data trying to create added value (e.g. AI-based learning algorithms).

Realizing such data-driven applications, that aim to be automatically deployed and updated, and use a variety of internal and external data dependencies, poses a multitude of challenges ranging from sustainable dependency management and versioning, to dealing with compression, serialization format, or data model variety.

Inspired by paradigms and techniques successfully applied in software release management and deployment (especially using Maven for Java), we wanted to transfer these to data engineering and management to build “a Maven for data”. Additionally driven by the need for a flexible, heavily automatable dataset management and publishing platform for a new, more agile, easier and automated release cycle of DBpedia - one of the largest extracted, open knowledge graphs - but also by lessons learned from complex but messy data pipelines with multiple stakeholders in both enterprise and academia, we initiated the development of the DBpedia Databus in 2018.

In a nutshell, Databus uses the Apache Maven concept hierarchy (group, artifact, version) and ports it to a Linked Data based platform, in order to manage data pipelines and enable automated publishing and consumption of data.

Looking even a step more into the future, we do not only aim for managing data but also to compile it. Analogous to compiling of software, we define compiling of data as the process that converts, transforms or translates data geared to the needs of a specific target application. [Read more](https://app.gitbook.com/o/Dz3wya1SHjtZLb1v9jl1/s/wINJO48slvfMZ42bjn18/) about how the DBpedia Databus Client brings us one step closer towards our vision of a software client, that - given a dependency configuration - can dump any data asset registered on a data management platform and converts it to a format supported by the target infrastructure - in a single command, like in traditional software dependency, built, and package management systems.
