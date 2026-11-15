import tseslint from 'typescript-eslint';
export default [{ignores:['dist/**','node_modules/**','.test-tmp/**']},{files:['src/**/*.{ts,tsx}'],languageOptions:{parser:tseslint.parser,parserOptions:{ecmaFeatures:{jsx:true}}},plugins:{'@typescript-eslint':tseslint.plugin},rules:{'@typescript-eslint/no-explicit-any':'error'}}];
