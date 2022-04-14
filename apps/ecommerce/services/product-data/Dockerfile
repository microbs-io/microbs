FROM postgres:13.2-alpine
COPY ./services/product-data/init.sh /docker-entrypoint-initdb.d/
COPY ./services/product-data/products.csv /docker-entrypoint-initdb.d/
