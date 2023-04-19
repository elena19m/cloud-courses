FROM node:lts-alpine

WORKDIR /app/website

EXPOSE 3000

COPY --chown=node:node website/ /app/website

RUN npm install
USER node

CMD ["npm", "run", "start", "--", "--host", "0.0.0.0"]
