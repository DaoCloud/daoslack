FROM node:0.11.15

WORKDIR /code

ADD . /code
RUN npm install
RUN npm install forever -g

EXPOSE 3000

CMD [ "forever", "index.js" ]
