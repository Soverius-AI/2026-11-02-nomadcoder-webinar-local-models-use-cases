#!/usr/bin/env bash
set -eo pipefail
usage() {
  echo 'Usage: bash workshop/chunk-pdf.sh "path/to/manual.pdf" [--size 900] [--overlap 100] [--strategy section|fixed|paragraph|structure] [--out path/to/chunks.json]'
  echo '--out is relative to your current directory; absolute paths also work.'
  echo 'Requires Docker Compose. On Windows use Git Bash or the companion chunk-pdf.ps1.'
}
if [[ ${1:-} == --help || ${1:-} == -h ]]; then usage; exit 0; fi
if [[ $# -eq 0 ]]; then usage >&2; exit 1; fi
input_pdf=$1
shift
if [[ ! -f "$input_pdf" ]]; then echo "PDF file not found: $input_pdf" >&2; exit 1; fi
repo_dir=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd -P)
input_pdf=$(cd -- "$(dirname -- "$input_pdf")" && pwd -P)/$(basename -- "$input_pdf")
source_name=$(basename -- "$input_pdf")
output_path="$repo_dir/workshop/output/chunks.json"
options=()
while [[ $# -gt 0 ]]; do
  case "$1" in
    --out)
      if [[ $# -lt 2 || -z "$2" ]]; then echo 'Missing value for --out' >&2; exit 1; fi
      output_path=$2; shift 2 ;;
    --size|--overlap|--strategy)
      if [[ $# -lt 2 ]]; then echo "Missing value for $1" >&2; exit 1; fi
      options+=("$1" "$2"); shift 2 ;;
    *) echo "Unknown option: $1" >&2; usage >&2; exit 1 ;;
  esac
done
# Resolve output before changing directory, so explicit paths belong to the caller.
if [[ -d "$output_path" ]]; then echo "Output path is a directory: $output_path" >&2; exit 1; fi
mkdir -p -- "$(dirname -- "$output_path")"
output_dir=$(cd -- "$(dirname -- "$output_path")" && pwd -P)
output_name=$(basename -- "$output_path")
output_path="$output_dir/$output_name"
compose_file="$repo_dir/workshop/compose.yaml"
run_options=()
# Git Bash must not translate Linux container paths into Windows host paths.
case "$(uname -s)" in
  MINGW*|MSYS*|CYGWIN*)
    input_pdf=$(cygpath -m "$input_pdf")
    compose_file=$(cygpath -m "$compose_file")
    output_dir=$(cygpath -m "$output_dir")
    export MSYS_NO_PATHCONV=1 MSYS2_ARG_CONV_EXCL='*' ;;
  Linux*) run_options=(--user "$(id -u):$(id -g)") ;;
esac
mount_arg="$input_pdf:/input/document.pdf:ro"
mkdir -p "$repo_dir/workshop/output"
cd -- "$repo_dir"
docker compose -f "$compose_file" run --rm --no-deps "${run_options[@]}" \
  --volume "$mount_arg" --volume "$output_dir:/result" lab chunk --pdf /input/document.pdf \
  --source-name "$source_name" "${options[@]}" --out "/result/$output_name"
echo "Saved JSON: $output_path"
