yarn workspace @oare/types build
yarn workspace @oare/oare build
yarn workspace @oare/frontend build
yarn workspace @oare/backend build
cd packages/backend
rm -rf dist
cp -r ../frontend/dist .
mkdir @oare
mkdir @oare/oare
cp ../oare/package.json ./@oare/oare
cp -r ../oare/build ./@oare/oare