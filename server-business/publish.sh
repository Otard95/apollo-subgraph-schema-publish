#!/bin/bash

rover subgraph introspect \
http://localhost:4300/graphql | \
rover subgraph publish TestGraph-5g4zz@dev \
--name business --convert --schema - \
--routing-url http://business/graphql
