#!/bin/bash

cd /app/sign
npx prisma migrate deploy
cd ..
exec node /app/sign/main.js & exec node /app/sign-worker/main.js