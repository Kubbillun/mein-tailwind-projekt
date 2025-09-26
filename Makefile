SHELL := /bin/bash
.DEFAULT_GOAL := smoke

.PHONY: smoke diagnose first5 page5

smoke:
	@set -euo pipefail; set -a; . ./.env; set +a; source ./pagination.sh; smoke

diagnose:
	@set -euo pipefail; set -a; . ./.env; set +a; source ./pagination.sh; diagnose

first5:
	@set -euo pipefail; set -a; . ./.env; set +a; source ./pagination.sh; fetch_first 5

page5:
	@set -euo pipefail; set -a; . ./.env; set +a; source ./pagination.sh; fetch_first 5 >/dev/null; fetch_page "$$LAST_TS" "$$LAST_ID" 5

.PHONY: allpages
allpages:
	@set -euo pipefail; set -a; . ./.env; set +a; source ./pagination.sh; fetch_all 100
