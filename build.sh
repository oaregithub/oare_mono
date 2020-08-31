cd packages/frontend
yarn build
cd ../backend
rm -rf dist
cp -r ../frontend/dist .
yarn build
git archive --format=zip --output=oare_node.zip HEAD