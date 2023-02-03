#!/bin/bash

cd /app/tally
npx prisma migrate deploy
cd ..
exec node /app/tally/main.js & exec node /app/tally-worker/main.js