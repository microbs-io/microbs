#!/bin/bash
set -e

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" <<-EOSQL
    CREATE DATABASE products;
EOSQL

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "products" <<-EOSQL
    CREATE TABLE IF NOT EXISTS products (
        id CHAR ( 8 ) UNIQUE,
        name VARCHAR ( 255 ),
        category VARCHAR ( 255 ),
        price FLOAT,
        rating FLOAT,
        reviews INTEGER,
        filename VARCHAR ( 255 ) ,
        description TEXT,
        alcoholic VARCHAR ( 255 ),
        temperature VARCHAR ( 255 ),
        type VARCHAR ( 255 )
    );
    COPY products
      ( id, name, filename, description, price, rating, reviews, alcoholic, temperature, type )
    FROM '/docker-entrypoint-initdb.d/products.csv'
    WITH (
      FORMAT csv,
      HEADER
    );
EOSQL
