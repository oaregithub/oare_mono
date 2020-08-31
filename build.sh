cd packages/frontend
yarn build
cd ../backend
rm -rf dist
cp -r ../frontend/dist .
rm -rf ../frontend/dist
yarn build
cd ../..
stashName=`git stash create`
git archive --format=zip --output=oare_node.zip $stashName ./packages/backend
rm -rf ./packages/backend/build
rm -rf ./packages/backend/dist