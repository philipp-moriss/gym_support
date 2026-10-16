/**
 * Архитектурные правила админки (FSD, см. CLAUDE.md в корне).
 * Проверка: npm run lint:deps
 */
const LAYERS = ['app', 'pages', 'widgets', 'features', 'entities', 'shared'];

/** Слой может импортировать только слои ниже себя. */
const layerRules = LAYERS.slice(1).map((layer, i) => ({
  name: `layer-${layer}-no-upward-imports`,
  severity: 'error',
  comment: `${layer} не может импортировать вышестоящие слои.`,
  from: { path: `^src/${layer}/` },
  to: { path: `^src/(${LAYERS.slice(0, i + 1).join('|')})/` },
}));

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
    ...layerRules,
    {
      name: 'no-cross-slice-imports',
      severity: 'error',
      comment: 'Слайсы одного слоя не импортируют друг друга.',
      from: { path: '^src/(pages|widgets|features|entities)/([^/]+)/' },
      to: { path: '^src/$1/', pathNot: '^src/$1/$2/' },
    },
    {
      name: 'slice-public-api-only',
      severity: 'error',
      comment: 'Чужой слайс импортируется только через его index.ts.',
      from: { path: '^src/([^/]+/[^/]+)/' },
      to: {
        path: '^src/(pages|widgets|features|entities)/[^/]+/.+',
        pathNot: ['^src/$1/', '^src/[^/]+/[^/]+/index\\.tsx?$'],
      },
    },
  ],
  options: {
    doNotFollow: { path: 'node_modules' },
    tsConfig: { fileName: 'tsconfig.app.json' },
    tsPreCompilationDeps: true,
    enhancedResolveOptions: { extensions: ['.ts', '.tsx', '.js'] },
  },
};
