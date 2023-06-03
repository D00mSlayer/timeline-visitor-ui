FROM node:18.12.1-slim

WORKDIR /app

RUN apt-get update \
    && apt-get upgrade -y \
    && apt-get install --no-install-recommends -y git ca-certificates \
    && rm -rf /var/lib/apt/lists/*

RUN npm install -g npm@9.6.6    

RUN git clone https://github.com/D00mSlayer/timeline-visitor-ui.git server-ui
WORKDIR /app/server-ui
RUN rm -rf node_modules/
RUN npm install
ENV PATH /app/server-ui/node_modules/.bin:$PATH

EXPOSE 5002
ENTRYPOINT [ "ng", "serve", "--port", "5002" ]
