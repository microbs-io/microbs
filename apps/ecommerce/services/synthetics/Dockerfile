FROM mcr.microsoft.com/playwright:v1.19.2-focal
COPY ./package.json .
COPY ./src .
RUN yarn install
CMD [ "node", "./src/index.js", "-n", "5" ]
