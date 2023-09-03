# 
expo init sequelize-demo2_1 ou npm i init -y
npm i nodemon -D
npm i express
npm install –save ini

# banco de dados
npm i sequelize mysql2
npm install node-firebird

# arquivo de configuração .env 
npm i dotenv

# moment().format('YYYY/MM/HH')
yarn add moment

# migrations para o sequelize
npx sequelize-cli init
npx sequelize-cli migration:generate --name create-usuario

# manipular migrations
npx sequelize-cli db:migrate
npx sequelize-cli db:migrate:undo:all

# git
winget install --id Git.Git -e --source winget

git init
git -v
git status
git add .
git commit -m "msg - primeiro commit"



# renomear de master para main
git branch -M "main"

git push -u origin main
git remote add origin https://github.com/ivomarcarvalho/sequelize-demo_2_1.git
git push -u origin main