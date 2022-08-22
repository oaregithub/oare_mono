cd packages/backend
zip -q -r oare_build.zip build dist package.json yarn.lock @oare
mv oare_build.zip ../..
cd ../..
mkdir oare_build
unzip oare_build.zip -d ./oare_build
cd oare_build
yarn install
cd @oare/oare
yarn install
cd ../..
zip -q -r oare_build.zip build dist package.json yarn.lock @oare node_modules
mv oare_build.zip ../
cd ..
rm -rf oare_build