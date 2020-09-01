cd packages/frontend
yarn build
cd ../backend
rm -rf dist
cp -r ../frontend/dist .
rm -rf ../frontend/dist
yarn build
zip -r oare_node.zip build dist package.json yarn.lock
mv oare_node.zip ../..
# cd ../..
# git archive --format=zip --output=oare_node.zip HEAD
# rm -rf ./packages/backend/build
# rm -rf ./packages/backend/dist