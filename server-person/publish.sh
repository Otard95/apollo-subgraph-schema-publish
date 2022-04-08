#!/bin/bash

rover subgraph introspect \
http://localhost:4200/graphql | \
rover subgraph publish TestGraph-5g4zz@dev \
--name person --convert --schema - \
--routing-url http://person/graphql
