FROM node:lts-alpine

WORKDIR /app/website

EXPOSE 3000

COPY --chown=node:node website/ /app/website

USER node
RUN yarn install --audit

CMD ["yarn", "run", "start", "--", "--host", "0.0.0.0"]
