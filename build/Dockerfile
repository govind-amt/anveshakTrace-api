FROM node:20.9.0-slim
WORKDIR /app
RUN chown -R node:node .
USER node
COPY --chown=node:node package.json .
RUN yarn install --immutable && yarn add swagger-ui-express@4.1.6
COPY --chown=node:node dist/apps/anveshak-api/. .
EXPOSE 8980
CMD [ "node", "/app/main.js" ]
