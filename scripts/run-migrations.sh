#!/bin/sh
# Ejecuta todas las migraciones SQL en orden
set -e

# Obtener todos los archivos .sql desde 01 hasta el final, ordenados
target_files=$(ls scripts/*.sql | sort | grep -v "00-clean-database.sql")

for file in $target_files; do
  echo "Ejecutando $file"
  supabase db execute "$file"
done

