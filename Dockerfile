FROM node:16-alpine

WORKDIR /app

COPY . /app/

# Install pnpm
RUN wget -qO- https://get.pnpm.io/install.sh | ENV="$HOME/.bashrc" SHELL="$(which bash)" bash -

RUN pnpm install

EXPOSE 8080

CMD ["/app/node_modules/.bin/preact", "watch"]