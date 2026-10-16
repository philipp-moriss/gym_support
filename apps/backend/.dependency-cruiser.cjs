/**
 * Архитектурные правила бэкенда (см. CLAUDE.md в корне).
 * Проверка: npm run lint:deps
 */
const MODULE = '^src/([^/]+)/';

/** Инфраструктурные модули: не знают о домене. Пока их нет — дополнять по мере появления. */
const INFRA = ['__none__'];

/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: 'no-other-apps',
      severity: 'error',
      comment:
        'Проекты в репе независимы: код другого приложения не импортируется.',
      from: {},
      to: { path: '^\\.\\./' },
    },
    {
      name: 'no-circular',
      severity: 'error',
      comment: 'Циклические зависимости запрещены.',
      from: {},
      to: { circular: true },
    },
    {
      name: 'module-public-api-only',
      severity: 'error',
      comment:
        'Другой модуль импортируется только через его index.ts (публичный API).',
      from: { path: MODULE },
      to: {
        path: '^src/[^/]+/.+',
        pathNot: ['^src/$1/', '^src/[^/]+/index\\.ts$'],
      },
    },
    {
      name: 'logic-depends-on-contracts',
      severity: 'error',
      comment:
        'Сервисы, контроллеры и тесты зависят от других модулей только через интерфейсы из shared/contracts (DI-токены).',
      from: { path: '^src/([^/]+)/(services|controllers|tests)/' },
      to: { path: '^src/[^/]+/', pathNot: ['^src/$1/', '^src/shared/'] },
    },
    {
      name: 'shared-is-leaf',
      severity: 'error',
      comment: 'shared не зависит от доменных модулей.',
      from: { path: '^src/shared/' },
      to: { path: '^src/(?!shared/)[^/]+/' },
    },
    {
      name: 'infra-knows-no-domain',
      severity: 'error',
      comment: 'Инфраструктурные модули не знают о домене.',
      from: { path: `^src/(${INFRA.join('|')})/` },
      to: {
        path: '^src/[^/]+/',
        pathNot: ['^src/$1/', '^src/shared/', '^src/config/'],
      },
    },
  ],
  options: {
    doNotFollow: { path: 'node_modules' },
    tsConfig: { fileName: 'tsconfig.json' },
    tsPreCompilationDeps: true,
  },
};
