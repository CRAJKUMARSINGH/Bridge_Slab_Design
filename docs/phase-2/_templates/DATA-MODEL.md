<!-- _templates/DATA-MODEL.md -->
# DATA MODEL

## ER diagram
```mermaid
erDiagram
```

## Tables
| Table | Purpose | Immutable? | Retention | Indexes |

## Reproducibility contract
A run reproduces iff: input_fingerprint AND engine_version AND coefficient_registry_version
AND code_registry_version all match. State where each is stored.

## Backup / restore
Cadence: | Retention: | RTO: | RPO: | Last drill date + result:
