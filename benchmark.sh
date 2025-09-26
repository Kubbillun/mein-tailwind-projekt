#!/usr/bin/env bash
set -euo pipefail

export PROJECT_REF='cypwqibvtekmthbyomre'
export SB_ANON_KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN5cHdxaWJ2dGVrbXRoYnlvbXJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYxMDc3MTAsImV4cCI6MjA3MTY4MzcxMH0._OuhVpXB2g-tlGzWok0Rb91MDVOuxjB5g-XbpHbHWlw'

source ./pagination.sh

time -p fetch_all 100 >/dev/null
