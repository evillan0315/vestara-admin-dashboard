#!/usr/bin/env bash

set -e

echo "Creating project structure..."

#
# Helpers
#
create_dir() {
  local dir="$1"

  if [ ! -d "$dir" ]; then
    mkdir -p "$dir"
    echo "📁 Created directory: $dir"
  else
    echo "✓ Directory exists: $dir"
  fi
}

create_file() {
  local file="$1"

  if [ ! -f "$file" ]; then
    mkdir -p "$(dirname "$file")"
    : > "$file"
    echo "📄 Created file: $file"
  else
    echo "✓ File exists: $file"
  fi
}

#
# Directories
#
directories=(
  "docs"
  ".github/workflows"

  "prisma"
  "prisma/migrations"

  "src"
  "src/bootstrap"
  "src/config"
  "src/plugins"
  "src/middleware"
  "src/hooks"

  "src/modules/auth"
  "src/modules/users"
  "src/modules/subscribers"
  "src/modules/uploads"
  "src/modules/sync"
  "src/modules/wallet"
  "src/modules/investments"
  "src/modules/payments"
  "src/modules/transactions"
  "src/modules/admin"

  "src/jobs"
  "src/jobs/workers"

  "src/scripts"

  "src/database"
  "src/database/migrations"

  "src/integrations/sms"
  "src/integrations/email"
  "src/integrations/storage"
  "src/integrations/payment-gateway"
  "src/integrations/subscribers-api"

  "src/shared/constants"
  "src/shared/dto"
  "src/shared/errors"
  "src/shared/types"
  "src/shared/validators"
  "src/shared/utils"

  "src/tests/integration"
  "src/tests/unit"
  "src/tests/fixtures"
  "src/tests/mocks"

  "dist"
)

for dir in "${directories[@]}"; do
  create_dir "$dir"
done

#
# Root files
#
files=(
  ".env"
  ".env.local"
  ".gitignore"

  "README.md"
  "package.json"
  "package-lock.json"
  "tsconfig.json"

  "docs/Architecture.md"
  "docs/Workflow.md"
  "docs/Structure.md"
  "docs/API.md"
  "docs/Database.md"
  "docs/Deployment.md"

  ".github/workflows/deploy.yml"
  ".github/workflows/test.yml"
  ".github/workflows/sync-subscribers.yml"

  "prisma/schema.prisma"
  "prisma/seed.ts"

  "src/app.ts"
  "src/server.ts"

  "src/bootstrap/register-plugins.ts"
  "src/bootstrap/register-routes.ts"
  "src/bootstrap/register-hooks.ts"
  "src/bootstrap/register-jobs.ts"
  "src/bootstrap/register-swagger.ts"

  "src/config/env.ts"
  "src/config/logger.ts"
  "src/config/redis.ts"
  "src/config/prisma.ts"
  "src/config/upload.ts"
  "src/config/constants.ts"

  "src/plugins/auth.plugin.ts"
  "src/plugins/cors.plugin.ts"
  "src/plugins/jwt.plugin.ts"
  "src/plugins/prisma.plugin.ts"
  "src/plugins/redis.plugin.ts"
  "src/plugins/swagger.plugin.ts"
  "src/plugins/multipart.plugin.ts"
  "src/plugins/rate-limit.plugin.ts"

  "src/middleware/auth.middleware.ts"
  "src/middleware/admin.middleware.ts"
  "src/middleware/error.middleware.ts"

  "src/hooks/on-request.ts"
  "src/hooks/pre-handler.ts"
  "src/hooks/on-send.ts"
  "src/hooks/on-response.ts"

  "src/jobs/queue.ts"
  "src/jobs/scheduler.ts"

  "src/jobs/workers/sync-subscribers.worker.ts"
  "src/jobs/workers/notifications.worker.ts"
  "src/jobs/workers/roi.worker.ts"
  "src/jobs/workers/investments.worker.ts"
  "src/jobs/workers/payment.worker.ts"

  "src/scripts/sync-subscribers.ts"
  "src/scripts/seed.ts"
  "src/scripts/migrate.ts"

  "src/database/prisma.service.ts"
  "src/database/seed.ts"

  "src/shared/constants/app.constants.ts"
  "src/shared/constants/role.constants.ts"
  "src/shared/constants/error.constants.ts"

  "src/shared/dto/pagination.dto.ts"
  "src/shared/dto/response.dto.ts"

  "src/shared/errors/AppError.ts"
  "src/shared/errors/NotFoundError.ts"
  "src/shared/errors/ValidationError.ts"

  "src/shared/types/fastify.d.ts"
  "src/shared/types/auth.d.ts"
  "src/shared/types/common.d.ts"

  "src/shared/validators/email.validator.ts"
  "src/shared/validators/mobile.validator.ts"
  "src/shared/validators/password.validator.ts"

  "src/shared/utils/hash.util.ts"
  "src/shared/utils/jwt.util.ts"
  "src/shared/utils/logger.util.ts"
  "src/shared/utils/money.util.ts"
  "src/shared/utils/pagination.util.ts"
  "src/shared/utils/date.util.ts"
)

for file in "${files[@]}"; do
  create_file "$file"
done

#
# Feature modules
#
modules=(
  auth
  users
  subscribers
  uploads
  sync
  wallet
  investments
  payments
  transactions
  admin
)

for module in "${modules[@]}"; do
  create_file "src/modules/${module}/${module}.route.ts"
  create_file "src/modules/${module}/${module}.controller.ts"
  create_file "src/modules/${module}/${module}.service.ts"
  create_file "src/modules/${module}/${module}.repository.ts"
  create_file "src/modules/${module}/${module}.schema.ts"
  create_file "src/modules/${module}/${module}.types.ts"
done

echo ""
echo "✅ Project structure synchronized successfully."