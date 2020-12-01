yarn workspace @oare/types build
yarn workspace @oare/oare build
yarn workspace @oare/frontend build
yarn workspace @oare/backend build
cd packages/backend
rm -rf dist
cp -r ../frontend/dist .