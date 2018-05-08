FROM node:8-alpine
RUN apk add --update pcsc-lite pcsc-lite-dev ccid
# COPY . /usr/src/app