#!/bin/zsh
# Uso: ./resumen.sh <imagen>
echo "=== Resumen Trivy: $1 ==="
trivy image "$1" --scanners vuln --format json --quiet \
 | jq -r '[.Results[]?.Vulnerabilities[]?] as $v
   | "CRITICAL: \([$v[]|select(.Severity=="CRITICAL")]|length)\nHIGH:     \([$v[]|select(.Severity=="HIGH")]|length)"'
