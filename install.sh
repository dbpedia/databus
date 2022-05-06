#cd .git/hooks && ln -s ../../.githooks/pre-commit pre-commit && cd ../..
#git config core.hooksPath .githooks

cd server
npm install

cd ../public
npm install

cd ..


