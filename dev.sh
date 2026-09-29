#!/usr/bin/env bash
# Shortcut to run Ranniti backend and web together with one command

cd "$(dirname "$0")" || exit 1
npm run dev
