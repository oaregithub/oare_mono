cd packages/oare
yarn build
cd ../frontend
yarn build
cd ../backend
rm -rf dist
cp -r ../frontend/dist .
rm -rf ../frontend/dist
yarn build
# zip -r oare_build.zip build dist package.json yarn.lock
# mv oare_build.zip ../..