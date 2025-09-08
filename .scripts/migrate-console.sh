#!/bin/bash

# Script de migração automática de console.* para devConsole
# Este script migra automaticamente os usos mais comuns de console.*

echo "🚀 Iniciando migração automática de console.* para devConsole..."

# Função para adicionar import do devConsole se não existir
add_dev_console_import() {
    local file="$1"
    
    # Verifica se o import já existe
    if ! grep -q "import.*devConsole.*from.*~/shared/utils/devConsole" "$file"; then
        # Encontra a última linha de import
        local last_import_line=$(grep -n "^import" "$file" | tail -1 | cut -d: -f1)
        
        if [[ -n "$last_import_line" ]]; then
            # Adiciona o import após a última linha de import
            sed -i "${last_import_line}a\\import { devConsole } from '~/shared/utils/devConsole'" "$file"
            echo "  ✅ Adicionado import devConsole em $file"
        fi
    fi
}

# Função para migrar console calls em um arquivo
migrate_console_in_file() {
    local file="$1"
    echo "  🔄 Migrando $file..."
    
    # Adiciona import primeiro
    add_dev_console_import "$file"
    
    # Migra console.debug para devConsole.debug
    sed -i 's/console\.debug(/devConsole.debug(/g' "$file"
    
    # Migra console.log para devConsole.log
    sed -i 's/console\.log(/devConsole.log(/g' "$file"
    
    # Migra console.warn para devConsole.warn
    sed -i 's/console\.warn(/devConsole.warn(/g' "$file"
    
    # Para console.error, só migra se não for error handling crítico
    # (deixamos alguns manuais para revisão caso a caso)
}

# Lista de arquivos para migrar (evita arquivos de erro handling)
files_to_migrate=$(pnpm lint --no-cache 2>/dev/null | grep "error.*Unexpected console statement" | cut -d: -f1 | sort -u | grep -v "src/shared/error" | grep -v "test")

if [[ -z "$files_to_migrate" ]]; then
    echo "✅ Nenhum arquivo encontrado para migração!"
    exit 0
fi

echo "📂 Arquivos encontrados para migração:"
echo "$files_to_migrate"
echo ""

# Migra cada arquivo
while IFS= read -r file; do
    if [[ -f "$file" ]]; then
        migrate_console_in_file "$file"
    fi
done <<< "$files_to_migrate"

echo ""
echo "✅ Migração automática concluída!"
echo "🔍 Executando verificação..."

# Conta violações restantes
remaining=$(pnpm lint --no-cache 2>/dev/null | grep -c "error.*Unexpected console statement" || echo "0")
echo "📊 Violações restantes: $remaining"

if [[ "$remaining" -gt 0 ]]; then
    echo "⚠️  Algumas violações precisam de migração manual (principalmente console.error)"
else
    echo "🎉 Todas as violações foram migradas com sucesso!"
fi